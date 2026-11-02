import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  photoURL?: string;
  provider: "local" | "github" | "google";
  role: "user" | "admin";
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Not set for OAuth-only accounts
    passwordHash: { type: String, select: false },
    photoURL: { type: String, trim: true },
    provider: { type: String, enum: ["local", "github", "google"], default: "local" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true },
);

export const User = model<IUser>("User", UserSchema);
