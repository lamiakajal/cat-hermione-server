import { Schema, model, Document, Types } from "mongoose";

// One document per (event, user) pair
export interface IJoin extends Document {
  event: Types.ObjectId;
  userEmail: string;
  userName: string;
  userPhoto?: string;
  createdAt: Date;
}

const JoinSchema = new Schema<IJoin>(
  {
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    userEmail: { type: String, required: true, lowercase: true, trim: true },
    userName: { type: String, required: true },
    userPhoto: { type: String },
  },
  { timestamps: true },
);

// Blocks double-joins even when two requests race
JoinSchema.index({ event: 1, userEmail: 1 }, { unique: true });
JoinSchema.index({ userEmail: 1 });

export const Join = model<IJoin>("Join", JoinSchema);
