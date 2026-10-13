import mongoose from "mongoose";

const bootcampAnnouncementSchema = new mongoose.Schema({
  bootcamp:  { type: mongoose.Schema.Types.ObjectId, ref: "Bootcamp", required: true },
  title:     { type: String, required: true },
  content:   { type: String, default: "" },
  status:    { type: String, enum: ["PUBLISHED", "SCHEDULED", "DRAFT"], default: "DRAFT" },
  createdBy: { type: String, default: "" },
  imageUrl:  { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("BootcampAnnouncement", bootcampAnnouncementSchema);
