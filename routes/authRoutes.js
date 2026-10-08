import express from "express";
import {
  register, login, googleLogin, forgotPassword, resetPassword,
  verifyTurnstile,
  sendPhoneOtp, verifyPhoneOtp,
  sendPhoneSignupOtp, verifyPhoneSignupOtp,
  sendEmailOtp, verifyEmailOtp,
  forgotPasswordOtp, verifyResetOtp, resetPasswordOtp,
  guestCheckout, setGuestPassword, checkPhoneAvailability,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import Influencer from "../models/Influencer.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/guest-checkout",       guestCheckout);
router.post("/set-password",         protect, setGuestPassword);
router.get("/check-phone",           checkPhoneAvailability);
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

/* Returns a fresh influencer token for a logged-in student.
   Auto-creates an influencer account if one doesn't exist yet (every user is an influencer). */
router.get("/influencer-token", protect, async (req, res) => {
  try {
    let influencer = await Influencer.findOne({ email: req.user.email?.toLowerCase() });
    if (!influencer) {
      // Auto-generate a coupon code from name (up to 8 chars, uppercase, strip spaces)
      const base = (req.user.name || "USER").replace(/\s+/g, "").toUpperCase().slice(0, 8);
      let couponCode = base;
      // Ensure uniqueness by appending random digits if needed
      let attempts = 0;
      while (await Influencer.exists({ couponCode })) {
        couponCode = base.slice(0, 5) + Math.floor(100 + Math.random() * 900);
        if (++attempts > 10) { couponCode = base + Date.now().toString().slice(-4); break; }
      }
      influencer = await Influencer.create({
        fullName: req.user.name || "User",
        email: req.user.email.toLowerCase(),
        phone: req.user.phone || "",
        password: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
        couponCode,
        userId: req.user._id,
        status: "active",
      });
    }
    if (influencer.status !== "active") return res.status(403).json({ message: "Influencer account is inactive" });
    const influencerToken = jwt.sign({ id: influencer._id, role: "influencer" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ influencerToken, influencer: { _id: influencer._id, couponCode: influencer.couponCode } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

export default router;
