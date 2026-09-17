import app from "./app.js";
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";

const startServer = async () => {
  // 1. Pehle database connect hoga
  await connectDB();

  // 2. Phir server listen karega
  const server = app.listen(ENV.PORT, () => {
    console.log(
      `[NeoCart Nova Engine] Server listening on port ${ENV.PORT} in ${ENV.NODE_ENV} mode`,
    );
  });

  // Graceful shutdown handling
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
