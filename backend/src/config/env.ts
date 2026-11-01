import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z
  .object({
    PORT: z.coerce
      .number()
      .int()
      .min(1, "PORT must be between 1 and 65535")
      .max(65535, "PORT must be between 1 and 65535")
      .default(5000),

    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    MONGO_URI: z.string().trim().min(1, "MONGO_URI is required"),

    JWT_SECRET: z
      .string()
      .trim()
      .min(8, "JWT_SECRET must be at least 8 characters"),

    CLIENT_URL: z.string().trim().url("CLIENT_URL must be a valid URL"),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") return;

    if (
      env.JWT_SECRET.length < 32 ||
      env.JWT_SECRET === "dev_jwt_secret_key_12345"
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["JWT_SECRET"],
        message:
          "Production JWT_SECRET must be at least 32 characters and must not use the default development secret.",
      });
    }

    const mongoUri = env.MONGO_URI.toLowerCase();

    if (
      mongoUri.includes("localhost") ||
      mongoUri.includes("127.0.0.1") ||
      mongoUri.includes("[::1]")
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["MONGO_URI"],
        message: "Production MONGO_URI must point to a remote database.",
      });
    }

    let clientUrl: URL | null = null;

    try {
      clientUrl = new URL(env.CLIENT_URL);
    } catch {
      // URL validation is also handled by the schema.
    }

    if (
      !clientUrl ||
      clientUrl.protocol !== "https:" ||
      clientUrl.hostname === "localhost" ||
      clientUrl.hostname === "127.0.0.1" ||
      clientUrl.hostname === "::1"
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["CLIENT_URL"],
        message:
          "Production CLIENT_URL must be a valid HTTPS URL for the deployed frontend.",
      });
    }
  });

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
  console.error(
    "\n❌ Invalid environment configuration:",
    parsedEnv.error.format(),
  );
  process.exit(1);
}

export const ENV = parsedEnv.data;
