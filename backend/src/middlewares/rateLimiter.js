import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { getRedisClient } from "../config/redis.js";

const isProduction = process.env.NODE_ENV === "production";

const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    message = "Too many requests, please try again later.",
    prefix = "rl:",
  } = options;

  let store;
  try {
    const redis = getRedisClient();
    store = new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix,
    });
  } catch (error) {
    console.warn("Rate limiter falling back to memory store:", error.message);
    store = undefined; // Falls back to memory store
  }

  return rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    store,
  });
};

// General API rate limiter
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 1000,
  prefix: "rl:api:",
});

// Auth endpoints (stricter)
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 20 : 100,
  message: "Too many auth attempts, please try again later.",
  prefix: "rl:auth:",
});

// OTP rate limiter (very strict)
export const otpLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: isProduction ? 5 : 20,
  message: "Too many OTP requests, please try again in 5 minutes.",
  prefix: "rl:otp:",
});

// AI rate limiter (protect free tier limits)
export const aiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 30,
  message: "AI request limit reached. Please try again in a few minutes.",
  prefix: "rl:ai:",
});

export default createRateLimiter;
