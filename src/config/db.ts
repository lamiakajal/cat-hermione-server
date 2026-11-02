import mongoose from "mongoose";

// Reuse one connection across warm serverless invocations
let connecting: Promise<typeof mongoose> | null = null;

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) return;

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  if (!connecting) {
    connecting = mongoose.connect(mongoUri).catch((err) => {
      connecting = null; // let the next request retry
      throw err;
    });
  }
  const conn = await connecting;
  console.log(`[MongoDB] connected to ${conn.connection.host}`);
};
