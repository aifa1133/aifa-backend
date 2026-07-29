import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  key: { type: String, required: true },       // email, phone, or userId
  type: { type: String, required: true },       // "email_signup" | "phone_login" | "phone_signup" | "reset" | "email_verify"
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // auto-delete after 10 min
});

otpSchema.index({ key: 1, type: 1 }, { unique: true });

const Otp = mongoose.model("Otp", otpSchema);
export default Otp;
