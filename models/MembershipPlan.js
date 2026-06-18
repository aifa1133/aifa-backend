import mongoose from "mongoose";

const membershipPlanSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  price:        { type: Number, default: 0 },
  billingCycle: { type: String, enum: ["monthly","yearly","lifetime"], default: "monthly" },
  features:     [String],
  isActive:     { type: Boolean, default: true },
  color:        { type: String, default: "#C7E36B" },
}, { timestamps: true });

export default mongoose.model("MembershipPlan", membershipPlanSchema);
