import express from "express";
import {
  getMyProfile, updateProfile, changePassword, setInitialPassword,
  getAllUsers, updateUserRole, deleteUser,
  updateNotificationPrefs, getStudentStats,
  sendVerifyEmailOtp, verifyUserEmailOtp,
} from "../controllers/userController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateProfile);
router.put("/me/password", protect, changePassword);
router.post("/set-password", protect, setInitialPassword);
router.post("/send-verify-email-otp", protect, sendVerifyEmailOtp);
router.post("/verify-email-otp", protect, verifyUserEmailOtp);
router.put("/me/notifications", protect, updateNotificationPrefs);
router.get("/me/stats", protect, getStudentStats);

/* Returns the paid transaction orderId for a specific item — used as fallback when localStorage is missing */
router.get("/me/order", protect, async (req, res) => {
  try {
    const { itemId } = req.query;
    if (!itemId) return res.status(400).json({ message: "itemId required" });
    const tx = await Transaction.findOne({ user: req.user._id, itemId, status: "paid" })
      .sort({ createdAt: -1 })
      .select("orderId _id createdAt");
    if (!tx) return res.status(404).json({ message: "No transaction found" });
    res.json({ orderId: tx.orderId, txId: tx._id.toString(), createdAt: tx.createdAt });
  } catch { res.status(500).json({ message: "Server error" }); }
});

// Admin routes
router.get("/", protect, adminOnly, getAllUsers);
router.put("/:id/role", protect, adminOnly, updateUserRole);
router.delete("/:id", protect, adminOnly, deleteUser);

export default router;
