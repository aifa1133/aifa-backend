import mongoose from "mongoose";

const schema = new mongoose.Schema({
  autoIssue:      { type: Boolean, default: false },
  manualApproval: { type: Boolean, default: false },
  idFormat:       { type: String,  default: "AIFA-[YEAR]-[ID]" },
}, { timestamps: true });

export default mongoose.model("CertSettings", schema);
