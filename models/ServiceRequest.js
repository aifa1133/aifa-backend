import mongoose from "mongoose";

const serviceRequestSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true },
  phone:     { type: String },
  company:   { type: String },
  service:   { type: String, enum: ["corporate-training","curriculum-consulting","production-support","ai-content"], required: true },
  message:   { type: String },
  budget:    { type: String },
  status:    { type: String, enum: ["new","in-progress","completed","rejected"], default: "new" },
  adminNote: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("ServiceRequest", serviceRequestSchema);
