import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import connectDB from "./config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import workshopRoutes from "./routes/workshopRoutes.js";
import bootcampRoutes from "./routes/bootcampRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import User from "./models/User.js";
import Course from "./models/Course.js";
import Workshop from "./models/Workshop.js";
import Bootcamp from "./models/Bootcamp.js";
import Transaction from "./models/Transaction.js";
import Certificate from "./models/Certificate.js";
import Job from "./models/Job.js";
import Resource from "./models/Resource.js";
import ServiceRequest   from "./models/ServiceRequest.js";
import SalesConsultation from "./models/SalesConsultation.js";
import TalentProfile    from "./models/TalentProfile.js";
import MembershipPlan   from "./models/MembershipPlan.js";
import { protect, adminOnly } from "./middleware/authMiddleware.js";
import { createOrder, verifyPayment, getMyTransactions, getAllTransactions } from "./controllers/paymentController.js";

dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// Serve uploaded avatars
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// Multer — avatar upload
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "uploads");
    import("fs").then(({ default: fs }) => { fs.mkdirSync(dir, { recursive: true }); cb(null, dir); });
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `avatar-${req.user._id}${ext}`);
  },
});
const avatarUpload = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files allowed"));
}});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/workshops", workshopRoutes);
app.use("/api/bootcamps", bootcampRoutes);
app.use("/api/users", userRoutes);

// ── Payment routes ──────────────────────────────────────────
app.post("/api/payments/create-order", protect, createOrder);
app.post("/api/payments/verify",       protect, verifyPayment);
app.get("/api/payments/history",       protect, getMyTransactions);
app.get("/api/admin/payments",         protect, adminOnly, getAllTransactions);

