import mongoose from "mongoose";
const clubSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  city:        { type: String, default: "" },
  description: { type: String, default: "" },
  type:        { type: String, default: "Public" },
  memberLimit: { type: String, default: "" },
  isPrimary:   { type: Boolean, default: false },
  autoDetect:  { type: Boolean, default: false },
  bannerUrl:   { type: String, default: "" },
  members:     { type: Number, default: 0 },
  events:      { type: Number, default: 0 },
}, { timestamps: true });
export default mongoose.model("Club", clubSchema);
