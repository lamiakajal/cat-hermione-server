import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/User.js";
import { Event } from "../models/Event.js";
import { AuthRequest, signToken } from "../middlewares/auth.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { getAuth } from "../config/betterAuth.js";
import {
  asString,
  isEmail,
  isImageSource,
  passwordProblem,
} from "../utils/validate.js";

const publicUser = (u: IUser) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  photoURL: u.photoURL || "",
  role: u.role,
  provider: u.provider,
});

const sessionFor = (u: IUser) => ({
  success: true,
  token: signToken({ id: String(u._id), email: u.email, role: u.role }),
  user: publicUser(u),
});

const clientUrl = (): string =>
  (process.env.CLIENT_URL?.split(",")[0] || "http://localhost:3000").replace(
    /\/$/,
    "",
  );

export const register = async (req: Request, res: Response): Promise<void> => {
  const name = asString(req.body?.name);
  const email = asString(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const photoURL = asString(req.body?.photoURL);

  if (name.length < 2) {
    res.status(400).json({ success: false, message: "Please enter your full name." });
    return;
  }
  if (!isEmail(email)) {
    res.status(400).json({ success: false, message: "Please enter a valid email address." });
    return;
  }
  const pwError = passwordProblem(password);
  if (pwError) {
    res.status(400).json({ success: false, message: pwError });
    return;
  }
  if (photoURL && !isImageSource(photoURL)) {
    res.status(400).json({ success: false, message: "Profile picture must be an image link or an uploaded image." });
    return;
  }

  try {
    if (await User.exists({ email })) {
      res.status(409).json({ success: false, message: "An account with this email already exists." });
      return;
    }
    // BetterAuth stores the credentials (hashed) through its MongoDB adapter
    await getAuth().api.signUpEmail({
      body: { name, email, password, image: photoURL || undefined },
    });
    // App profile used for events, joins and JWT claims
    const user = await User.create({
      name,
      email,
      photoURL: photoURL || undefined,
    });
    res.status(201).json(sessionFor(user));
  } catch (err) {
    console.error("[register]", err);
    res.status(500).json({ success: false, message: "Could not create your account. Try again." });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const email = asString(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!email || !password) {
    res.status(400).json({ success: false, message: "Email and password are required." });
    return;
  }

  try {
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      res.status(401).json({ success: false, message: "Invalid email or password." });
      return;
    }
    if (user.passwordHash) {
      // Accounts created before BetterAuth keep working with their old hash
      if (!(await verifyPassword(password, user.passwordHash))) {
        res.status(401).json({ success: false, message: "Invalid email or password." });
        return;
      }
    } else if (user.provider !== "local") {
      res.status(400).json({
        success: false,
        message: `This account uses ${user.provider === "google" ? "Google" : "GitHub"}. Please use the social login button.`,
      });
      return;
    } else {
      try {
        await getAuth().api.signInEmail({ body: { email, password } });
      } catch {
        res.status(401).json({ success: false, message: "Invalid email or password." });
        return;
      }
    }
    res.status(200).json(sessionFor(user));
  } catch (err) {
    console.error("[login]", err);
    res.status(500).json({ success: false, message: "Login failed. Try again." });
  }
};

// Used by the client to restore a session after a page reload
export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ success: false, message: "Account not found." });
      return;
    }
    res.status(200).json({ success: true, user: publicUser(user) });
  } catch {
    res.status(500).json({ success: false, message: "Could not load your account." });
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const name = asString(req.body?.name);
  const photoURL = asString(req.body?.photoURL);

  if (name.length < 2) {
    res.status(400).json({ success: false, message: "Name must be at least 2 characters." });
    return;
  }
  if (photoURL && !isImageSource(photoURL)) {
    res.status(400).json({ success: false, message: "Profile picture must be an image link or an uploaded image." });
    return;
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user?.id,
      { name, photoURL },
      { new: true },
    );
    if (!user) {
      res.status(404).json({ success: false, message: "Account not found." });
      return;
    }

    // Keep the organizer snapshot on existing events in sync
    await Event.updateMany(
      { organizerEmail: user.email },
      { organizerPhoto: user.photoURL?.startsWith("http") ? user.photoURL : "" },
    );

    res.status(200).json({ success: true, user: publicUser(user) });
  } catch (err) {
    console.error("[updateProfile]", err);
    res.status(500).json({ success: false, message: "Could not update your profile." });
  }
};

/* ---------- GitHub OAuth (authorization code flow) ---------- */

const callbackUrl = (req: Request): string => {
  const base = process.env.SERVER_URL || `${req.protocol}://${req.get("host")}`;
  return `${base.replace(/\/$/, "")}/api/auth/github/callback`;
};

export const githubStart = (req: Request, res: Response): void => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId || !process.env.JWT_SECRET) {
    res.redirect(`${clientUrl()}/login?error=github_not_configured`);
    return;
  }

  // Signed, short-lived state guards the callback against forged requests
  const state = jwt.sign({ purpose: "github-oauth" }, process.env.JWT_SECRET, {
    expiresIn: "10m",
  });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl(req),
    scope: "read:user user:email",
    state,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
};

