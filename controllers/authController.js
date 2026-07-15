
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import PlatformConfig from '../models/PlatformConfig.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function getConfig(key) {
  try {
    const c = await PlatformConfig.findOne({ key }).lean();
    return (c && c.value) ? c.value : process.env[key] || "";
  } catch { return process.env[key] || ""; }
}

// In-memory OTP stores (phone & email OTPs, TTL 10 min)
const phoneOtpStore = new Map(); // phone -> { otp, expiry }
const emailOtpStore = new Map(); // email -> { otp, expiry }
const resetOtpStore = new Map(); // email -> { otp, expiry }

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const normalizeEmail = (email) => {
  if (!email) return email;
  const [local, domain] = email.toLowerCase().trim().split("@");
  return `${local.replace(/\+.*$/, "")}@${domain}`;
};

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

async function checkTurnstile(token) {
  const secretKey = await getConfig("TURNSTILE_SECRET_KEY");
  if (!secretKey || secretKey.trim() === "") return true; // not configured → skip
  if (!token) return false;
  const body = new URLSearchParams({ secret: secretKey, response: token });
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString(),
  });
  const data = await r.json();
  return !!data.success;
}

// Helper to create JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// --- REGISTER ---
export const register = async (req, res) => {
  const { name, phone, password } = req.body;
  const email = normalizeEmail(req.body.email);
  try {
    if (password && /\s/.test(password)) return res.status(400).json({ message: 'Password cannot contain spaces.' });
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, phone, password });
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        role: user.role,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// --- LOGIN (EMAIL/PASSWORD) ---
export const login = async (req, res) => {
  const { password, turnstileToken } = req.body;
  const email = normalizeEmail(req.body.email);
  try {
    const captchaOk = await checkTurnstile(turnstileToken);
    if (!captchaOk) return res.status(400).json({ message: 'CAPTCHA verification failed. Please try again.' });

    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- GOOGLE LOGIN ---


export const googleLogin = async (req, res) => {
  const { token } = req.body; // This is the access_token from React

  try {
    // 1. Fetch user info from Google's UserInfo API using the access_token
    const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
    const payload = await googleRes.json();

    if (!payload.email) {
      return res.status(401).json({ message: "Invalid Google Token" });
    }

    const { email, name, picture } = payload;

    // 2. Find or Create User in MongoDB
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        profilePicture: picture,
        isGoogleUser: true,
        // Create a random password since it's required in some schemas
        password: await bcrypt.hash(Math.random().toString(36), 10) 
      });
    }

    // 3. Generate YOUR AIFA JWT
    const appToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      token: appToken,
      _id: user._id,
      name: user.name,
      role: user.role,
      message: "Login Successful"
    });

  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
// --- FORGOT PASSWORD ---
export const forgotPassword = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/reset-password?token=${resetToken}`;

    const emailUser = await getConfig("EMAIL_USER");
    const emailPass = await getConfig("EMAIL_PASS");
    const fromName  = await getConfig("EMAIL_FROM_NAME") || "AIFA Film Academy";

    const emailConfigured = emailUser && emailPass &&
      !emailUser.includes('your_gmail') && !emailPass.includes('your_gmail');

    if (emailConfigured) {
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: { user: emailUser, pass: emailPass },
      });
      await transporter.sendMail({
        from: `"${fromName}" <${emailUser}>`,
        to: email,
        subject: 'Reset your AIFA password',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#C7E36B">Reset Your Password</h2>
            <p>Hi ${user.name}, click the link below to reset your password. It expires in 1 hour.</p>
            <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#C7E36B;color:#000;border-radius:6px;font-weight:bold;text-decoration:none">Reset Password</a>
            <p style="color:#888;font-size:12px;margin-top:24px">If you didn't request this, ignore this email.</p>
          </div>
        `,
      });
    } else {
      console.log(`[DEV] Password reset link for ${email}: ${resetLink}`);
    }

    res.json({ message: 'Password reset link sent to your email', resetLink: process.env.NODE_ENV !== 'production' ? resetLink : undefined });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- RESET PASSWORD ---
export const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = password;
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch {
    res.status(400).json({ message: 'Invalid or expired reset token' });
  }
};

