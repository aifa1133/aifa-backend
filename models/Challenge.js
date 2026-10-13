import mongoose from "mongoose";
const challengeSchema = new mongoose.Schema({
  title:           { type: String, required: true },
  desc:            { type: String, default: "" },
  startDate:       { type: String, default: "" },
  endDate:         { type: String, default: "" },
  visibility:      { type: String, default: "Public" },
  status:          { type: String, default: "draft" },
  thumb:           { type: String, default: "" },
  submissionTypes: [String],
  awards:          [{ type: { type: String }, description: String }],
  participants:    { type: Number, default: 0 },
}, { timestamps: true });
export default mongoose.model("Challenge", challengeSchema);
