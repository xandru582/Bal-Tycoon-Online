import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

export const db = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

db.on("error", (err) => {
  console.error("PostgreSQL pool error:", err);
});

export async function connectDB(): Promise<void> {
  const client = await db.connect();
  client.release();
  console.log("✅ PostgreSQL connected");
}

/**
 * Run `fn` inside a single DB transaction. Automatically BEGIN / COMMIT /
 * ROLLBACK on error. Use for any multi-statement read-modify-write that must
 * be atomic (bidding, purchasing, reward claims…).
 *
 * Example:
 *   await withTransaction(async (client) => {
 *     const { rows } = await client.query("SELECT ... FOR UPDATE", [...]);
 *     await client.query("UPDATE ...", [...]);
 *   });
 */
export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch { /* ignore rollback error */ }
    throw err;
  } finally {
    client.release();
  }
}