// --- VERIFY TURNSTILE ---
export const verifyTurnstile = async (req, res) => {
  const { token } = req.body;
  const ok = await checkTurnstile(token);
  if (ok) res.json({ success: true });
  else res.status(400).json({ success: false, message: 'CAPTCHA verification failed' });
};

// --- SEND PHONE OTP ---
export const sendPhoneOtp = async (req, res) => {
  const { phone, turnstileToken } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone number required' });

  const captchaOk = await checkTurnstile(turnstileToken);
  if (!captchaOk) return res.status(400).json({ message: 'CAPTCHA verification failed' });

  const otp = generateOTP();
  phoneOtpStore.set(phone, { otp, expiry: Date.now() + 10 * 60 * 1000 });

  const sid   = await getConfig("TWILIO_SID");
  const token = await getConfig("TWILIO_TOKEN");
  const from  = await getConfig("TWILIO_PHONE");

  if (sid && token && from && !sid.includes("your_")) {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const toPhone = phone.startsWith("+") ? phone : `+91${phone}`;
    const body = new URLSearchParams({
      To: toPhone, From: from,
      Body: `Your AIFA login OTP is ${otp}. Valid for 10 minutes.`
    });
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!r.ok) return res.status(500).json({ message: "Failed to send SMS. Check Twilio credentials." });
  } else {
    console.log(`[DEV] Phone OTP for ${phone}: ${otp}`);
  }
  res.json({ message: "OTP sent" });
};

// --- SEND PHONE OTP (signup — no turnstile, no user required) ---
export const sendPhoneSignupOtp = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone number required' });

  const otp = generateOTP();
  phoneOtpStore.set(phone, { otp, expiry: Date.now() + 10 * 60 * 1000 });

  const sid  = await getConfig("TWILIO_SID");
  const tok  = await getConfig("TWILIO_TOKEN");
  const from = await getConfig("TWILIO_PHONE");

  if (sid && tok && from && !sid.includes("your_")) {
    const auth    = Buffer.from(`${sid}:${tok}`).toString("base64");
    const toPhone = phone.startsWith("+") ? phone : `+91${phone}`;
    const body    = new URLSearchParams({
      To: toPhone, From: from,
      Body: `Your AIFA verification OTP is ${otp}. Valid for 10 minutes. Do not share this code.`,
    });
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      return res.status(500).json({ message: err.message || "Failed to send SMS. Check Twilio credentials." });
    }
  } else {
    console.log(`[DEV] Phone signup OTP for ${phone}: ${otp}`);
  }
  res.json({ message: "OTP sent" });
};

// --- VERIFY PHONE OTP (signup — no user lookup, just validates OTP) ---
export const verifyPhoneSignupOtp = async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ message: 'Phone and OTP required' });

  const record = phoneOtpStore.get(phone);
  if (!record) return res.status(400).json({ message: 'OTP expired or not requested' });
  if (Date.now() > record.expiry) { phoneOtpStore.delete(phone); return res.status(400).json({ message: 'OTP expired' }); }
  if (record.otp !== otp.trim()) return res.status(400).json({ message: 'Invalid OTP' });
  phoneOtpStore.delete(phone);

  res.json({ verified: true });
};

// --- VERIFY PHONE OTP ---
export const verifyPhoneOtp = async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ message: 'Phone and OTP required' });

  const record = phoneOtpStore.get(phone);
  if (!record) return res.status(400).json({ message: 'OTP expired or not requested' });
  if (Date.now() > record.expiry) { phoneOtpStore.delete(phone); return res.status(400).json({ message: 'OTP expired' }); }
  if (record.otp !== otp.trim()) return res.status(400).json({ message: 'Invalid OTP' });
  phoneOtpStore.delete(phone);

  const user = await User.findOne({ phone });
  if (!user) return res.status(404).json({ message: 'No account found with this phone number. Please sign up first.' });

  res.json({ _id: user._id, name: user.name, role: user.role, token: generateToken(user._id) });
};

