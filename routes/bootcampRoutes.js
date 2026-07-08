import express from "express";
import {
  getBootcamps, enrollBootcamp,
  createBootcamp, deleteBootcamp,
} from "../controllers/bootcampController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import Bootcamp from "../models/Bootcamp.js";
import BootcampSession from "../models/BootcampSession.js";
import BootcampProject from "../models/BootcampProject.js";
import BootcampAnnouncement from "../models/BootcampAnnouncement.js";
import BootcampResource from "../models/BootcampResource.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/", getBootcamps);
router.post("/:id/enroll", protect, enrollBootcamp);

// ── Students ──────────────────────────────────────────────────
router.get("/:id/students", protect, adminOnly, async (req, res) => {
  try {
    const bootcamp = await Bootcamp.findById(req.params.id).populate("enrollments", "name email phone mobile createdAt");
    if (!bootcamp) return res.status(404).json({ message: "Not found" });
    const metaMap = {};
    (bootcamp.studentMeta || []).forEach(m => { metaMap[String(m.userId)] = m; });
    const students = bootcamp.enrollments.map(u => {
      const meta = metaMap[String(u._id)] || {};
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        mobile: u.phone || u.mobile || "—",
        joinDate: new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        status: meta.status || "ACTIVE",
        notes: meta.notes || "",
      };
    });
    res.json(students);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put("/:id/students/:userId", protect, adminOnly, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const bootcamp = await Bootcamp.findById(req.params.id);
    if (!bootcamp) return res.status(404).json({ message: "Not found" });
    const existing = bootcamp.studentMeta.find(m => String(m.userId) === req.params.userId);
    if (existing) {
      if (status !== undefined) existing.status = status;
      if (notes !== undefined) existing.notes = notes;
    } else {
      bootcamp.studentMeta.push({ userId: req.params.userId, status: status || "ACTIVE", notes: notes || "" });
    }
    await bootcamp.save();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post("/:id/enroll-by-email", protect, adminOnly, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ message: "No AIFA account found with that email address." });
    const bootcamp = await Bootcamp.findById(req.params.id);
    if (!bootcamp) return res.status(404).json({ message: "Bootcamp not found." });
    if (bootcamp.enrollments.map(String).includes(String(user._id))) {
      return res.status(400).json({ message: "This student is already enrolled in this bootcamp." });
    }
    bootcamp.enrollments.push(user._id);
    await bootcamp.save();
    if (!user.enrolledBootcamps) user.enrolledBootcamps = [];
    if (!user.enrolledBootcamps.map(String).includes(String(bootcamp._id))) {
      user.enrolledBootcamps.push(bootcamp._id);
      await user.save();
    }
    res.json({ message: `${user.name} has been enrolled successfully.` });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Admin routes
router.post("/", protect, adminOnly, createBootcamp);
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bootcamp) return res.status(404).json({ message: "Not found" });
    res.json(bootcamp);
  } catch (e) { res.status(500).json({ message: e.message }); }
});
router.delete("/:id", protect, adminOnly, deleteBootcamp);

// ── Sessions ─────────────────────────────────────────────────
router.get("/:id/sessions", async (req, res) => {
  try {
    const sessions = await BootcampSession.find({ bootcamp: req.params.id }).sort({ no: 1 });
    res.json(sessions);
  } catch { res.status(500).json({ message: "Server error" }); }
});

