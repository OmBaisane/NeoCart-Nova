import app from "./app.js";
import { ENV } from "./config/env.js";

const server = app.listen(ENV.PORT, () => {
  console.log(
    `[NeoCart Nova Engine] Server listening on port ${ENV.PORT} in ${ENV.NODE_ENV} mode`,
  );
});

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received. Closing HTTP server gracefully.");
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
});
