import express from "express";
import Prompt from "../models/Prompt.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public — get all published prompts
router.get("/", async (req, res) => {
  try {
    const prompts = await Prompt.find({ isPublished: true }).sort({ order: 1, createdAt: 1 });
    res.json(prompts);
  } catch { res.status(500).json({ message: "Server error" }); }
});

// Admin — get all prompts (including unpublished)
router.get("/admin", protect, adminOnly, async (req, res) => {
  try {
    const prompts = await Prompt.find().sort({ order: 1, createdAt: 1 });
    res.json(prompts);
  } catch { res.status(500).json({ message: "Server error" }); }
});

// Admin — create prompt
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const prompt = await Prompt.create(req.body);
    res.status(201).json(prompt);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// Admin — update prompt
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const prompt = await Prompt.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!prompt) return res.status(404).json({ message: "Not found" });
    res.json(prompt);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

// Admin — delete prompt
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Prompt.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch { res.status(500).json({ message: "Server error" }); }
});

export default router;
