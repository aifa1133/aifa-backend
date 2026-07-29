import mongoose from "mongoose";

const commissionSchema = new mongoose.Schema(
  {
    influencerId: { type: mongoose.Schema.Types.ObjectId, ref: "Influencer", required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    studentName: { type: String, default: "" },
    studentEmail: { type: String, default: "" },
    studentPhone: { type: String, default: "" },

    program: { type: String, default: "" },
    purchaseAmount: { type: Number, default: 0 },

    commissionPercentage: { type: Number, default: 0 },
    commissionAmount: { type: Number, default: 0 },

    method: { type: String, enum: ["coupon", "referral_link"], default: "coupon" },
    couponCode: { type: String, default: "" },
    referralLink: { type: String, default: "" },
    orderId: { type: String, default: "" },

    purchaseDate: { type: Date, default: Date.now },

    approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid", index: true },

    internalNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

const Commission = mongoose.model("Commission", commissionSchema);
export default Commission;
