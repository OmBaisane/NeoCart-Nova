import mongoose from "mongoose";
import { ENV } from "./env.js";

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI);
    console.log(
      `[NeoCart Nova Database] MongoDB connected successfully: ${conn.connection.host}`,
    );
  } catch (error) {
    console.error(
      `[NeoCart Nova Database] Error connecting to MongoDB:`,
      error,
    );
    // Exit process with failure if DB connection cannot be established
    process.exit(1);
  }
};

// Handle connection lifecycle events
mongoose.connection.on("disconnected", () => {
  console.warn("[NeoCart Nova Database] MongoDB connection disconnected.");
});

mongoose.connection.on("error", (err) => {
  console.error("[NeoCart Nova Database] MongoDB runtime error:", err);
});
