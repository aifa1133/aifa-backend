import express from "express";
import {
  register, login, googleLogin, forgotPassword, resetPassword,
  verifyTurnstile,
  sendPhoneOtp, verifyPhoneOtp,
  sendPhoneSignupOtp, verifyPhoneSignupOtp,
  sendEmailOtp, verifyEmailOtp,
  forgotPasswordOtp, verifyResetOtp, resetPasswordOtp,
  guestCheckout,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import Influencer from "../models/Influencer.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/guest-checkout",       guestCheckout);
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

/* Returns a fresh influencer token for a logged-in student whose influencer account
   was created after their last login (so they never got it in the login response) */
router.get("/influencer-token", protect, async (req, res) => {
  try {
    const influencer = await Influencer.findOne({ email: req.user.email?.toLowerCase() }).select("-password");
    if (!influencer || influencer.status !== "active") return res.status(404).json({ message: "No active influencer account" });
    const influencerToken = jwt.sign({ id: influencer._id, role: "influencer" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ influencerToken, influencer: { _id: influencer._id, couponCode: influencer.couponCode } });
  } catch { res.status(500).json({ message: "Server error" }); }
});

export default router;
