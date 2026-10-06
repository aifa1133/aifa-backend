import mongoose from "mongoose";
import Workshop from "../models/Workshop.js";
import User from "../models/User.js";

const slugify = (title) =>
  title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");

const makeSlug = async (title, excludeId = null) => {
  const base = slugify(title);
  let slug = base;
  let n = 1;
  while (true) {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await Workshop.findOne(query);
    if (!exists) return slug;
    slug = `${base}-${++n}`;
  }
};

export const getWorkshops = async (req, res) => {
  try {
    const filter = req.query.all === "true" ? {} : { isPublished: true };
    const workshops = await Workshop.find(filter).sort({ createdAt: -1 });
    res.json(workshops);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const registerWorkshop = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) return res.status(404).json({ message: "Workshop not found" });
    if (workshop.registrations.length >= workshop.seats) {
      return res.status(400).json({ message: "Workshop is full" });
    }
    if (workshop.registrations.some(id => id.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: "Already registered" });
    }
    workshop.registrations.push(req.user._id);
    await workshop.save();

    const user = await User.findById(req.user._id);
    user.enrolledWorkshops.push(workshop._id);
    await user.save();

    res.json({ message: "Registered successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const getWorkshopById = async (req, res) => {
  try {
    const param = req.params.id;
    const isObjectId = mongoose.Types.ObjectId.isValid(param) && param.length === 24;
    const workshop = await Workshop
      .findOne(isObjectId ? { _id: param } : { slug: param })
      .populate("registrations", "name email phone createdAt");
    if (!workshop) return res.status(404).json({ message: "Workshop not found" });
    res.json(workshop);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const createWorkshop = async (req, res) => {
  try {
    if (req.body.mode) req.body.mode = req.body.mode.toUpperCase();
    if (req.body.title && !req.body.slug) req.body.slug = await makeSlug(req.body.title);
    const workshop = await Workshop.create(req.body);
    res.status(201).json(workshop);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateWorkshop = async (req, res) => {
  try {
    if (req.body.mode) req.body.mode = req.body.mode.toUpperCase();
    const existing = await Workshop.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Workshop not found" });
    if (!existing.slug && req.body.title) req.body.slug = await makeSlug(req.body.title, existing._id);
    const workshop = await Workshop.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(workshop);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/* One-time: backfill slugs for workshops that don't have one yet */
export const backfillSlugs = async (req, res) => {
  try {
    const workshops = await Workshop.find({ $or: [{ slug: "" }, { slug: { $exists: false } }] });
    for (const w of workshops) {
      w.slug = await makeSlug(w.title, w._id);
      await w.save();
    }
    res.json({ updated: workshops.length });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const deleteWorkshop = async (req, res) => {
  try {
    await Workshop.findByIdAndDelete(req.params.id);
    res.json({ message: "Workshop deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
