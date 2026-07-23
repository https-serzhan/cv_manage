import { createApp } from "./app.js";
import { env } from "./env.js";
import { disconnectPrisma } from "../shared/db/prisma.js";
import { disconnectSessionStore } from "../shared/db/session-store.js";
import { logger } from "../shared/logger/index.js";

const app = createApp();
const port = Number(process.env.PORT ?? env.PORT);

const server = app.listen(port, "0.0.0.0", () => {
  logger.info(`API is running on http://localhost:${port}`);
});

async function shutdown(signal: NodeJS.Signals) {
  logger.info(`${signal} received. Shutting down API server.`);

  server.close(async () => {
    await disconnectSessionStore();
    await disconnectPrisma();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
