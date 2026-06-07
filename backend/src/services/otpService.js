import crypto from "crypto";
import { getRedisClient } from "../config/redis.js";
import { sendOTPEmail } from "./emailService.js";
import { sendOTPSMS } from "./smsService.js";
import { OTP_METHODS, OTP_TTL } from "../utils/constants.js";

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export const sendOTP = async (user, method) => {
  const otp = generateOTP();
  const redis = getRedisClient();

  // Store OTP in Redis with TTL (timeout to prevent hanging)
  const key = `otp:${user._id}:${method}`;
  await Promise.race([
    redis.setex(key, OTP_TTL, otp),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Redis OTP store timeout')), 3000))
  ]);

  // Always log OTP in development so it's usable even if email fails
  if (process.env.NODE_ENV === "development") {
    console.log(`\n🔐 [DEV] OTP for ${user.email}: ${otp}\n`);
  }

  if (method === OTP_METHODS.EMAIL) {
    try {
      await sendOTPEmail(user.email, otp);
    } catch (emailErr) {
      console.error(`OTP email send failed: ${emailErr.message}`);
      // In production, OTP is stored in Redis - user can still verify if they received the email
      // In development, OTP is logged above
      if (process.env.NODE_ENV === "production") {
        throw new Error("Failed to send verification email. Please try again later.");
      }
    }
  } else if (method === OTP_METHODS.SMS) {
    if (!user.phone) {
      throw new Error("Phone number not registered");
    }
    await sendOTPSMS(user.phone, otp);
  } else {
    throw new Error("Invalid OTP method");
  }

  return { method, expiresIn: OTP_TTL };
};

export const verifyOTP = async (userId, otp, method) => {
  const redis = getRedisClient();
  const key = `otp:${userId}:${method}`;

  const storedOTP = await Promise.race([
    redis.get(key),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Redis OTP fetch timeout')), 3000))
  ]);

  if (!storedOTP) {
    throw new Error("OTP expired or not found");
  }

  if (storedOTP !== otp) {
    throw new Error("Invalid OTP");
  }

  // Delete OTP after successful verification (fire-and-forget)
  redis.del(key).catch(err => console.warn('Redis OTP delete failed:', err.message));

  return true;
};
