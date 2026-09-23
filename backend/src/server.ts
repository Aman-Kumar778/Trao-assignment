import { app } from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { logger } from "./lib/logger";

const PORT = parseInt(env.PORT, 10) || 5000;

async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`Traq Backend Service running on port ${PORT} (${env.NODE_ENV})`);
  });
}

startServer();