interface GithubProfile {
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

export const githubCallback = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const fail = (code: string) =>
    res.redirect(`${clientUrl()}/login?error=${code}`);

  const code = asString(req.query.code);
  const state = asString(req.query.state);
  const secret = process.env.JWT_SECRET;
  if (!code || !state || !secret) return fail("github_failed");

  try {
    jwt.verify(state, secret);

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const { access_token: accessToken } = (await tokenRes.json()) as {
      access_token?: string;
    };
    if (!accessToken) return fail("github_failed");

    const ghHeaders = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "unitypulse-server",
    };

    const profile = (await (
      await fetch("https://api.github.com/user", { headers: ghHeaders })
    ).json()) as GithubProfile;

    // The public profile email is often null, so ask for the verified one
    let email = profile.email;
    if (!email) {
      const emails = (await (
        await fetch("https://api.github.com/user/emails", { headers: ghHeaders })
      ).json()) as { email: string; primary: boolean; verified: boolean }[];
      email =
        (Array.isArray(emails) &&
          emails.find((e) => e.primary && e.verified)?.email) ||
        `${profile.login}@users.noreply.github.com`;
    }
    email = email.toLowerCase();

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: profile.name || profile.login,
        email,
        photoURL: profile.avatar_url,
        provider: "github",
      });
    }

    const token = signToken({
      id: String(user._id),
      email: user.email,
      role: user.role,
    });
    res.redirect(`${clientUrl()}/auth/callback?token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error("[githubCallback]", err);
    fail("github_failed");
  }
};

/* ---------- Change password ---------- */

export const changePassword = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const currentPassword =
    typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
  const newPassword =
    typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

  if (!currentPassword) {
    res.status(400).json({ success: false, message: "Enter your current password." });
    return;
  }
  const problem = passwordProblem(newPassword);
  if (problem) {
    res.status(400).json({ success: false, message: problem });
    return;
  }
  if (newPassword === currentPassword) {
    res.status(400).json({ success: false, message: "New password must be different from the current one." });
    return;
  }

  try {
    const user = await User.findById(req.user?.id).select("+passwordHash");
    if (!user) {
      res.status(404).json({ success: false, message: "Account not found." });
      return;
    }
    if (user.provider !== "local") {
      res.status(400).json({
        success: false,
        message: "This account signs in with a social login, so it has no password to change.",
      });
      return;
    }

    if (user.passwordHash) {
      // Account created before BetterAuth
      if (!(await verifyPassword(currentPassword, user.passwordHash))) {
        res.status(401).json({ success: false, message: "Current password is incorrect." });
        return;
      }
      user.passwordHash = await hashPassword(newPassword);
      await user.save();
    } else {
      const auth = getAuth();
      try {
        await auth.api.signInEmail({ body: { email: user.email, password: currentPassword } });
      } catch {
        res.status(401).json({ success: false, message: "Current password is incorrect." });
        return;
      }
      // Update the credential BetterAuth keeps in MongoDB
      const ctx = await auth.$context;
      const found = await ctx.internalAdapter.findUserByEmail(user.email);
      if (!found) throw new Error("BetterAuth user not found");
      await ctx.internalAdapter.updatePassword(
        found.user.id,
        await ctx.password.hash(newPassword),
      );
    }
    res.status(200).json({ success: true, message: "Password updated." });
  } catch (err) {
    console.error("[changePassword]", err);
    res.status(500).json({ success: false, message: "Could not change your password." });
  }
};

/* ---------- Which social logins are configured ---------- */

export const providers = (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  });
};

/* ---------- Google OAuth (authorization code flow) ---------- */

const googleCallbackUrl = (req: Request): string => {
  const base = process.env.SERVER_URL || `${req.protocol}://${req.get("host")}`;
  return `${base.replace(/\/$/, "")}/api/auth/google/callback`;
};

export const googleStart = (req: Request, res: Response): void => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || !process.env.JWT_SECRET) {
    res.redirect(`${clientUrl()}/login?error=social_not_configured`);
    return;
  }
  const state = jwt.sign({ purpose: "google-oauth" }, process.env.JWT_SECRET, {
    expiresIn: "10m",
  });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: googleCallbackUrl(req),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};

export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  const fail = () => res.redirect(`${clientUrl()}/login?error=social_failed`);
  const code = asString(req.query.code);
  const state = asString(req.query.state);
  const secret = process.env.JWT_SECRET;
  if (!code || !state || !secret) return fail();

  try {
    jwt.verify(state, secret);

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: googleCallbackUrl(req),
        grant_type: "authorization_code",
      }),
    });
    const { access_token: accessToken } = (await tokenRes.json()) as {
      access_token?: string;
    };
    if (!accessToken) return fail();

    const profile = (await (
      await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    ).json()) as { email?: string; email_verified?: boolean; name?: string; picture?: string };
    if (!profile.email || profile.email_verified === false) return fail();

    const email = profile.email.toLowerCase();
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: profile.name || email.split("@")[0],
        email,
        photoURL: profile.picture,
        provider: "google",
      });
    }
    const token = signToken({ id: String(user._id), email: user.email, role: user.role });
    res.redirect(`${clientUrl()}/auth/callback?token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error("[googleCallback]", err);
    fail();
  }
};
