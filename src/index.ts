import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Vercel sits behind a proxy; needed so req.protocol is https
app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:3000",
  ...(process.env.CLIENT_URL?.split(",") ?? []),
].map((o) => o.trim().replace(/\/$/, ""));

app.use(
  cors({
    origin: (origin, callback) => {
      // No origin = curl / server-to-server; *.vercel.app covers preview deploys
      const ok =
        !origin ||
        allowedOrigins.includes(origin) ||
        /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin);
      callback(null, ok);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "1mb" }));

// Connect lazily so a cold serverless start never exits the process
app.use(async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("[db]", err);
    res.status(503).json({ success: false, message: "Database unavailable." });
  }
});

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ status: "success", message: "UnityPulse API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`[server] listening on port ${PORT}`));
}

export default app;
