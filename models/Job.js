import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  type:        { type: String, default: "PART-TIME" },
  tag:         { type: String, default: "AI Film" },
  description: { type: String },
  budget:      { type: String },
  timeline:    { type: String },
  skills:      [String],
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("Job", jobSchema);
