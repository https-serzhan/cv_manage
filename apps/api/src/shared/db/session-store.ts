import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import pg from "pg";

import { env } from "../../main/env.js";
import { logger } from "../logger/index.js";

const PgSessionStore = connectPgSimple(session);

const sessionPool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 5
});

sessionPool.on("error", (error) => {
  logger.error("PostgreSQL session pool error.", error);
});

export const sessionStore = new PgSessionStore({
  pool: sessionPool,
  tableName: "user_sessions",
  createTableIfMissing: true
});

export async function disconnectSessionStore() {
  await sessionStore.close();
  await sessionPool.end();
}
