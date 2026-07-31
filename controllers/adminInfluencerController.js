import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Influencer from "../models/Influencer.js";
import Commission from "../models/Commission.js";
import Payout from "../models/Payout.js";
import User from "../models/User.js";

const oid = (v) => new mongoose.Types.ObjectId(String(v));
const rx = (s) => new RegExp(String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

const SITE = process.env.SITE_URL || "https://aifa.co.in";

const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24) || "influencer";

/* Build a unique coupon code from a name, e.g. "Alex Rivera" -> ALEX10 */
async function buildCouponCode(fullName) {
  const first = String(fullName || "AIFA").trim().split(/\s+/)[0].replace(/[^a-zA-Z0-9]/g, "");
  const base = (first || "AIFA").toUpperCase().slice(0, 12);
  let code = `${base}10`;
  let n = 10;
  /* eslint-disable no-await-in-loop */
  while (await Influencer.exists({ couponCode: code })) {
    n += 1;
    code = `${base}${n}`;
  }
  return code;
}

/* Build a unique referral link from a name */
async function buildReferralLink(fullName) {
  const base = slugify(fullName);
  let slug = base;
  let n = 1;
  while (await Influencer.exists({ referralLink: `${SITE}/?ref=${slug}` })) {
    n += 1;
    slug = `${base}${n}`;
  }
  return `${SITE}/?ref=${slug}`;
}

/* Attach aggregated commission stats + signup leads to a list of influencers */
async function attachStats(influencers) {
  const ids = influencers.map((i) => i._id);
  if (!ids.length) return [];

  const [agg, leadsAgg] = await Promise.all([
    Commission.aggregate([
      { $match: { influencerId: { $in: ids } } },
      {
        $group: {
          _id: "$influencerId",
          lifetimeSales: { $sum: "$purchaseAmount" },
          lifetimeEarnings: {
            $sum: { $cond: [{ $eq: ["$approvalStatus", "approved"] }, "$commissionAmount", 0] },
          },
          pendingApproval: {
            $sum: { $cond: [{ $eq: ["$approvalStatus", "pending"] }, "$commissionAmount", 0] },
          },
          pendingCommission: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$approvalStatus", "approved"] }, { $eq: ["$paymentStatus", "unpaid"] }] },
                "$commissionAmount",
                0,
              ],
            },
          },
          totalPaid: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$commissionAmount", 0] },
          },
          totalReferrals: { $sum: 1 },
        },
      },
    ]),
    // Count users who signed up via this influencer's referral link/coupon
    User.aggregate([
      { $match: { referredBy: { $in: ids } } },
      { $group: { _id: "$referredBy", signupLeads: { $sum: 1 } } },
    ]),
  ]);

  const map = {};
  agg.forEach((a) => { map[String(a._id)] = a; });
  const leadsMap = {};
  leadsAgg.forEach((a) => { leadsMap[String(a._id)] = a.signupLeads; });

  return influencers.map((i) => {
    const o = i.toObject ? i.toObject() : i;
    const s = map[String(i._id)] || {};
    return {
      ...o,
      lifetimeSales: s.lifetimeSales || 0,
      lifetimeEarnings: s.lifetimeEarnings || 0,
      pendingApproval: s.pendingApproval || 0,
      pendingCommission: s.pendingCommission || 0,
      totalPaid: s.totalPaid || 0,
      totalReferrals: s.totalReferrals || 0,
      signupLeads: leadsMap[String(i._id)] || 0,
    };
  });
}

/* ═══════════ INFLUENCERS ═══════════ */

