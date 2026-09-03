import { Redis } from "ioredis";
import { config } from "./config.js";

const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null, // Prevents ioredis from crashing during serverless cold starts
  connectTimeout: 10000,      // Allows up to 10 seconds for cloud TLS handshakes
  family: 4,                  // Forces IPv4 to avoid broken IPv6 routes on Vercel
  retryStrategy(times) {
    if (times > 5) return null; // Stops retrying if the connection is completely dead
    return Math.min(times * 100, 2000);
  },
});

redis.on("error", (err) => {
  console.error("REDIS_ERROR:", err.message);
});

redis.on("connect", () => {
  console.log("REDIS_CONNECTED: Successfully established connection.");
});

export default redis;