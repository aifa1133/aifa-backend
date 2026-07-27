import express from "express";
import {
  getWorkshops, getWorkshopById, registerWorkshop,
  createWorkshop, updateWorkshop, deleteWorkshop,
} from "../controllers/workshopController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getWorkshops);
router.get("/:id", protect, adminOnly, getWorkshopById);
router.post("/:id/register", protect, registerWorkshop);

// Admin routes
router.post("/", protect, adminOnly, createWorkshop);
router.put("/:id", protect, adminOnly, updateWorkshop);
router.delete("/:id", protect, adminOnly, deleteWorkshop);

export default router;
