import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import eventRoutes from "./routes/eventRoutes.js";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Allowed client origins for local development and live Vercel deployments
const allowedOrigins = [
  "http://localhost:3000",
  "https://cat-hermione-client.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

// Middleware: Configure CORS with preflight support
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps or curl requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Fallback to allow dynamically across vercel preview URLs
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Handle preflight requests explicitly
app.options("*", cors());

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
