import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthUser {
  id: string;
  email: string;
  role: "user" | "admin";
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

const readToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.split(" ")[1] : null;
};

const decode = (token: string): AuthUser => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return jwt.verify(token, secret) as AuthUser;
};

export const signToken = (user: AuthUser): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn: "7d" },
  );
};

// Rejects the request unless a valid Bearer token is present
export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const token = readToken(req);
  if (!token) {
    res
      .status(401)
      .json({ success: false, message: "Please log in to continue." });
    return;
  }

  try {
    req.user = decode(token);
    next();
  } catch {
    res.status(403).json({
      success: false,
      message: "Your session has expired. Please log in again.",
    });
  }
};

// Attaches the user when a valid token is sent, never blocks the request
export const optionalAuth = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): void => {
  const token = readToken(req);
  if (token) {
    try {
      req.user = decode(token);
    } catch {
      // treat a bad token like an anonymous visitor
    }
  }
  next();
};
