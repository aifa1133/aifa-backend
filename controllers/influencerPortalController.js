import mongoose from "mongoose";
import Commission from "../models/Commission.js";
import Payout from "../models/Payout.js";
import Influencer from "../models/Influencer.js";
import User from "../models/User.js";
import { publicProfile } from "./influencerAuthController.js";

const oid = (v) => new mongoose.Types.ObjectId(String(v));

/* ── GET /api/influencer/stats ───────────────────────────── */
export const getStats = async (req, res) => {
  try {
    const id = oid(req.influencer._id);

    const [agg, paidAgg, pendingApprovalAgg] = await Promise.all([
      Commission.aggregate([
        { $match: { influencerId: id, approvalStatus: "approved" } },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: "$commissionAmount" },
            couponEarnings: {
              $sum: { $cond: [{ $eq: ["$method", "coupon"] }, "$commissionAmount", 0] },
            },
            referralLinkEarnings: {
              $sum: { $cond: [{ $eq: ["$method", "referral_link"] }, "$commissionAmount", 0] },
            },
            pendingPayout: {
              $sum: { $cond: [{ $eq: ["$paymentStatus", "unpaid"] }, "$commissionAmount", 0] },
            },
            totalPaid: {
              $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$commissionAmount", 0] },
            },
          },
        },
      ]),
      Payout.aggregate([
        { $match: { influencerId: id, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Commission.aggregate([
        { $match: { influencerId: id, approvalStatus: "pending" } },
        { $group: { _id: null, total: { $sum: "$commissionAmount" }, count: { $sum: 1 } } },
      ]),
    ]);

    const a = agg[0] || {};
    res.json({
      totalEarnings: a.totalEarnings || 0,
      couponEarnings: a.couponEarnings || 0,
      referralLinkEarnings: a.referralLinkEarnings || 0,
      pendingPayout: a.pendingPayout || 0,
      totalPaid: a.totalPaid || 0,
      payoutsCompleted: paidAgg[0]?.total || 0,
      pendingApproval: pendingApprovalAgg[0]?.total || 0,
      pendingApprovalCount: pendingApprovalAgg[0]?.count || 0,
      couponCommissionRate: req.influencer.couponCommissionRate,
      referralCommissionRate: req.influencer.referralCommissionRate,
      couponCode: req.influencer.couponCode,
      referralLink: req.influencer.referralLink,
    });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

/* ── GET /api/influencer/referrals ───────────────────────── */
export const getReferrals = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 20 } = req.query;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const infId = oid(req.influencer._id);

    // All users who signed up via this influencer's referral
    const referred = await User.find({ referredBy: infId }, "name email createdAt phone").sort({ createdAt: -1 });

    // Sum commissions per student email
    const commAgg = await Commission.aggregate([
      { $match: { influencerId: infId } },
      {
        $group: {
          _id: "$studentEmail",
          totalEarned: { $sum: "$commissionAmount" },
          purchaseCount: { $sum: 1 },
          lastPurchase: { $max: "$purchaseDate" },
        },
      },
    ]);
    const commMap = {};
    commAgg.forEach((c) => { commMap[c._id] = c; });

    // Build unified list
    let items = referred.map((u) => {
      const c = commMap[u.email] || {};
      return {
        _id: u._id,
        studentName: u.name,
        studentEmail: u.email,
        joinedAt: u.createdAt,
        totalEarned: c.totalEarned || 0,
        purchaseCount: c.purchaseCount || 0,
        lastPurchase: c.lastPurchase || null,
      };
    });

    // Search filter
    if (search.trim()) {
      const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      items = items.filter((i) => rx.test(i.studentName) || rx.test(i.studentEmail));
    }

    const total = items.length;
    const paginated = items.slice((p - 1) * l, p * l);

    res.json({ items: paginated, total, page: p, limit: l, pages: Math.max(1, Math.ceil(total / l)) });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

/* ── GET /api/influencer/payouts ─────────────────────────── */
export const getPayouts = async (req, res) => {
  try {
    const payouts = await Payout.find({ influencerId: req.influencer._id }).sort({ createdAt: -1 });
    res.json(payouts);
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

/* ── POST /api/influencer/payouts/request ────────────────── */
export const requestPayout = async (req, res) => {
  try {
    const inf = req.influencer;
    const id = oid(inf._id);

    const existingPending = await Payout.findOne({ influencerId: id, status: "pending" });
    if (existingPending) {
      return res.status(400).json({ message: "You already have a pending payout request." });
    }

    const agg = await Commission.aggregate([
      { $match: { influencerId: id, approvalStatus: "approved", paymentStatus: "unpaid" } },
      { $group: { _id: null, total: { $sum: "$commissionAmount" } } },
    ]);
    const amount = Math.round((agg[0]?.total || 0) * 100) / 100;

    if (amount <= 0) {
      return res.status(400).json({ message: "No approved balance available for payout." });
    }

    const hasBank = Boolean(inf.bankAccountNumber && inf.bankIFSC);
    if (!hasBank && !inf.upiId) {
      return res.status(400).json({ message: "Add your bank details or UPI ID before requesting a payout." });
    }
    const paymentMethod = hasBank ? "bank_transfer" : "upi";

    const count = await Payout.countDocuments();
    const payoutId = `PAY-${String(count + 1).padStart(5, "0")}`;

    const payout = await Payout.create({
      influencerId: id,
      payoutId,
      amount,
      paymentMethod,
      status: "pending",
      requestedOn: new Date(),
    });

    res.status(201).json(payout);
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

/* ── PUT /api/influencer/bank-details ────────────────────── */
export const updateBankDetails = async (req, res) => {
  try {
    const { bankAccountHolder, bankName, bankAccountNumber, bankIFSC, upiId } = req.body;
    const update = {};
    if (bankAccountHolder !== undefined) update.bankAccountHolder = bankAccountHolder;
    if (bankName !== undefined) update.bankName = bankName;
    if (bankAccountNumber !== undefined) update.bankAccountNumber = bankAccountNumber;
    if (bankIFSC !== undefined) update.bankIFSC = String(bankIFSC).toUpperCase();
    if (upiId !== undefined) update.upiId = upiId;

    const inf = await Influencer.findByIdAndUpdate(req.influencer._id, update, { new: true }).select("-password");
    if (!inf) return res.status(404).json({ message: "Influencer not found" });
    res.json(publicProfile(inf));
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};
