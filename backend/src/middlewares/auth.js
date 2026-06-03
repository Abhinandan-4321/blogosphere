import { verifyAccessToken } from "../utils/token.js";
import { sendError } from "../utils/apiResponse.js";
import { getRedisClient } from "../config/redis.js";
import User from "../models/User.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, 401, "Access denied. No token provided.");
    }

    const token = authHeader.split(" ")[1];

    // Check if token is blacklisted in Redis
    try {
      const redis = getRedisClient();
      const isBlacklisted = await redis.get(`bl:${token}`);
      if (isBlacklisted) {
        return sendError(res, 401, "Token has been invalidated");
      }
    } catch (redisErr) {
      // If Redis is down, continue without blacklist check
      console.warn("Redis blacklist check failed:", redisErr.message);
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return sendError(res, 401, "User not found");
    }

    if (!user.isApproved) {
      return sendError(res, 403, "Your account is pending admin approval");
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return sendError(res, 401, "Token expired");
    }
    return sendError(res, 401, "Invalid token");
  }
};

// Optional auth - doesn't fail if no token, just attaches user if present
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select("-password");

    if (user && user.isApproved) {
      req.user = user;
      req.token = token;
    }
  } catch (error) {
    // Silently continue without user
  }
  next();
};
