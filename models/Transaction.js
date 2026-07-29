import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  itemType:   { type: String, enum: ["course", "workshop", "bootcamp"], required: true },
  itemId:     { type: mongoose.Schema.Types.ObjectId, required: true },
  itemTitle:  { type: String, default: "" },
  amount:     { type: Number, required: true },
  currency:   { type: String, default: "INR" },
  status:     { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
  orderId:           { type: String },
  paymentId:         { type: String },
  signature:         { type: String },
  couponCode:        { type: String, default: "" },
  couponInfluencerId:{ type: mongoose.Schema.Types.ObjectId, ref: "Influencer", default: null },
}, { timestamps: true });

export default mongoose.model("Transaction", transactionSchema);
