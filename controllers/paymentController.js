import crypto from "crypto";
import Transaction from "../models/Transaction.js";
import Course from "../models/Course.js";
import Workshop from "../models/Workshop.js";
import Bootcamp from "../models/Bootcamp.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Commission from "../models/Commission.js";
import Influencer from "../models/Influencer.js";
import Certificate from "../models/Certificate.js";
import CertSettings from "../models/CertSettings.js";

function razorpayConfigured() {
  const k = process.env.RAZORPAY_KEY_ID;
  const s = process.env.RAZORPAY_KEY_SECRET;
  return k && !k.includes("your_razorpay") && s && !s.includes("your_razorpay");
}

async function getRazorpay() {
  if (!razorpayConfigured()) return null;
  try {
    const { default: Razorpay } = await import("razorpay");
    return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  } catch {
    return null;
  }
}

const MODELS = { course: Course, workshop: Workshop, bootcamp: Bootcamp };

/* ── GET /api/payments/validate-coupon?code=VAMSI10 ── */
export const validateCoupon = async (req, res) => {
  try {
    const code = String(req.query.code || "").trim().toUpperCase();
    if (!code) return res.status(400).json({ message: "Coupon code is required" });
    const influencer = await Influencer.findOne({ couponCode: code, status: "active" });
    if (!influencer) return res.status(404).json({ valid: false, message: "Invalid or expired coupon code" });
    res.json({
      valid: true,
      discount: influencer.couponCommissionRate,
      couponCode: influencer.couponCode,
      influencerId: influencer._id,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const createOrder = async (req, res) => {
  const { itemType, itemId, couponCode } = req.body;
  try {
    const Model = MODELS[itemType];
    if (!Model) return res.status(400).json({ message: "Invalid item type" });

    const item = await Model.findById(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Apply coupon discount if provided
    let finalPrice = item.price;
    let appliedCoupon = null;
    if (couponCode) {
      const inf = await Influencer.findOne({ couponCode: String(couponCode).toUpperCase(), status: "active" });
      if (inf) {
        const disc = Math.round(item.price * inf.couponCommissionRate) / 100;
        finalPrice = Math.max(0, item.price - disc);
        appliedCoupon = { influencerId: inf._id, couponCode: inf.couponCode, discountRate: inf.couponCommissionRate, discountAmount: disc };
      }
    }

    const amountPaise = Math.max(100, Math.round(finalPrice * 100)); // Razorpay minimum is ₹1 (100 paise)

    const razorpay = await getRazorpay();
    if (!razorpay) {
      const tx = await Transaction.create({
        user: req.user._id, itemType, itemId,
        itemTitle: item.title, amount: finalPrice, status: "pending",
        orderId: `dev_order_${Date.now()}`,
        ...(appliedCoupon ? { couponCode: appliedCoupon.couponCode, couponInfluencerId: appliedCoupon.influencerId } : {}),
      });
      return res.json({
        orderId: tx.orderId, amount: amountPaise, currency: "INR",
        keyId: "razorpay_not_configured", txId: tx._id,
        appliedCoupon, _devMode: true,
      });
    }

    const order = await razorpay.orders.create({
      amount: amountPaise, currency: "INR",
      receipt: `tx_${Date.now()}`,
      notes: { itemType, itemId: itemId.toString(), userId: req.user._id.toString() },
    });

    const tx = await Transaction.create({
      user: req.user._id, itemType, itemId,
      itemTitle: item.title, amount: finalPrice,
      orderId: order.id, status: "pending",
      ...(appliedCoupon ? { couponCode: appliedCoupon.couponCode, couponInfluencerId: appliedCoupon.influencerId } : {}),
    });

    res.json({ orderId: order.id, amount: amountPaise, currency: "INR", keyId: process.env.RAZORPAY_KEY_ID, txId: tx._id, appliedCoupon });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id:   orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature:  signature,
    txId,
  } = req.body;

  console.log("[PAY-VERIFY] incoming fields:", {
    orderId:   orderId   || "MISSING",
    paymentId: paymentId || "MISSING",
    signature: signature ? signature.slice(0, 10) + "…" : "MISSING",
    txId:      txId      || "MISSING",
  });

  try {
    const razorpay = await getRazorpay();

    if (razorpay) {
      const keySecretPresent = !!(process.env.RAZORPAY_KEY_SECRET);
      const expected = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      console.log("[PAY-VERIFY] key_secret present:", keySecretPresent);
      console.log("[PAY-VERIFY] signature match:", expected === signature);

      if (expected !== signature) {
        console.log("[PAY-VERIFY] MISMATCH — expected:", expected.slice(0, 10) + "…", "got:", (signature || "").slice(0, 10) + "…");
        await Transaction.findByIdAndUpdate(txId, { status: "failed" });
        return res.status(400).json({ message: "Payment verification failed" });
      }
    }

    const tx = await Transaction.findByIdAndUpdate(
      txId, { paymentId, signature, status: "paid" }, { returnDocument: "after" }
    );
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    // Enroll user in the purchased item
    const user = await User.findById(req.user._id);
    if (tx.itemType === "course" && !user.enrolledCourses.includes(tx.itemId)) {
      user.enrolledCourses.push(tx.itemId);
    } else if (tx.itemType === "workshop" && !user.enrolledWorkshops.includes(tx.itemId)) {
      user.enrolledWorkshops.push(tx.itemId);
      await Workshop.findByIdAndUpdate(tx.itemId, { $addToSet: { registrations: user._id } });
    } else if (tx.itemType === "bootcamp" && !user.enrolledBootcamps.includes(tx.itemId)) {
      user.enrolledBootcamps.push(tx.itemId);
      await Bootcamp.findByIdAndUpdate(tx.itemId, { $addToSet: { enrollments: user._id } });
    }
    await user.save();

    // Create commission for coupon purchase (takes priority over referral link)
    if (tx.couponInfluencerId) {
      try {
        const influencer = await Influencer.findById(tx.couponInfluencerId);
        if (influencer && influencer.status === "active") {
          const rate = influencer.couponCommissionRate || 0;
          const commissionAmount = Math.round(tx.amount * rate) / 100;
          await Commission.create({
            influencerId: influencer._id,
            studentId: user._id,
            studentName: user.name,
            studentEmail: user.email,
            studentPhone: user.phone || "",
            program: tx.itemTitle,
            purchaseAmount: tx.amount,
            commissionPercentage: rate,
            commissionAmount,
            method: "coupon",
            couponCode: tx.couponCode || "",
            orderId: tx.orderId || "",
            purchaseDate: new Date(),
            approvalStatus: "pending",
            paymentStatus: "unpaid",
          });
        }
      } catch (commErr) {
        console.error("[COMMISSION] Coupon commission failed:", commErr.message);
      }
    }

    // Create commission record if user was referred by an influencer (and no coupon used)
    if (!tx.couponInfluencerId && user.referredBy) {
      try {
        const influencer = await Influencer.findById(user.referredBy);
        if (influencer && influencer.status === "active") {
          const rate = influencer.referralCommissionRate || 0;
          const commissionAmount = Math.round(tx.amount * rate) / 100;
          await Commission.create({
            influencerId: influencer._id,
            studentId: user._id,
            studentName: user.name,
            studentEmail: user.email,
            studentPhone: user.phone || "",
            program: tx.itemTitle,
            purchaseAmount: tx.amount,
            commissionPercentage: rate,
            commissionAmount,
            method: "referral_link",
            referralLink: influencer.referralLink || "",
            orderId: tx.orderId || "",
            purchaseDate: new Date(),
            approvalStatus: "pending",
            paymentStatus: "unpaid",
          });
        }
      } catch (commErr) {
        console.error("[COMMISSION] Failed to create commission record:", commErr.message);
      }
    }

    // Send enrollment confirmation notification to student
    const itemLabel = tx.itemType === "bootcamp" ? "Bootcamp" : tx.itemType === "course" ? "Course" : "Workshop";
    await Notification.create({
      recipients: [user._id],
      title: `🎉 Enrollment Confirmed — ${tx.itemTitle}`,
      body: `Your payment of ₹${tx.amount} was successful. You are now enrolled in "${tx.itemTitle}". Head to your dashboard to get started!`,
      type: "enrollment",
    }).catch(() => {});

    // Auto-issue certificate if enabled in settings
    try {
      const settings = await CertSettings.findOne();
      if (settings?.autoIssue) {
        const already = await Certificate.findOne({ user: user._id, courseTitle: tx.itemTitle });
        if (!already) {
          const titleMap = { course: "Certificate of Completion", workshop: "Workshop Certificate", bootcamp: "Bootcamp Certificate" };
          await Certificate.create({
            user:        user._id,
            title:       titleMap[tx.itemType] || "Certificate of Completion",
            courseTitle: tx.itemTitle,
            itemType:    tx.itemType,
            status:      settings.manualApproval ? "pending" : "active",
          });
        }
      }
    } catch (certErr) {
      console.error("[AUTO-CERT]", certErr.message);
    }

    res.json({ success: true, message: "Payment verified and enrollment confirmed", transaction: tx });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const getMyTransactions = async (req, res) => {
  try {
    const txs = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(txs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const getAllTransactions = async (req, res) => {
  try {
    const txs = await Transaction.find().populate("user", "name email").sort({ createdAt: -1 });
    res.json(txs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
