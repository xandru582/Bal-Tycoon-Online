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
