import express from "express";
import {
  getMyProfile, updateProfile, changePassword, setInitialPassword,
  getAllUsers, updateUserRole, deleteUser,
  updateNotificationPrefs, getStudentStats,
  sendVerifyEmailOtp, verifyUserEmailOtp,
} from "../controllers/userController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateProfile);
router.put("/me/password", protect, changePassword);
router.post("/set-password", protect, setInitialPassword);
router.post("/send-verify-email-otp", protect, sendVerifyEmailOtp);
router.post("/verify-email-otp", protect, verifyUserEmailOtp);
router.put("/me/notifications", protect, updateNotificationPrefs);
router.get("/me/stats", protect, getStudentStats);

// Admin routes
router.get("/", protect, adminOnly, getAllUsers);
router.put("/:id/role", protect, adminOnly, updateUserRole);
router.delete("/:id", protect, adminOnly, deleteUser);

export default router;
