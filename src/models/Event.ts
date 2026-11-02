import { Schema, model, Document } from "mongoose";

// "Environment" and "Community" are kept so older documents still validate on update
export const EVENT_TYPES = [
  "Cleanup",
  "Plantation",
  "Donation",
  "Healthcare",
  "Education",
  "Awareness",
  "Relief",
  "Other",
] as const;

const LEGACY_TYPES = ["Environment", "Community"] as const;

export interface IEvent extends Document {
  title: string;
  category: string;
  eventDate: Date;
  location: string;
  description: string;
  bannerImage: string;
  organizerName: string;
  organizerEmail: string;
  contactEmail?: string;
  organizerPhoto?: string;
  attendeesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: [...EVENT_TYPES, ...LEGACY_TYPES],
    },
    eventDate: { type: Date, required: true, index: true },
    location: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    bannerImage: { type: String, required: true },
    organizerName: { type: String, required: true },
    organizerEmail: { type: String, required: true, index: true },
    contactEmail: { type: String, trim: true },
    organizerPhoto: { type: String },
    attendeesCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Event = model<IEvent>("Event", EventSchema);
