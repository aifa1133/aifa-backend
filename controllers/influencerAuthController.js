import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Influencer from "../models/Influencer.js";
import User from "../models/User.js";

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
  createdAt: inf.createdAt,
});

/* POST /api/influencer/auth/login
   Accepts either:
   1. Influencer's own password (set by admin)
   2. Student credentials — if that student is a linked influencer (same email) */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const normalised = String(email).toLowerCase().trim();

    let influencer = await Influencer.findOne({ email: normalised });

    if (influencer) {
      // Try influencer's own password first
      const ok = await influencer.matchPassword(password);
      if (!ok) {
        // Fall back: check if it matches the linked student account's password
        const user = await User.findOne({ email: normalised });
        const studentOk = user && user.password && await bcrypt.compare(password, user.password);
        if (!studentOk) return res.status(401).json({ message: "Invalid email or password" });
      }
    } else {
      // No influencer record found — check if this is a student who is a linked influencer
      const user = await User.findOne({ email: normalised });
      if (!user) return res.status(401).json({ message: "Invalid email or password" });
      const studentOk = user.password && await bcrypt.compare(password, user.password);
      if (!studentOk) return res.status(401).json({ message: "Invalid email or password" });
      // Find influencer linked to this user
      influencer = await Influencer.findOne({ userId: user._id });
      if (!influencer) return res.status(401).json({ message: "No influencer account is linked to this email. Contact AIFA to join." });
    }

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

export { publicProfile };
