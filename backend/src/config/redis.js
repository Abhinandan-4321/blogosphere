import Redis from "ioredis";

let redisClient = null;

const connectRedis = () => {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
    });

    redisClient.on("connect", () => {
      console.log("Redis Cloud Connected");
    });

    redisClient.on("error", (err) => {
      // Silently handle connection resets and common errors
      if (err.code !== 'ECONNRESET' && err.code !== 'EPIPE') {
        console.error("Redis Connection Error:", err.message);
      }
    });

    redisClient.on("reconnecting", () => {
      console.log("Redis reconnecting...");
    });

    return redisClient;
  } catch (error) {
    console.error("Redis initialization error:", error.message);
    return null;
  }
};

export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error("Redis client not initialized. Call connectRedis() first.");
  }
  return redisClient;
};

export default connectRedis;
