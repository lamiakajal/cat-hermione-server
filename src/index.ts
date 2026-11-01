import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import eventRoutes from "./routes/eventRoutes";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());

// Database connection
connectDB();

// API Routes
app.use("/api/events", eventRoutes);

// Root health check
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "UnityPulse Server API running smoothly",
  });
});

app.listen(PORT, () => {
  console.log(`[UnityPulse Server running on port ${PORT}]`);
});

export default app;