/* POST /api/admin/influencers */
export const createInfluencer = async (req, res) => {
  try {
    const {
      fullName, email, phone, password, country, city, profilePhoto,
      instagram, youtube, linkedin, otherSocial,
      couponCommissionRate, referralCommissionRate,
      bankAccountHolder, bankName, bankAccountNumber, bankIFSC, upiId,
      couponCode: providedCode, referralLink: providedLink, status,
    } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ message: "Full name and email are required" });
    }
    const exists = await Influencer.findOne({ email: String(email).toLowerCase().trim() });
    if (exists) return res.status(400).json({ message: "An influencer with this email already exists" });

    let couponCode = providedCode ? String(providedCode).toUpperCase().trim() : await buildCouponCode(fullName);
    if (providedCode && (await Influencer.exists({ couponCode }))) {
      return res.status(400).json({ message: "That coupon code is already taken" });
    }
    const referralLink = providedLink || (await buildReferralLink(fullName));

    /* Temporary password — admin shares it with the influencer */
    const tempPassword = password && String(password).length >= 6
      ? String(password)
      : `aifa${Math.random().toString(36).slice(2, 8)}`;

    // Link to existing User account if email matches
    const linkedUser = await User.findOne({ email: String(email).toLowerCase().trim() }).select("_id");

    const influencer = await Influencer.create({
      fullName, email: String(email).toLowerCase().trim(), phone: phone || "",
      password: tempPassword,
      country: country || "", city: city || "", profilePhoto: profilePhoto || "",
      instagram: instagram || "", youtube: youtube || "", linkedin: linkedin || "", otherSocial: otherSocial || "",
      couponCode, referralLink,
      couponCommissionRate: Number(couponCommissionRate) || 10,
      referralCommissionRate: Number(referralCommissionRate) || 30,
      bankAccountHolder: bankAccountHolder || "", bankName: bankName || "",
      bankAccountNumber: bankAccountNumber || "", bankIFSC: (bankIFSC || "").toUpperCase(), upiId: upiId || "",
      status: status === "inactive" ? "inactive" : "active",
      ...(linkedUser && { userId: linkedUser._id }),
    });

    const out = influencer.toObject();
    delete out.password;
    res.status(201).json({ ...out, tempPassword });
  } catch (e) {
    res.status(400).json({ message: e.message || "Could not create influencer" });
  }
};

