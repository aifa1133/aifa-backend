import User from "../models/User.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import PlatformConfig from "../models/PlatformConfig.js";

const emailVerifyOtpStore = new Map(); // userId -> { otp, expiry }

async function getConfig(key) {
  try {
    const c = await PlatformConfig.findOne({ key }).lean();
    return (c && c.value) ? c.value : process.env[key] || "";
  } catch { return process.env[key] || ""; }
}

async function sendEmail(to, subject, html) {
  const emailUser = await getConfig("EMAIL_USER");
  const emailPass = await getConfig("EMAIL_PASS");
  const fromName  = await getConfig("EMAIL_FROM_NAME") || "AIFA Film Academy";
  if (!emailUser || !emailPass || emailUser.includes("your_gmail")) return false;
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: { user: emailUser, pass: emailPass },
  });
  await transporter.sendMail({ from: `"${fromName}" <${emailUser}>`, to, subject, html });
  return true;
}

export const sendVerifyEmailOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.emailVerified) return res.status(400).json({ message: "Email is already verified" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    emailVerifyOtpStore.set(String(user._id), { otp, expiry: Date.now() + 10 * 60 * 1000 });

    const sent = await sendEmail(user.email, "Verify your AIFA email",
      `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#C7E36B">Verify Your Email</h2>
        <p>Hi ${user.name}, your verification code is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#C7E36B;margin:16px 0">${otp}</div>
        <p style="color:#888;font-size:12px">Valid for 10 minutes.</p>
      </div>`
    );
    if (!sent) console.log(`[DEV] Email verify OTP for ${user.email}: ${otp}`);
    res.json({ message: "OTP sent to your email" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const verifyUserEmailOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = String(req.user._id);
    const record = emailVerifyOtpStore.get(userId);
    if (!record) return res.status(400).json({ message: "OTP expired or not requested. Please resend." });
    if (Date.now() > record.expiry) { emailVerifyOtpStore.delete(userId); return res.status(400).json({ message: "OTP expired. Please resend." }); }
    if (record.otp !== String(otp).trim()) return res.status(400).json({ message: "Invalid OTP" });

    emailVerifyOtpStore.delete(userId);
    await User.findByIdAndUpdate(userId, { emailVerified: true });
    res.json({ message: "Email verified successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("enrolledCourses", "title image duration price")
      .populate("enrolledWorkshops", "title image duration price scheduledAt")
      .populate("enrolledBootcamps", "title image duration price startDate");
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, profilePicture, socialLinks } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (profilePicture !== undefined) updates.profilePicture = profilePicture;
    if (socialLinks !== undefined) updates.socialLinks = socialLinks;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const setInitialPassword = async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });
  if (/\s/.test(password)) return res.status(400).json({ message: "Password cannot contain spaces." });
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.password = password;
    await user.save();
    res.json({ message: "Password set successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user.password) return res.status(400).json({ message: "Password change not available for Google accounts" });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: "Current password is incorrect" });
    user.password = newPassword;
    await user.save();
    res.json({ message: "Password changed successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password")
      .populate("enrolledCourses",    "title image")
      .populate("enrolledWorkshops",  "title")
      .populate("enrolledBootcamps",  "title");
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateNotificationPrefs = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { notificationPrefs: req.body },
      { new: true }
    ).select("notificationPrefs");
    res.json(user.notificationPrefs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const getStudentStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("enrolledCourses enrolledWorkshops enrolledBootcamps courseProgress");
    const completedCount = user.courseProgress?.filter(p => p.percentComplete >= 100).length || 0;
    res.json({
      enrolledCourses:  user.enrolledCourses?.length  || 0,
      enrolledWorkshops:user.enrolledWorkshops?.length|| 0,
      enrolledBootcamps:user.enrolledBootcamps?.length|| 0,
      completedCourses: completedCount,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
