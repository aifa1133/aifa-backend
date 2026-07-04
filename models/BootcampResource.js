import mongoose from "mongoose";

const bootcampResourceSchema = new mongoose.Schema({
  bootcamp:  { type: mongoose.Schema.Types.ObjectId, ref: "Bootcamp", required: true },
  name:      { type: String, required: true },
  category:  { type: String, default: "General" },
  fileType:  { type: String, default: "PDF Document" },
  fileSize:  { type: String, default: "" },
  fileUrl:   { type: String, default: "" },
  link:      { type: String, default: "" },
  downloads: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("BootcampResource", bootcampResourceSchema);
