import mongoose from "mongoose";

const workshopSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  image: { type: String, default: "" },
  price: { type: Number, required: true },
  currency: { type: String, enum: ["INR", "USD"], default: "INR" },
  duration: { type: String, default: "" },
  mode: { type: String, enum: ["ONLINE", "OFFLINE"], default: "ONLINE" },
  scheduledAt: { type: Date },
  seats: { type: Number, default: 50 },
  registrations: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isPublished: { type: Boolean, default: false },
  ctaText:     { type: String, default: "Reserve Spot" },
  ctaType:     { type: String, enum: ["EXTERNAL", "INTERNAL"], default: "INTERNAL" },
  ctaUrl:      { type: String, default: "" },
  sessionCode: { type: String, default: "" },
  trainer:     { type: String, default: "" },
  zoomLink:    { type: String, default: "" },
  endTime:     { type: String, default: "" },
  isCancelled:      { type: Boolean, default: false },
  learningOutcomes: [{ title: String, description: String }],
  projects:         [{ label: String, title: String, image: String, description: String }],
  targetAudience:   [{ title: String, description: String }],
  faqs:             [{ question: String, answer: String }],
  testimonials:     [{ name: String, role: String, avatar: String, quote: String }],
  previewVideoUrl:  { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("Workshop", workshopSchema);
