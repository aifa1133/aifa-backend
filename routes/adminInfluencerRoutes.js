import express from "express";
import {
  createInfluencer,
  listInfluencers,
  getInfluencerStats,
  getInfluencer,
  updateInfluencer,
  updateInfluencerStatus,
  resetCoupon,
  resetReferralLink,
  listCommissions,
  getCommissionStats,
  getCommission,
  approveCommission,
  rejectCommission,
  markCommissionPaid,
  updateCommissionNotes,
} from "../controllers/adminInfluencerController.js";

const router = express.Router();

/* Influencers — /stats must be declared before /:id */
router.get("/influencers/stats", getInfluencerStats);
router.get("/influencers", listInfluencers);
router.post("/influencers", createInfluencer);
router.get("/influencers/:id", getInfluencer);
router.put("/influencers/:id", updateInfluencer);
router.put("/influencers/:id/status", updateInfluencerStatus);
router.post("/influencers/:id/reset-coupon", resetCoupon);
router.post("/influencers/:id/reset-referral-link", resetReferralLink);

/* Commissions */
router.get("/commissions/stats", getCommissionStats);
router.get("/commissions", listCommissions);
router.get("/commissions/:id", getCommission);
router.put("/commissions/:id/approve", approveCommission);
router.put("/commissions/:id/reject", rejectCommission);
router.put("/commissions/:id/mark-paid", markCommissionPaid);
router.put("/commissions/:id/notes", updateCommissionNotes);

export default router;
