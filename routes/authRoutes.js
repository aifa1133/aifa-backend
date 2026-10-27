import express from "express";
import {
  register, login, googleLogin, forgotPassword, resetPassword,
  verifyTurnstile,
  sendPhoneOtp, verifyPhoneOtp,
  sendPhoneSignupOtp, verifyPhoneSignupOtp,
  sendEmailOtp, verifyEmailOtp,
  forgotPasswordOtp, verifyResetOtp, resetPasswordOtp,
  guestCheckout, setGuestPassword, checkPhoneAvailability, checkEmailAvailability,
  trackReferralClick, linkReferral,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import Influencer from "../models/Influencer.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/guest-checkout",       guestCheckout);
router.post("/set-password",         protect, setGuestPassword);
router.get("/check-phone",           checkPhoneAvailability);
router.get("/check-email",           checkEmailAvailability);
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

// Referral tracking
router.post("/track-referral-click",  trackReferralClick);
router.post("/link-referral",         protect, linkReferral);

// Forgot password OTP flow
router.post("/forgot-password-otp",  forgotPasswordOtp);
router.post("/verify-reset-otp",     verifyResetOtp);
router.post("/reset-password-otp",   resetPasswordOtp);

/* Returns a fresh influencer token for a logged-in student.
   Only succeeds if the admin has already created an influencer account for this email. */
router.get("/influencer-token", protect, async (req, res) => {
  try {
    const influencer = await Influencer.findOne({ email: req.user.email?.toLowerCase() });
    if (!influencer) return res.status(403).json({ message: "No influencer account found." });
    if (influencer.status !== "active") return res.status(403).json({ message: "Influencer account is inactive." });
    const influencerToken = jwt.sign({ id: influencer._id, role: "influencer" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ influencerToken, influencer: { _id: influencer._id, couponCode: influencer.couponCode } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

export default router;
