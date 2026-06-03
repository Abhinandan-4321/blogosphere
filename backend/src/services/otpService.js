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

  // Store OTP in Redis with TTL
  const key = `otp:${user._id}:${method}`;
  await redis.setex(key, OTP_TTL, otp);

  // Always log OTP in development so it's usable even if email fails
  if (process.env.NODE_ENV === "development") {
    console.log(`\n🔐 [DEV] OTP for ${user.email}: ${otp}\n`);
  }

  if (method === OTP_METHODS.EMAIL) {
    await sendOTPEmail(user.email, otp);
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

  const storedOTP = await redis.get(key);

  if (!storedOTP) {
    throw new Error("OTP expired or not found");
  }

  if (storedOTP !== otp) {
    throw new Error("Invalid OTP");
  }

  // Delete OTP after successful verification
  await redis.del(key);

  return true;
};
