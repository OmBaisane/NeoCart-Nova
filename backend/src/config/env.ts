import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// Validate mandatory production keys
if (isProduction) {
  const missingKeys: string[] = [];

  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET === "dev_jwt_secret_key_12345"
  ) {
    missingKeys.push("JWT_SECRET (must not be default/empty in production)");
  }

  if (
    !process.env.MONGO_URI ||
    process.env.MONGO_URI.includes("localhost") ||
    process.env.MONGO_URI.includes("127.0.0.1")
  ) {
    missingKeys.push(
      "MONGO_URI (must point to a valid cloud database cluster in production)",
    );
  }

  if (missingKeys.length > 0) {
    console.error(
      "FATAL CONFIGURATION ERROR: Production environment is missing required secure parameters:",
    );
    missingKeys.forEach((key) => console.error(` - ${key}`));
    process.exit(1);
  }
}

export const ENV = {
  PORT: process.env.PORT || "5000",
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URI:
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/neocart_nova",
  JWT_SECRET: process.env.JWT_SECRET || "dev_jwt_secret_key_12345",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
};
