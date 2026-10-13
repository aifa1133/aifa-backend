import mongoose from "mongoose";

const bootcampSessionSchema = new mongoose.Schema({
  bootcamp:     { type: mongoose.Schema.Types.ObjectId, ref: "Bootcamp", required: true },
  no:           { type: Number, required: true },
  name:         { type: String, required: true },
  status:       { type: String, enum: ["COMPLETED", "ACTIVE", "COMING SOON", "CANCELLED"], default: "COMING SOON" },
  recordingUrl: { type: String, default: "" },
  resources:    [{ name: String, size: String, fileUrl: { type: String, default: "" } }],
  thumbnail:    { type: String, default: "" },
  scheduledAt:  { type: Date },
}, { timestamps: true });

export default mongoose.model("BootcampSession", bootcampSessionSchema);
