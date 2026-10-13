import mongoose from "mongoose";

const toolSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  badge:    { type: String, default: "AI CHAT" },
  desc:     { type: String, default: "" },
  logoUrl:  { type: String, default: "" },
  logoText: { type: String, default: "" },
  bgColor:  { type: String, default: "from-[#6366f1]/20 to-[#4338ca]/10" },
  order:    { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("Tool", toolSchema);
