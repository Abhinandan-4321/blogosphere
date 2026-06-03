import { getRedisClient } from "../config/redis.js";
import { CACHE_TTL } from "../utils/constants.js";

export const getCache = async (key) => {
  try {
    const redis = getRedisClient();
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn("Cache get error:", error.message);
    return null;
  }
};

export const setCache = async (key, data, ttl = CACHE_TTL.MEDIUM) => {
  try {
    const redis = getRedisClient();
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.warn("Cache set error:", error.message);
  }
};

export const deleteCache = async (key) => {
  try {
    const redis = getRedisClient();
    await redis.del(key);
  } catch (error) {
    console.warn("Cache delete error:", error.message);
  }
};

export const deleteCachePattern = async (pattern) => {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.warn("Cache pattern delete error:", error.message);
  }
};

export const incrementCache = async (key) => {
  try {
    const redis = getRedisClient();
    return await redis.incr(key);
  } catch (error) {
    console.warn("Cache increment error:", error.message);
    return null;
  }
};
