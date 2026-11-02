import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

// Built lazily so a missing env var never crashes a cold serverless start
let instance: ReturnType<typeof createAuth> | null = null;

const createAuth = () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const secret = process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET;
  if (!uri) throw new Error("MONGODB_URI is not defined");
  if (!secret) throw new Error("BETTER_AUTH_SECRET or JWT_SECRET is not defined");

  const client = new MongoClient(uri);
  const db = client.db();

  return betterAuth({
    database: mongodbAdapter(db),
    secret,
    baseURL: (process.env.SERVER_URL || "http://localhost:5000").replace(/\/$/, ""),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
      autoSignIn: false,
    },
  });
};

export const getAuth = () => {
  if (!instance) instance = createAuth();
  return instance;
};
