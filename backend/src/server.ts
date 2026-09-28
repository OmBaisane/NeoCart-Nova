import app from "./app.js";
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";

const startServer = async () => {
  // Establish database connection prior to binding the HTTP listener
  await connectDB();

  // Start HTTP server listener
  const server = app.listen(ENV.PORT, () => {
    console.log(
      `[NeoCart Nova Engine] Server listening on port ${ENV.PORT} in ${ENV.NODE_ENV} mode`,
    );
  });

  // Handle graceful process termination on operational signals
  const shutdown = () => {
    console.log("Closing HTTP server and database connections gracefully...");
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
};

startServer();
