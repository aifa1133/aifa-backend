import express from "express";
import {
  getWorkshops, getWorkshopById, registerWorkshop,
  createWorkshop, updateWorkshop, deleteWorkshop,
} from "../controllers/workshopController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import Workshop from "../models/Workshop.js";

const router = express.Router();

router.get("/", getWorkshops);
router.get("/:id", getWorkshopById);
router.post("/:id/register", protect, registerWorkshop);

// Admin: registered students for a workshop
router.get("/:id/registrations", protect, adminOnly, async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id).populate("registrations", "name email phone mobile createdAt");
    if (!workshop) return res.status(404).json({ message: "Not found" });
    res.json(workshop.registrations.map(u => ({
      _id: u._id, name: u.name, email: u.email,
      phone: u.phone || u.mobile || "—", registeredAt: u.createdAt,
    })));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Admin routes
router.post("/", protect, adminOnly, createWorkshop);
router.put("/:id", protect, adminOnly, updateWorkshop);
router.delete("/:id", protect, adminOnly, deleteWorkshop);

export default router;
