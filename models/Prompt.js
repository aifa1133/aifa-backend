import mongoose from "mongoose";

const promptSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  category: { type: String, default: "Cinematic" },
  image:    { type: String, default: "" },
  text:     { type: String, required: true },
  order:    { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("Prompt", promptSchema);
