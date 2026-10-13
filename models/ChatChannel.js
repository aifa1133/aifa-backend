import mongoose from "mongoose";
const chatChannelSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  category:    { type: String, default: "General" },
  description: { type: String, default: "" },
  inviteLink:  { type: String, default: "" },
  access:      { type: String, default: "Public" },
  members:     { type: Number, default: 0 },
  activeNow:   { type: Number, default: 0 },
}, { timestamps: true });
export default mongoose.model("ChatChannel", chatChannelSchema);
