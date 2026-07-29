import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const influencerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: [true, "Full name is required"], trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/, "Please add a valid email"],
    },
    phone: { type: String, default: "" },
    password: { type: String, required: [true, "Password is required"], minlength: 6 },
    country: { type: String, default: "" },
    city: { type: String, default: "" },

    profilePhoto: { type: String, default: "" },

    instagram: { type: String, default: "" },
    youtube: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    otherSocial: { type: String, default: "" },

    couponCode: { type: String, unique: true, uppercase: true, trim: true },
    referralLink: { type: String, default: "" },

    couponCommissionRate: { type: Number, default: 10 },
    referralCommissionRate: { type: Number, default: 30 },

    bankAccountHolder: { type: String, default: "" },
    bankName: { type: String, default: "" },
    bankAccountNumber: { type: String, default: "" },
    bankIFSC: { type: String, default: "" },
    upiId: { type: String, default: "" },

    status: { type: String, enum: ["active", "inactive"], default: "active" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

influencerSchema.pre("save", async function () {
  if (!this.password || !this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

influencerSchema.methods.matchPassword = async function (entered) {
  if (!this.password) return false;
  return bcrypt.compare(entered, this.password);
};

const Influencer = mongoose.model("Influencer", influencerSchema);
export default Influencer;
