import app from "./app.js";
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import mongoose from "mongoose";

const startServer = async (): Promise<void> => {
  await connectDB();

  const server = app.listen(ENV.PORT, () => {
    console.log(
      `[NeoCart Nova Engine] Server listening on port ${ENV.PORT} in ${ENV.NODE_ENV} mode`,
    );
  });

  let isShuttingDown = false;

  const shutdown = (signal: string): void => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;

    console.log(
      `[NeoCart Nova Engine] ${signal} received. Starting graceful shutdown...`,
    );

    server.close(async (serverError) => {
      if (serverError) {
        console.error(
          "[NeoCart Nova Engine] Error while closing HTTP server:",
          serverError,
        );
        process.exitCode = 1;
      } else {
        console.log("[NeoCart Nova Engine] HTTP server closed.");
      }

      try {
        await mongoose.disconnect();
        console.log(
          "[NeoCart Nova Database] MongoDB connection closed gracefully.",
        );
      } catch (error: unknown) {
        console.error(
          "[NeoCart Nova Database] Error closing MongoDB connection:",
          error,
        );
        process.exitCode = 1;
      }
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

void startServer().catch((error: unknown) => {
  console.error("[NeoCart Nova Engine] Failed to start server:", error);
  process.exitCode = 1;
});
