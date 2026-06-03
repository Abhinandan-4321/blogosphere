import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import { generateTokenPair, verifyRefreshToken } from "../utils/token.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { sendOTP, verifyOTP } from "../services/otpService.js";
import { sendPasswordResetEmail } from "../services/emailService.js";
import { getRedisClient } from "../config/redis.js";

// @desc    Register a new user
// @route   POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Allow resending OTP if user registered but never verified
      if (!existingUser.isVerified) {
        let emailError = null;
        let otpResult = { method: "email", expiresIn: 300 };
        try {
          otpResult = await sendOTP(existingUser, "email");
        } catch (err) {
          emailError = err.message;
          console.error("OTP resend failed:", err.message);
        }
        return sendSuccess(res, 200, "OTP resent. Please verify your email.", {
          userId: existingUser._id,
          otpSentVia: otpResult.method,
          otpExpiresIn: otpResult.expiresIn,
          ...(emailError && { emailError: "Email delivery failed — check server logs" }),
        });
      }
      return sendError(res, 409, "Email already registered");
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      phone: phone || "",
      password: hashedPassword,
      isApproved: true,
      isVerified: false,
    });

    // Send OTP for email verification — non-fatal if email fails
    let emailError = null;
    let otpResult = { method: "email", expiresIn: 300 };
    try {
      otpResult = await sendOTP(user, "email");
    } catch (err) {
      emailError = err.message;
      console.error("OTP email send failed:", err.message);
    }

    return sendSuccess(res, 201, "Registration successful. Please verify your email.", {
      userId: user._id,
      otpSentVia: otpResult.method,
      otpExpiresIn: otpResult.expiresIn,
      ...(emailError && { emailError: "Email delivery failed — check server logs" }),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return sendError(res, 401, "Invalid email or password");
    }

    if (!user.password) {
      return sendError(
        res,
        401,
        "This account uses Google login. Please sign in with Google."
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 401, "Invalid email or password");
    }

    if (!user.isVerified) {
      return sendError(res, 403, "Please verify your email first");
    }

    // Check if 2FA is enabled
    if (user.is2FAEnabled) {
      const otpResult = await sendOTP(user, user.preferred2FA);
      return sendSuccess(res, 200, "2FA verification required", {
        requires2FA: true,
        userId: user._id,
        method: user.preferred2FA,
        otpExpiresIn: otpResult.expiresIn,
      });
    }

    const tokens = generateTokenPair(user);

    // Store refresh token in Redis
    try {
      const redis = getRedisClient();
      await redis.setex(
        `rt:${user._id}`,
        7 * 24 * 60 * 60,
        tokens.refreshToken
      );
    } catch (redisErr) {
      console.warn("Redis refresh token store failed:", redisErr.message);
    }

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      is2FAEnabled: user.is2FAEnabled,
      hasPickedAvatar: user.hasPickedAvatar || false,
    };

    return sendSuccess(res, 200, "Login successful", {
      user: userResponse,
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send OTP (for 2FA or verification)
// @route   POST /api/auth/send-otp
export const sendOtp = async (req, res, next) => {
  try {
    const { method } = req.body;
    const userId = req.body.userId || req.user?._id;

    if (!userId) {
      return sendError(res, 400, "User ID is required");
    }

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 404, "User not found");
    }

    let emailError = null;
    let otpResult = { method, expiresIn: 300 };
    try {
      otpResult = await sendOTP(user, method);
    } catch (err) {
      emailError = err.message;
      console.error("OTP send failed:", err.message);
    }

    return sendSuccess(res, 200, `OTP sent via ${method}`, {
      expiresIn: otpResult.expiresIn,
      ...(emailError && { emailError: "Email delivery failed — check server logs" }),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
export const verifyOtp = async (req, res, next) => {
  try {
    const { otp, method } = req.body;
    const userId = req.body.userId || req.user?._id;

    if (!userId) {
      return sendError(res, 400, "User ID is required");
    }

    await verifyOTP(userId, otp, method);

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 404, "User not found");
    }

    // Mark as verified if not already
    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    // If this was email verification, issue tokens
    if (user.isVerified) {
      const tokens = generateTokenPair(user);

      try {
        const redis = getRedisClient();
        await redis.setex(
          `rt:${user._id}`,
          7 * 24 * 60 * 60,
          tokens.refreshToken
        );
      } catch (redisErr) {
        console.warn("Redis refresh token store failed:", redisErr.message);
      }

      const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        hasPickedAvatar: user.hasPickedAvatar || false,
      };

      return sendSuccess(res, 200, "Verification successful", {
        user: userResponse,
        ...tokens,
      });
    }

    return sendSuccess(res, 200, "Email verified successfully.");
  } catch (error) {
    if (
      error.message === "OTP expired or not found" ||
      error.message === "Invalid OTP"
    ) {
      return sendError(res, 400, error.message);
    }
    next(error);
  }
};

// @desc    Google OAuth callback handler
// @route   GET /api/auth/google/callback
export const googleCallback = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      console.error("Google OAuth: No user found in request");
      return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
    }

    console.log("Google OAuth success for user:", user.email);

    const tokens = generateTokenPair(user);

    try {
      const redis = getRedisClient();
      await Promise.race([
        redis.setex(`rt:${user._id}`, 7 * 24 * 60 * 60, tokens.refreshToken),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 3000))
      ]);
    } catch (redisErr) {
      console.warn("Redis refresh token store failed:", redisErr.message);
    }

    // Redirect to frontend with tokens
    res.redirect(
      `${process.env.CLIENT_URL}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`
    );
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return sendError(res, 400, "Refresh token is required");
    }

    const decoded = verifyRefreshToken(token);

    // Verify refresh token exists in Redis
    try {
      const redis = getRedisClient();
      const storedToken = await redis.get(`rt:${decoded.id}`);
      if (!storedToken || storedToken !== token) {
        return sendError(res, 401, "Invalid refresh token");
      }
    } catch (redisErr) {
      console.warn("Redis refresh token check failed:", redisErr.message);
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return sendError(res, 401, "User not found");
    }

    const tokens = generateTokenPair(user);

    // Update refresh token in Redis
    try {
      const redis = getRedisClient();
      await redis.setex(
        `rt:${user._id}`,
        7 * 24 * 60 * 60,
        tokens.refreshToken
      );
    } catch (redisErr) {
      console.warn("Redis refresh token update failed:", redisErr.message);
    }

    return sendSuccess(res, 200, "Token refreshed", tokens);
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return sendError(res, 401, "Invalid or expired refresh token");
    }
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
export const logout = async (req, res, next) => {
  try {
    const token = req.token;
    const userId = req.user._id;

    try {
      const redis = getRedisClient();
      // Blacklist the access token
      await redis.setex(`bl:${token}`, 15 * 60, "1"); // 15 min TTL
      // Remove refresh token
      await redis.del(`rt:${userId}`);
    } catch (redisErr) {
      console.warn("Redis logout cleanup failed:", redisErr.message);
    }

    return sendSuccess(res, 200, "Logged out successfully");
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists
      return sendSuccess(
        res,
        200,
        "If the email is registered, a reset link has been sent."
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    await sendPasswordResetEmail(user.email, resetToken);

    return sendSuccess(
      res,
      200,
      "If the email is registered, a reset link has been sent."
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpiry");

    if (!user) {
      return sendError(res, 400, "Invalid or expired reset token");
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save();

    // Invalidate all existing sessions
    try {
      const redis = getRedisClient();
      await redis.del(`rt:${user._id}`);
    } catch (redisErr) {
      console.warn("Redis session cleanup failed:", redisErr.message);
    }

    return sendSuccess(res, 200, "Password reset successful");
  } catch (error) {
    next(error);
  }
};
