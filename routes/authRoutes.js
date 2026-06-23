import express from "express";
import {
  register, login, googleLogin, forgotPassword, resetPassword,
  verifyTurnstile,
  sendPhoneOtp, verifyPhoneOtp,
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

// Phone OTP
router.post("/send-otp",             sendPhoneOtp);
router.post("/verify-otp",           verifyPhoneOtp);

// Email OTP (signup verification)
router.post("/send-email-otp",       sendEmailOtp);
router.post("/verify-email-otp",     verifyEmailOtp);

// Forgot password OTP flow
router.post("/forgot-password-otp",  forgotPasswordOtp);
router.post("/verify-reset-otp",     verifyResetOtp);
router.post("/reset-password-otp",   resetPasswordOtp);

export default router;
