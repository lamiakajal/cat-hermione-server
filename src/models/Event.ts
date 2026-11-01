import { Schema, model, Document } from "mongoose";

export interface IEvent extends Document {
  title: string;
  category: "Healthcare" | "Relief" | "Education" | "Environment" | "Community";
  eventDate: Date;
  location: string;
  description: string;
  bannerImage: string;
  organizerName: string;
  organizerEmail: string;
  organizerPhoto?: string;
  attendeesCount: number;
  attendees: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["Healthcare", "Relief", "Education", "Environment", "Community"],
    },
    eventDate: { type: Date, required: true },
    location: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    bannerImage: { type: String, required: true },
    organizerName: { type: String, required: true },
    organizerEmail: { type: String, required: true },
    organizerPhoto: { type: String },
    attendeesCount: { type: Number, default: 0 },
    attendees: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const Event = model<IEvent>("Event", EventSchema);
