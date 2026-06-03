import Redis from "ioredis";

let redisClient = null;

const connectRedis = () => {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisClient.on("connect", () => {
      console.log("Redis Cloud Connected");
    });

    redisClient.on("error", (err) => {
      console.error("Redis Connection Error:", err.message);
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
