import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Influencer from "../models/Influencer.js";
import Otp from "../models/Otp.js";
import { sendInfluencerWelcome, sendInfluencerPasswordReset } from "../utils/mailer.js";

const signToken = (id) =>
  jwt.sign({ id, role: "influencer" }, process.env.JWT_SECRET, { expiresIn: "7d" });

const publicProfile = (inf) => ({
  _id: inf._id,
  fullName: inf.fullName,
  email: inf.email,
  phone: inf.phone,
  country: inf.country,
  city: inf.city,
  profilePhoto: inf.profilePhoto,
  instagram: inf.instagram,
  youtube: inf.youtube,
  linkedin: inf.linkedin,
  otherSocial: inf.otherSocial,
  couponCode: inf.couponCode,
  referralLink: inf.referralLink,
  couponCommissionRate: inf.couponCommissionRate,
  referralCommissionRate: inf.referralCommissionRate,
  bankAccountHolder: inf.bankAccountHolder,
  bankName: inf.bankName,
  bankAccountNumber: inf.bankAccountNumber,
  bankIFSC: inf.bankIFSC,
  upiId: inf.upiId,
  status: inf.status,
  mustChangePassword: inf.mustChangePassword ?? false,
  createdAt: inf.createdAt,
});

/* POST /api/influencer/auth/login */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const normalised = String(email).toLowerCase().trim();

    const influencer = await Influencer.findOne({ email: normalised });
    if (!influencer) {
      return res.status(401).json({ message: "No influencer account found for this email. Contact AIFA to join." });
    }

    const ok = await influencer.matchPassword(password);
    if (!ok) return res.status(401).json({ message: "Invalid email or password" });

    if (influencer.status !== "active") {
      return res.status(403).json({ message: "Your influencer account is inactive. Contact AIFA support." });
    }

    res.json({ token: signToken(influencer._id), influencer: publicProfile(influencer) });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

/* GET /api/influencer/auth/me */
export const getMe = async (req, res) => {
  try {
    res.json(publicProfile(req.influencer));
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

/* POST /api/influencer/auth/forgot-password */
export const forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    if (!email) return res.status(400).json({ message: "Email is required" });

    const influencer = await Influencer.findOne({ email });
    // Always return 200 to avoid email enumeration
    if (!influencer) return res.json({ message: "If that email is registered, you will receive a reset code." });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await Otp.deleteMany({ key: email, type: "influencer_reset" });
    await Otp.create({ key: email, type: "influencer_reset", otp: code });

    await sendInfluencerPasswordReset({ to: email, name: influencer.fullName, code });
    res.json({ message: "If that email is registered, you will receive a reset code." });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

/* POST /api/influencer/auth/reset-password */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) return res.status(400).json({ message: "Email, OTP and new password are required" });
    if (String(password).length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

    const normalised = String(email).toLowerCase().trim();
    const record = await Otp.findOne({ key: normalised, type: "influencer_reset", otp: String(otp) });
    if (!record) return res.status(400).json({ message: "Invalid or expired reset code. Please request a new one." });

    const influencer = await Influencer.findOne({ email: normalised });
    if (!influencer) return res.status(404).json({ message: "Account not found" });

    influencer.password = String(password);
    await influencer.save({ validateModifiedOnly: true });
    await Otp.deleteMany({ key: normalised, type: "influencer_reset" });

    res.json({ message: "Password updated successfully. You can now log in." });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

/* POST /api/influencer/auth/change-password  (requires auth) */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const influencer = await Influencer.findById(req.influencer._id);
    const ok = await influencer.matchPassword(currentPassword);
    if (!ok) return res.status(400).json({ message: "Current password is incorrect" });

    influencer.password = String(newPassword);
    influencer.mustChangePassword = false;
    await influencer.save();

    res.json({ message: "Password updated successfully", influencer: publicProfile(influencer) });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

export { publicProfile };