// --- SEND EMAIL OTP (signup verification) ---
export const sendEmailOtp = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!email) return res.status(400).json({ message: 'Email required' });

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'An account with this email already exists. Please log in.' });

  const otp = generateOTP();
  emailOtpStore.set(email, { otp, expiry: Date.now() + 10 * 60 * 1000 });

  const sent = await sendEmail(email, 'Verify your AIFA email',
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#C7E36B">Verify Your Email</h2>
      <p>Your verification code is:</p>
      <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#C7E36B;margin:16px 0">${otp}</div>
      <p style="color:#888;font-size:12px">Valid for 10 minutes. If you didn't request this, ignore this email.</p>
    </div>`
  );

  if (!sent) console.log(`[DEV] Email OTP for ${email}: ${otp}`);
  res.json({ message: 'OTP sent to your email' });
};

// --- VERIFY EMAIL OTP (signup verification) ---
export const verifyEmailOtp = async (req, res) => {
  const { otp } = req.body;
  const email = normalizeEmail(req.body.email);
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

  const record = emailOtpStore.get(email);
  if (!record) return res.status(400).json({ message: 'OTP expired or not requested. Please resend.' });
  if (Date.now() > record.expiry) { emailOtpStore.delete(email); return res.status(400).json({ message: 'OTP expired. Please resend.' }); }
  if (record.otp !== otp.trim()) return res.status(400).json({ message: 'Invalid OTP' });

  emailOtpStore.delete(email);
  res.json({ message: 'Email verified' });
};

// --- FORGOT PASSWORD OTP ---
export const forgotPasswordOtp = async (req, res) => {
  const { turnstileToken } = req.body;
  const email = normalizeEmail(req.body.email);
  if (!email) return res.status(400).json({ message: 'Email required' });

  const captchaOk = await checkTurnstile(turnstileToken);
  if (!captchaOk) return res.status(400).json({ message: 'CAPTCHA verification failed' });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'No account found with this email' });

  const otp = generateOTP();
  resetOtpStore.set(email, { otp, expiry: Date.now() + 10 * 60 * 1000 });

  const sent = await sendEmail(email, 'Reset your AIFA password',
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#C7E36B">Reset Your Password</h2>
      <p>Hi ${user.name}, your password reset code is:</p>
      <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#C7E36B;margin:16px 0">${otp}</div>
      <p style="color:#888;font-size:12px">Valid for 10 minutes. If you didn't request this, ignore this email.</p>
    </div>`
  );

  if (!sent) console.log(`[DEV] Reset OTP for ${email}: ${otp}`);
  res.json({ message: 'OTP sent to your email' });
};

// --- VERIFY RESET OTP ---
export const verifyResetOtp = async (req, res) => {
  const { otp } = req.body;
  const email = normalizeEmail(req.body.email);
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

  const record = resetOtpStore.get(email);
  if (!record) return res.status(400).json({ message: 'OTP expired or not requested. Please start again.' });
  if (Date.now() > record.expiry) { resetOtpStore.delete(email); return res.status(400).json({ message: 'OTP expired. Please start again.' }); }
  if (record.otp !== otp.trim()) return res.status(400).json({ message: 'Invalid OTP' });

  resetOtpStore.delete(email);

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Issue a short-lived password-reset token
  const resetToken = jwt.sign({ id: user._id, purpose: 'password_reset' }, process.env.JWT_SECRET, { expiresIn: '15m' });
  res.json({ message: 'OTP verified', resetToken });
};

// --- RESET PASSWORD VIA OTP ---
export const resetPasswordOtp = async (req, res) => {
  const { resetToken, password } = req.body;
  if (!resetToken || !password) return res.status(400).json({ message: 'Token and password required' });
  try {
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    if (decoded.purpose !== 'password_reset') return res.status(400).json({ message: 'Invalid token' });
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = password;
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch {
    res.status(400).json({ message: 'Invalid or expired token. Please start again.' });
  }
};

export const createAdmin = async (req, res) => {
  const { secretKey, email, password, name } = req.body;
  if (!process.env.ADMIN_SETUP_KEY || secretKey !== process.env.ADMIN_SETUP_KEY) return res.status(403).json({ message: "Forbidden" });
  if (!email || !password || !name) return res.status(400).json({ message: "email, password, name required" });
  try {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      existing.role = "admin";
      existing.password = await bcrypt.hash(password, 10);
      await existing.save();
      return res.json({ message: "Existing user promoted to admin and password updated", email: existing.email });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase().trim(), password: hashed, role: "admin", isVerified: true });
    res.status(201).json({ message: "Admin created", email: user.email });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
