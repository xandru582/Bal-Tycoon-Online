import Redis from "ioredis";
import { env } from "./env.js";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  retryStrategy(times) {
    if (times > 5) return null;
    return Math.min(times * 100, 3000);
  },
});

redis.on("error", (err) => {
  if (!err.message.includes("ECONNREFUSED")) {
    console.error("Redis error:", err.message);
  }
});

export async function connectRedis(): Promise<void> {
  await redis.connect();
  console.log("✅ Redis connected");
}