/* GET /api/admin/influencers */
export const listInfluencers = async (req, res) => {
  try {
    const { search = "", status = "", page = 1, limit = 20 } = req.query;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      const r = rx(search);
      filter.$or = [{ fullName: r }, { email: r }, { couponCode: r }, { phone: r }];
    }

    const [docs, total] = await Promise.all([
      Influencer.find(filter).select("-password").sort({ createdAt: -1 }).skip((p - 1) * l).limit(l),
      Influencer.countDocuments(filter),
    ]);

    const items = await attachStats(docs);
    res.json({ items, total, page: p, limit: l, pages: Math.max(1, Math.ceil(total / l)) });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

/* GET /api/admin/influencers/stats */
export const getInfluencerStats = async (req, res) => {
  try {
    const [totalInfluencers, activeInfluencers, pendingApprovalAgg, paidAgg] = await Promise.all([
      Influencer.countDocuments(),
      Influencer.countDocuments({ status: "active" }),
      Commission.aggregate([
        { $match: { approvalStatus: "pending" } },
        { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$commissionAmount" } } },
      ]),
      Commission.aggregate([
        { $match: { approvalStatus: "approved", paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$commissionAmount" } } },
      ]),
    ]);

    res.json({
      totalInfluencers,
      activeInfluencers,
      inactiveInfluencers: totalInfluencers - activeInfluencers,
      pendingApproval: pendingApprovalAgg[0]?.count || 0,
      pendingApprovalAmount: pendingApprovalAgg[0]?.amount || 0,
      lifetimeCommissionPaid: paidAgg[0]?.total || 0,
    });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

/* GET /api/admin/influencers/:id */
export const getInfluencer = async (req, res) => {
  try {
    const inf = await Influencer.findById(req.params.id).select("-password");
    if (!inf) return res.status(404).json({ message: "Influencer not found" });

    const [withStats] = await attachStats([inf]);
    const [recent, payouts] = await Promise.all([
      Commission.find({ influencerId: inf._id }).sort({ purchaseDate: -1 }).limit(10),
      Payout.find({ influencerId: inf._id }).sort({ createdAt: -1 }).limit(10),
    ]);

    res.json({ ...withStats, recentCommissions: recent, payouts });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

/* PUT /api/admin/influencers/:id */
export const updateInfluencer = async (req, res) => {
  try {
    const allowed = [
      "fullName", "email", "phone", "country", "city", "profilePhoto",
      "instagram", "youtube", "linkedin", "otherSocial",
      "couponCommissionRate", "referralCommissionRate",
      "bankAccountHolder", "bankName", "bankAccountNumber", "bankIFSC", "upiId",
      "status",
    ];
    const update = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    if (update.email) update.email = String(update.email).toLowerCase().trim();
    if (update.bankIFSC) update.bankIFSC = String(update.bankIFSC).toUpperCase();
    if (update.couponCommissionRate !== undefined) update.couponCommissionRate = Number(update.couponCommissionRate) || 0;
    if (update.referralCommissionRate !== undefined) update.referralCommissionRate = Number(update.referralCommissionRate) || 0;

    if (req.body.password && String(req.body.password).length >= 6) {
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(String(req.body.password), salt);
    }

    const inf = await Influencer.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).select("-password");
    if (!inf) return res.status(404).json({ message: "Influencer not found" });
    res.json(inf);
  } catch (e) {
    res.status(400).json({ message: e.message || "Could not update influencer" });
  }
};

/* PUT /api/admin/influencers/:id/status */
export const updateInfluencerStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "status must be 'active' or 'inactive'" });
    }
    const inf = await Influencer.findByIdAndUpdate(req.params.id, { status }, { new: true }).select("-password");
    if (!inf) return res.status(404).json({ message: "Influencer not found" });
    res.json(inf);
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

/* POST /api/admin/influencers/:id/reset-coupon */
export const resetCoupon = async (req, res) => {
  try {
    const inf = await Influencer.findById(req.params.id);
    if (!inf) return res.status(404).json({ message: "Influencer not found" });

    /* Increment the numeric suffix of the current code, else derive from the name */
    const match = /^([A-Z0-9]*?)(\d+)$/.exec(inf.couponCode || "");
    let code;
    if (match) {
      const base = match[1];
      let n = parseInt(match[2], 10);
      do { n += 1; code = `${base}${n}`; } while (await Influencer.exists({ couponCode: code }));
    } else {
      code = await buildCouponCode(inf.fullName);
    }

    const previousCode = inf.couponCode;
    inf.couponCode = code;
    await inf.save();

    const out = inf.toObject();
    delete out.password;
    res.json({ ...out, previousCode, newCode: code });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

/* POST /api/admin/influencers/:id/reset-referral-link */
export const resetReferralLink = async (req, res) => {
  try {
    const inf = await Influencer.findById(req.params.id);
    if (!inf) return res.status(404).json({ message: "Influencer not found" });

    const base = slugify(inf.fullName);
    let slug = `${base}${Math.random().toString(36).slice(2, 6)}`;
    while (await Influencer.exists({ referralLink: `${SITE}/?ref=${slug}` })) {
      slug = `${base}${Math.random().toString(36).slice(2, 6)}`;
    }

    const previousLink = inf.referralLink;
    inf.referralLink = `${SITE}/?ref=${slug}`;
    await inf.save();

    const out = inf.toObject();
    delete out.password;
    res.json({ ...out, previousLink, newLink: inf.referralLink });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

/* ═══════════ COMMISSIONS ═══════════ */

/* GET /api/admin/commissions */
export const listCommissions = async (req, res) => {
  try {
    const {
      search = "", method = "", approvalStatus = "", paymentStatus = "",
      influencerId = "", from = "", to = "", page = 1, limit = 20,
    } = req.query;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const filter = {};
    if (method) filter.method = method;
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (influencerId && mongoose.isValidObjectId(influencerId)) filter.influencerId = oid(influencerId);
    if (from || to) {
      filter.purchaseDate = {};
      if (from) filter.purchaseDate.$gte = new Date(from);
      if (to) { const d = new Date(to); d.setHours(23, 59, 59, 999); filter.purchaseDate.$lte = d; }
    }
    if (search) {
      const r = rx(search);
      filter.$or = [
        { studentName: r }, { studentEmail: r }, { studentPhone: r },
        { program: r }, { couponCode: r }, { orderId: r },
      ];
    }

    const [items, total] = await Promise.all([
      Commission.find(filter)
        .populate("influencerId", "fullName email couponCode profilePhoto")
        .sort({ purchaseDate: -1, createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l),
      Commission.countDocuments(filter),
    ]);

    res.json({ items, total, page: p, limit: l, pages: Math.max(1, Math.ceil(total / l)) });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

/* GET /api/admin/commissions/stats */
export const getCommissionStats = async (req, res) => {
  try {
    const agg = await Commission.aggregate([
      {
        $group: {
          _id: null,
          pendingApproval: {
            $sum: { $cond: [{ $eq: ["$approvalStatus", "pending"] }, "$commissionAmount", 0] },
          },
          pendingApprovalCount: {
            $sum: { $cond: [{ $eq: ["$approvalStatus", "pending"] }, 1, 0] },
          },
          pendingPayment: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$approvalStatus", "approved"] }, { $eq: ["$paymentStatus", "unpaid"] }] },
                "$commissionAmount",
                0,
              ],
            },
          },
          pendingPaymentCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$approvalStatus", "approved"] }, { $eq: ["$paymentStatus", "unpaid"] }] },
                1,
                0,
              ],
            },
          },
          totalCommissionPaid: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$commissionAmount", 0] },
          },
          rejectedCommissions: {
            $sum: { $cond: [{ $eq: ["$approvalStatus", "rejected"] }, "$commissionAmount", 0] },
          },
          rejectedCount: {
            $sum: { $cond: [{ $eq: ["$approvalStatus", "rejected"] }, 1, 0] },
          },
        },
      },
    ]);
    const a = agg[0] || {};
    res.json({
      pendingApproval: a.pendingApproval || 0,
      pendingApprovalCount: a.pendingApprovalCount || 0,
      pendingPayment: a.pendingPayment || 0,
      pendingPaymentCount: a.pendingPaymentCount || 0,
      totalCommissionPaid: a.totalCommissionPaid || 0,
      rejectedCommissions: a.rejectedCommissions || 0,
      rejectedCount: a.rejectedCount || 0,
    });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

/* GET /api/admin/commissions/:id */
export const getCommission = async (req, res) => {
  try {
    const c = await Commission.find({ _id: req.params.id })
      .populate("influencerId", "fullName email phone couponCode referralLink profilePhoto")
      .then((r) => r[0]);
    if (!c) return res.status(404).json({ message: "Commission not found" });
    res.json(c);
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

const setApproval = (approvalStatus) => async (req, res) => {
  try {
    const update = { approvalStatus };
    if (req.body?.internalNotes !== undefined) update.internalNotes = req.body.internalNotes;
    const c = await Commission.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate("influencerId", "fullName email couponCode");
    if (!c) return res.status(404).json({ message: "Commission not found" });
    res.json(c);
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

/* PUT /api/admin/commissions/:id/approve */
export const approveCommission = setApproval("approved");
/* PUT /api/admin/commissions/:id/reject */
export const rejectCommission = setApproval("rejected");

/* PUT /api/admin/commissions/:id/mark-paid */
export const markCommissionPaid = async (req, res) => {
  try {
    const c = await Commission.findById(req.params.id);
    if (!c) return res.status(404).json({ message: "Commission not found" });
    if (c.approvalStatus !== "approved") {
      return res.status(400).json({ message: "Only approved commissions can be marked as paid" });
    }
    c.paymentStatus = "paid";
    await c.save();
    await c.populate("influencerId", "fullName email couponCode");
    res.json(c);
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

/* PUT /api/admin/commissions/:id/notes */
export const updateCommissionNotes = async (req, res) => {
  try {
    const c = await Commission.findByIdAndUpdate(
      req.params.id,
      { internalNotes: req.body.internalNotes || "" },
      { new: true }
    ).populate("influencerId", "fullName email couponCode");
    if (!c) return res.status(404).json({ message: "Commission not found" });
    res.json(c);
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};
