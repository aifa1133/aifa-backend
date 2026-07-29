import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema(
  {
    influencerId: { type: mongoose.Schema.Types.ObjectId, ref: "Influencer", required: true, index: true },
    payoutId: { type: String, unique: true },
    amount: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ["bank_transfer", "upi"], default: "bank_transfer" },
    status: { type: String, enum: ["pending", "completed", "rejected"], default: "pending" },
    requestedOn: { type: Date, default: Date.now },
    processedOn: { type: Date, default: null },
  },
  { timestamps: true }
);

const Payout = mongoose.model("Payout", payoutSchema);
export default Payout;
