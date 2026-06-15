import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema({
  type:        { type: String, enum: ["prompt","workflow","project","tip","deal"], required: true },
  title:       { type: String, required: true },
  description: { type: String },
  content:     { type: String },
  category:    { type: String },
  isFeatured:  { type: Boolean, default: false },
  allowCopy:   { type: Boolean, default: true },
  tags:        [String],
  discount:    { type: String },
  link:        { type: String },
  logo:        { type: String },
}, { timestamps: true });

export default mongoose.model("Resource", resourceSchema);
