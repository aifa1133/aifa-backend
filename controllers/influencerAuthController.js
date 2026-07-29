import jwt from "jsonwebtoken";
import Influencer from "../models/Influencer.js";

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

/* POST /api/influencer/auth/login */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const influencer = await Influencer.findOne({ email: String(email).toLowerCase().trim() });
    if (!influencer) return res.status(401).json({ message: "Invalid email or password" });

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

export { publicProfile };
