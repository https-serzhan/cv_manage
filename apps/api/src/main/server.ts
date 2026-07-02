import { createApp } from "./app.js";
import { env } from "./env.js";
import { disconnectPrisma } from "../shared/db/prisma.js";
import { logger } from "../shared/logger/index.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`API is running on http://localhost:${env.PORT}`);
});

async function shutdown(signal: NodeJS.Signals) {
  logger.info(`${signal} received. Shutting down API server.`);

  server.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