router.post("/:id/sessions", protect, adminOnly, async (req, res) => {
  try {
    const session = await BootcampSession.create({ bootcamp: req.params.id, ...req.body });
    res.status(201).json(session);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.put("/:id/sessions/:sid", protect, adminOnly, async (req, res) => {
  try {
    const session = await BootcampSession.findByIdAndUpdate(req.params.sid, req.body, { new: true });
    if (!session) return res.status(404).json({ message: "Not found" });
    res.json(session);
  } catch { res.status(500).json({ message: "Server error" }); }
});

router.delete("/:id/sessions/:sid", protect, adminOnly, async (req, res) => {
  try {
    await BootcampSession.findByIdAndDelete(req.params.sid);
    res.json({ message: "Deleted" });
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ── Projects ──────────────────────────────────────────────────
router.get("/:id/projects", async (req, res) => {
  try {
    const projects = await BootcampProject.find({ bootcamp: req.params.id });
    res.json(projects);
  } catch { res.status(500).json({ message: "Server error" }); }
});

router.post("/:id/projects", protect, adminOnly, async (req, res) => {
  try {
    const project = await BootcampProject.create({ bootcamp: req.params.id, ...req.body });
    res.status(201).json(project);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.put("/:id/projects/:pid", protect, adminOnly, async (req, res) => {
  try {
    const project = await BootcampProject.findByIdAndUpdate(req.params.pid, req.body, { new: true });
    if (!project) return res.status(404).json({ message: "Not found" });
    res.json(project);
  } catch { res.status(500).json({ message: "Server error" }); }
});

router.delete("/:id/projects/:pid", protect, adminOnly, async (req, res) => {
  try {
    await BootcampProject.findByIdAndDelete(req.params.pid);
    res.json({ message: "Deleted" });
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ── Announcements ─────────────────────────────────────────────
// /all must come before /:aid to avoid route collision
router.get("/:id/announcements/all", protect, adminOnly, async (req, res) => {
  try {
    const announcements = await BootcampAnnouncement.find({ bootcamp: req.params.id }).sort({ createdAt: -1 });
    res.json(announcements);
  } catch { res.status(500).json({ message: "Server error" }); }
});

router.get("/:id/announcements", async (req, res) => {
  try {
    const announcements = await BootcampAnnouncement.find({ bootcamp: req.params.id, status: "PUBLISHED" }).sort({ createdAt: -1 });
    res.json(announcements);
  } catch { res.status(500).json({ message: "Server error" }); }
});

router.post("/:id/announcements", protect, adminOnly, async (req, res) => {
  try {
    const announcement = await BootcampAnnouncement.create({ bootcamp: req.params.id, ...req.body, createdBy: req.user?.name || "Admin" });
    res.status(201).json(announcement);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.put("/:id/announcements/:aid", protect, adminOnly, async (req, res) => {
  try {
    const announcement = await BootcampAnnouncement.findByIdAndUpdate(req.params.aid, req.body, { new: true });
    if (!announcement) return res.status(404).json({ message: "Not found" });
    res.json(announcement);
  } catch { res.status(500).json({ message: "Server error" }); }
});

router.delete("/:id/announcements/:aid", protect, adminOnly, async (req, res) => {
  try {
    await BootcampAnnouncement.findByIdAndDelete(req.params.aid);
    res.json({ message: "Deleted" });
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ── Resources ─────────────────────────────────────────────────
router.get("/:id/resources", protect, adminOnly, async (req, res) => {
  try {
    const resources = await BootcampResource.find({ bootcamp: req.params.id }).sort({ createdAt: -1 });
    res.json(resources);
  } catch { res.status(500).json({ message: "Server error" }); }
});

router.post("/:id/resources", protect, adminOnly, async (req, res) => {
  try {
    const resource = await BootcampResource.create({ bootcamp: req.params.id, ...req.body });
    res.status(201).json(resource);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

router.put("/:id/resources/:rid", protect, adminOnly, async (req, res) => {
  try {
    const resource = await BootcampResource.findByIdAndUpdate(req.params.rid, req.body, { new: true });
    if (!resource) return res.status(404).json({ message: "Not found" });
    res.json(resource);
  } catch { res.status(500).json({ message: "Server error" }); }
});

router.delete("/:id/resources/:rid", protect, adminOnly, async (req, res) => {
  try {
    await BootcampResource.findByIdAndDelete(req.params.rid);
    res.json({ message: "Deleted" });
  } catch { res.status(500).json({ message: "Server error" }); }
});

export default router;