// ── Admin stats ─────────────────────────────────────────────
app.get("/api/admin/stats", protect, adminOnly, async (req, res) => {
  try {
    const [users, courses, workshops, bootcamps, revenueAgg, enrollments] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Workshop.countDocuments(),
      Bootcamp.countDocuments(),
      Transaction.aggregate([{ $match: { status: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Transaction.countDocuments({ status: "paid" }),
    ]);
    res.json({ users, courses, workshops, bootcamps, revenue: revenueAgg[0]?.total || 0, enrollments });
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ── Recent enrollments for admin overview ───────────────────
app.get("/api/admin/enrollments/recent", protect, adminOnly, async (req, res) => {
  try {
    const txs = await Transaction.find({ status: "paid" })
      .sort({ createdAt: -1 }).limit(10)
      .populate("user", "name email");
    res.json(txs);
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ── Full enrollments table ──────────────────────────────────
app.get("/api/admin/enrollments", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({})
      .populate("enrolledCourses", "title price")
      .populate("enrolledWorkshops", "title price")
      .populate("enrolledBootcamps", "title price")
      .select("name email enrolledCourses enrolledWorkshops enrolledBootcamps createdAt");

    const enrollments = [];
    for (const u of users) {
      for (const c of u.enrolledCourses)   enrollments.push({ user: { name: u.name, email: u.email }, item: c.title,    type: "course",    price: c.price,    enrolledAt: u.createdAt });
      for (const w of u.enrolledWorkshops) enrollments.push({ user: { name: u.name, email: u.email }, item: w.title,    type: "workshop",  price: w.price,    enrolledAt: u.createdAt });
      for (const b of u.enrolledBootcamps) enrollments.push({ user: { name: u.name, email: u.email }, item: b.title,    type: "bootcamp",  price: b.price,    enrolledAt: u.createdAt });
    }
    enrollments.sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt));
    res.json(enrollments);
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ── Analytics ───────────────────────────────────────────────
app.get("/api/admin/analytics", protect, adminOnly, async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [monthlyData, topCourses, revenueAgg, totalEnrollments, byType] = await Promise.all([
      Transaction.aggregate([
        { $match: { status: "paid", createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 }, revenue: { $sum: "$amount" } } },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]),
      Transaction.aggregate([
        { $match: { status: "paid", itemType: "course" } },
        { $group: { _id: "$itemTitle", count: { $sum: 1 }, revenue: { $sum: "$amount" } } },
        { $sort: { count: -1 } }, { $limit: 5 }
      ]),
      Transaction.aggregate([{ $match: { status: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Transaction.countDocuments({ status: "paid" }),
      Transaction.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: "$itemType", count: { $sum: 1 } } }
      ]),
    ]);

    res.json({
      monthlyData,
      topCourses,
      totalRevenue: revenueAgg[0]?.total || 0,
      totalEnrollments,
      byType,
    });
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ── Certificates ────────────────────────────────────────────
app.get("/api/certificates/me", protect, async (req, res) => {
  try {
    const certs = await Certificate.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(certs);
  } catch { res.status(500).json({ message: "Server error" }); }
});

app.get("/api/certificates", protect, adminOnly, async (req, res) => {
  try {
    const certs = await Certificate.find({}).populate("user", "name email").sort({ createdAt: -1 });
    res.json(certs);
  } catch { res.status(500).json({ message: "Server error" }); }
});

app.post("/api/certificates", protect, adminOnly, async (req, res) => {
  try {
    const { userId, title, courseTitle, itemType } = req.body;
    if (!userId || !title || !courseTitle) return res.status(400).json({ message: "userId, title, courseTitle required" });
    const cert = await Certificate.create({ user: userId, title, courseTitle, itemType: itemType || "course" });
    res.status(201).json(cert);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.delete("/api/certificates/:id", protect, adminOnly, async (req, res) => {
  try {
    await Certificate.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ── Jobs ─────────────────────────────────────────────────────
app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch { res.status(500).json({ message: "Server error" }); }
});

app.post("/api/jobs", protect, adminOnly, async (req, res) => {
  try {
    const job = await Job.create(req.body);
    res.status(201).json(job);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

app.put("/api/jobs/:id", protect, adminOnly, async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(job);
  } catch { res.status(500).json({ message: "Server error" }); }
});

app.delete("/api/jobs/:id", protect, adminOnly, async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ── Resources ────────────────────────────────────────────────
app.get("/api/resources", async (req, res) => {
  try {
    const filter = req.query.type ? { type: req.query.type } : {};
    const resources = await Resource.find(filter).sort({ createdAt: -1 });
    res.json(resources);
  } catch { res.status(500).json({ message: "Server error" }); }
});

app.post("/api/resources", protect, adminOnly, async (req, res) => {
  try {
    const resource = await Resource.create(req.body);
    res.status(201).json(resource);
  } catch (e) { res.status(400).json({ message: e.message }); }
});

app.put("/api/resources/:id", protect, adminOnly, async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(resource);
  } catch { res.status(500).json({ message: "Server error" }); }
});

app.delete("/api/resources/:id", protect, adminOnly, async (req, res) => {
  try {
    await Resource.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ── Avatar upload ─────────────────────────────────────────────
app.put("/api/users/me/avatar", protect, avatarUpload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const avatarUrl = `/api/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, { profilePicture: avatarUrl }, { new: true }).select("-password");
    res.json({ avatarUrl, user });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── SERVICE REQUESTS ─────────────────────────────────────────
app.post("/api/service-requests", async (req, res) => {
  try {
    const { name, email, service } = req.body;
    if (!name || !email || !service) return res.status(400).json({ message: "Name, email and service required" });
    const sr = await ServiceRequest.create(req.body);
    res.status(201).json(sr);
  } catch (e) { res.status(400).json({ message: e.message }); }
});
app.get("/api/service-requests", protect, adminOnly, async (req, res) => {
  try { res.json(await ServiceRequest.find().sort({ createdAt: -1 })); }
  catch { res.status(500).json({ message: "Server error" }); }
});
app.put("/api/service-requests/:id", protect, adminOnly, async (req, res) => {
  try {
    const sr = await ServiceRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!sr) return res.status(404).json({ message: "Not found" });
    res.json(sr);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.delete("/api/service-requests/:id", protect, adminOnly, async (req, res) => {
  try { await ServiceRequest.findByIdAndDelete(req.params.id); res.json({ message: "Deleted" }); }
  catch { res.status(500).json({ message: "Server error" }); }
});

// ── SALES CONSULTATIONS ───────────────────────────────────────
app.post("/api/consultations", async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ message: "Name and email required" });
    const c = await SalesConsultation.create(req.body);
    res.status(201).json(c);
  } catch (e) { res.status(400).json({ message: e.message }); }
});
app.get("/api/consultations", protect, adminOnly, async (req, res) => {
  try { res.json(await SalesConsultation.find().sort({ createdAt: -1 })); }
  catch { res.status(500).json({ message: "Server error" }); }
});
app.put("/api/consultations/:id", protect, adminOnly, async (req, res) => {
  try {
    const c = await SalesConsultation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!c) return res.status(404).json({ message: "Not found" });
    res.json(c);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.delete("/api/consultations/:id", protect, adminOnly, async (req, res) => {
  try { await SalesConsultation.findByIdAndDelete(req.params.id); res.json({ message: "Deleted" }); }
  catch { res.status(500).json({ message: "Server error" }); }
});

// ── TALENT PROFILES ───────────────────────────────────────────
app.get("/api/talent", async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category && category !== "All") filter.category = category;
    res.json(await TalentProfile.find(filter).sort({ createdAt: -1 }));
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.get("/api/talent/all", protect, adminOnly, async (req, res) => {
  try { res.json(await TalentProfile.find().sort({ createdAt: -1 })); }
  catch { res.status(500).json({ message: "Server error" }); }
});
app.post("/api/talent", protect, adminOnly, async (req, res) => {
  try { res.status(201).json(await TalentProfile.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
});
app.put("/api/talent/:id", protect, adminOnly, async (req, res) => {
  try {
    const t = await TalentProfile.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!t) return res.status(404).json({ message: "Not found" });
    res.json(t);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.delete("/api/talent/:id", protect, adminOnly, async (req, res) => {
  try { await TalentProfile.findByIdAndDelete(req.params.id); res.json({ message: "Deleted" }); }
  catch { res.status(500).json({ message: "Server error" }); }
});

// ── MEMBERSHIP PLANS ──────────────────────────────────────────
app.get("/api/membership/plans", async (req, res) => {
  try { res.json(await MembershipPlan.find({ isActive: true })); }
  catch { res.status(500).json({ message: "Server error" }); }
});
app.post("/api/membership/plans", protect, adminOnly, async (req, res) => {
  try { res.status(201).json(await MembershipPlan.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
});
app.put("/api/membership/plans/:id", protect, adminOnly, async (req, res) => {
  try {
    const p = await MembershipPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!p) return res.status(404).json({ message: "Not found" });
    res.json(p);
  } catch { res.status(500).json({ message: "Server error" }); }
});
app.delete("/api/membership/plans/:id", protect, adminOnly, async (req, res) => {
  try { await MembershipPlan.findByIdAndDelete(req.params.id); res.json({ message: "Deleted" }); }
  catch { res.status(500).json({ message: "Server error" }); }
});
app.get("/api/membership/members", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: "student" })
      .select("name email createdAt enrolledCourses enrolledWorkshops enrolledBootcamps")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch { res.status(500).json({ message: "Server error" }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
