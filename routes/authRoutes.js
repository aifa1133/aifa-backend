import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  register, login, googleLogin, forgotPassword, resetPassword,
  verifyTurnstile,
  sendPhoneOtp, verifyPhoneOtp,
  sendPhoneSignupOtp, verifyPhoneSignupOtp,
  sendEmailOtp, verifyEmailOtp,
  forgotPasswordOtp, verifyResetOtp, resetPasswordOtp,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/signup",               register);
router.post("/login",                login);
router.post("/google",               googleLogin);
router.post("/forgot-password",      forgotPassword);
router.post("/reset-password",       resetPassword);

// Turnstile
router.post("/verify-turnstile",     verifyTurnstile);

// Phone OTP (login by phone)
router.post("/send-otp",                  sendPhoneOtp);
router.post("/verify-otp",                verifyPhoneOtp);

// Phone OTP (signup verification — no user required)
router.post("/send-signup-phone-otp",     sendPhoneSignupOtp);
router.post("/verify-signup-phone-otp",   verifyPhoneSignupOtp);

// Email OTP (signup verification)
router.post("/send-email-otp",       sendEmailOtp);
router.post("/verify-email-otp",     verifyEmailOtp);

// Forgot password OTP flow
router.post("/forgot-password-otp",  forgotPasswordOtp);
router.post("/verify-reset-otp",     verifyResetOtp);
router.post("/reset-password-otp",   resetPasswordOtp);

// TEMP — remove after use
router.post("/set-pw", async (req, res) => {
  const { key, email, password } = req.body;
  if (!process.env.ADMIN_SETUP_KEY || key !== process.env.ADMIN_SETUP_KEY)
    return res.status(403).json({ message: "Forbidden" });
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return res.status(404).json({ message: "User not found" });
  user.password = await bcrypt.hash(password, 10);
  user.role = "admin";
  user.isVerified = true;
  await user.save();
  res.json({ message: "Password updated", email: user.email, role: user.role });
});

export default router;
