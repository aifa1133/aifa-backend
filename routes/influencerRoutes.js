import express from "express";
import { login, getMe } from "../controllers/influencerAuthController.js";
import {
  getStats,
  getReferrals,
  getPayouts,
  requestPayout,
  updateBankDetails,
} from "../controllers/influencerPortalController.js";
import { verifyInfluencer } from "../middleware/influencerMiddleware.js";

const router = express.Router();

/* Auth */
router.post("/auth/login", login);
router.get("/auth/me", verifyInfluencer, getMe);

/* Portal */
router.get("/stats", verifyInfluencer, getStats);
router.get("/referrals", verifyInfluencer, getReferrals);
router.get("/payouts", verifyInfluencer, getPayouts);
router.post("/payouts/request", verifyInfluencer, requestPayout);
router.put("/bank-details", verifyInfluencer, updateBankDetails);

export default router;
