import mongoose from "mongoose";

const bootcampSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  image: { type: String, default: "" },
  price: { type: Number, required: true },
  duration: { type: String, default: "" },
  startDate: { type: Date },
  endDate: { type: Date },
  seats: { type: Number, default: 30 },
  syllabus: [{ week: Number, topic: String }],
  instructors: [{ name: String, bio: String, image: String }],
  enrollments: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isPublished: { type: Boolean, default: false },
  originalPrice:   { type: Number },
  batchCode:       { type: String, default: "" },
  batchName:       { type: String, default: "" },
  zoomLink:        { type: String, default: "" },
  zoomId:          { type: String, default: "" },
  zoomPass:        { type: String, default: "" },
  mentors:         [{ name: String, role: String }],
  nextSessionName: { type: String, default: "" },
  nextSessionAt:   { type: Date },
  batchLabel:      { type: String, default: "" },
  enrolledCount:   { type: Number, default: 0 },
  studentMeta:     [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, status: { type: String, default: "ACTIVE" }, notes: { type: String, default: "" } }],
}, { timestamps: true });

export default mongoose.model("Bootcamp", bootcampSchema);
