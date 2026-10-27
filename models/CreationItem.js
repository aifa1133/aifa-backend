import mongoose from "mongoose";

const creationItemSchema = new mongoose.Schema({
  label:    { type: String, default: "PROJECT" },
  title:    { type: String, required: true },
  subtitle: { type: String, default: "" },
  image:    { type: String, default: "" },
  workshopType: { type: String, default: "all" },
  isActive: { type: Boolean, default: true },
  order:    { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("CreationItem", creationItemSchema);
