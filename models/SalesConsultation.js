import mongoose from "mongoose";

const consultationSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  email:         { type: String, required: true },
  phone:         { type: String },
  preferredDate: { type: String },
  preferredTime: { type: String },
  topic:         { type: String },
  status:        { type: String, enum: ["pending","confirmed","completed","cancelled"], default: "pending" },
  meetLink:      { type: String, default: "" },
  adminNote:     { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("SalesConsultation", consultationSchema);
