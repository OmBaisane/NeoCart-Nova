import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("5000"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  JWT_SECRET: z.string().min(8, "JWT_SECRET must be at least 8 characters"),
  CLIENT_URL: z.string().url("CLIENT_URL must be a valid URL"),
});

const isProduction = process.env.NODE_ENV === "production";

// Strict Production Guards
if (isProduction) {
  const errors: string[] = [];

  const secret = process.env.JWT_SECRET?.trim() || "";
  if (!secret || secret === "dev_jwt_secret_key_12345" || secret.length < 32) {
    errors.push(
      "JWT_SECRET must be at least 32 characters long in production and not use default dev keys.",
    );
  }

  const mongoUri = process.env.MONGO_URI?.trim() || "";
  if (
    !mongoUri ||
    mongoUri.includes("localhost") ||
    mongoUri.includes("127.0.0.1")
  ) {
    errors.push(
      "MONGO_URI must point to a remote cluster (e.g., MongoDB Atlas) in production.",
    );
  }

  const clientUrl = process.env.CLIENT_URL?.trim() || "";
  if (!clientUrl || clientUrl.includes("localhost")) {
    errors.push(
      "CLIENT_URL must point to your deployed production frontend domain.",
    );
  }

  if (errors.length > 0) {
    console.error(
      "\n❌ FATAL CONFIGURATION ERROR: Production environment failed security checks:",
    );
    errors.forEach((err) => console.error(`  - ${err}`));
    console.error("\nTerminating process.\n");
    process.exit(1);
  }
}

const parsedEnv = envSchema.safeParse({
  PORT: process.env.PORT || "5000",
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URI:
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/neocart_nova",
  JWT_SECRET: process.env.JWT_SECRET || "dev_jwt_secret_key_12345",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
});

if (!parsedEnv.success) {
  console.error("Invalid environment configuration:", parsedEnv.error.format());
  process.exit(1);
}

export const ENV = parsedEnv.data;
