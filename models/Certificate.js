import mongoose from "mongoose";

const certSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title:         { type: String, required: true },
  courseTitle:   { type: String, required: true },
  itemType:      { type: String, enum: ["course","workshop","bootcamp"], default: "course" },
  certificateId: { type: String },
  issuedAt:      { type: Date, default: Date.now },
}, { timestamps: true });

certSchema.pre("save", async function () {
  if (!this.certificateId) {
    const count = await mongoose.model("Certificate").countDocuments();
    this.certificateId = `AIFA-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
  }
});

export default mongoose.model("Certificate", certSchema);
