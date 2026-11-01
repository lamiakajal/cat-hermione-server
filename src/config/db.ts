import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`[MongoDB Connected]: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error("[MongoDB Connection Error]:", error.message);
    } else {
      console.error("[MongoDB Connection Error]:", error);
    }
    process.exit(1);
  }
};
