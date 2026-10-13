import mongoose from "mongoose";

const projectSubmissionSchema = new mongoose.Schema({
  bootcamp:  { type: mongoose.Schema.Types.ObjectId, ref: "Bootcamp", required: true },
  project:   { type: mongoose.Schema.Types.ObjectId, ref: "BootcampProject", required: true },
  user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fileUrl:   { type: String, default: "" },
  fileName:  { type: String, default: "" },
  link:      { type: String, default: "" },
  grade:     { type: Number, default: null },
  feedback:  { type: String, default: "" },
  status:    { type: String, default: "submitted" }, // submitted | graded
}, { timestamps: true });

export default mongoose.model("ProjectSubmission", projectSubmissionSchema);
