import mongoose from "mongoose";

const talentSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  location:     { type: String },
  avatar:       { type: String, default: "" },
  skills:       [String],
  category:     { type: String, default: "All" },
  bio:          { type: String },
  works:        [String],
  contactEmail: { type: String },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("TalentProfile", talentSchema);
