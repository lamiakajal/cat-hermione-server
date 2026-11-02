export const isHttpUrl = (value: string): boolean => {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

export const isEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

// At least 6 chars with one uppercase and one lowercase letter
export const passwordProblem = (password: string): string | null => {
  if (password.length < 6) return "Password must be at least 6 characters long.";
  if (!/[A-Z]/.test(password)) return "Password needs at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password needs at least one lowercase letter.";
  return null;
};

export const asString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

// Profile pictures may be a web link or a small uploaded image sent as a data URL
export const isImageSource = (value: string): boolean =>
  isHttpUrl(value) ||
  (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(value) &&
    value.length <= 400_000);
