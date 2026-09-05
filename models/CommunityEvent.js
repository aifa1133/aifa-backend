import mongoose from "mongoose";
const schema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: "" },
  type:        { type: String, default: "Workshop" },
  mode:        { type: String, default: "ONLINE" },
  status:      { type: String, default: "published" },
  date:      { type: Date },
  startTime: { type: String, default: "" },
  endTime:   { type: String, default: "" },
  timezone:  { type: String, default: "" },
  duration:  { type: String, default: "2" },
  capacity:  { type: Number, default: 50 },
  location:  { type: String, default: "" },
  link:      { type: String, default: "" },
  openRSVP:  { type: Boolean, default: true },
  featured:  { type: Boolean, default: false },
}, { timestamps: true });
export default mongoose.model("CommunityEvent", schema);
