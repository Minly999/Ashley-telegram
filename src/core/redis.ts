import { Redis } from "ioredis";
import { config } from "./config.js";

const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on("error", (err) => {
  console.error("REDIS_ERROR:", err.message);
});

redis.on("connect", () => {
  if (config.NODE_ENV === "development") {
    console.log("REDIS_CONNECTED: Successfully established connection.");
  }
});

export default redis;