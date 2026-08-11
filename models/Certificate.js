import mongoose from "mongoose";

const certSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title:         { type: String, required: true },
  courseTitle:   { type: String, required: true },
  itemType:      { type: String, enum: ["course","workshop","bootcamp"], default: "course" },
  certificateId: { type: String },
  status:        { type: String, enum: ["active","pending"], default: "active" },
  issuedAt:      { type: Date, default: Date.now },
}, { timestamps: true });

certSchema.pre("save", async function () {
  if (!this.certificateId) {
    const count = await mongoose.model("Certificate").countDocuments();
    const n    = count + 1;
    const year = new Date().getFullYear();

    let format = "AIFA-[YEAR]-[ID]";
    try {
      const CertSettings = mongoose.model("CertSettings");
      const s = await CertSettings.findOne();
      if (s?.idFormat) format = s.idFormat;
    } catch {}

    const courseCode = (this.courseTitle || "")
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .trim()
      .split(/\s+/)
      .map(w => w[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 6) || "CERT";

    this.certificateId = format
      .replace("[YEAR]", year)
      .replace("[ID]", String(n).padStart(5, "0"))
      .replace("[COURSE_CODE]", courseCode);
  }
});

export default mongoose.model("Certificate", certSchema);
