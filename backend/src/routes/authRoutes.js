import { Router } from "express";
import passport from "passport";
import {
  register,
  login,
  sendOtp,
  verifyOtp,
  googleCallback,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { authenticate } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import { authLimiter, otpLimiter } from "../middlewares/rateLimiter.js";
import {
  registerSchema,
  loginSchema,
  sendOtpSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/authValidator.js";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/send-otp", otpLimiter, validate(sendOtpSchema), sendOtp);
router.post("/verify-otp", otpLimiter, validate(verifyOtpSchema), verifyOtp);
router.post("/refresh-token", refreshToken);
router.post("/logout", authenticate, logout);
router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), resetPassword);

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed`,
  }),
  googleCallback
);

export default router;
