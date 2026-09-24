import Bootcamp from "../models/Bootcamp.js";
import User from "../models/User.js";

export const getBootcamps = async (req, res) => {
  try {
    const bootcamps = await Bootcamp.find().sort({ isPublished: -1, createdAt: -1 });
    res.json(bootcamps);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const enrollBootcamp = async (req, res) => {
  try {
    const bootcamp = await Bootcamp.findById(req.params.id);
    if (!bootcamp) return res.status(404).json({ message: "Bootcamp not found" });
    if (bootcamp.enrollments.length >= bootcamp.seats) {
      return res.status(400).json({ message: "Bootcamp is full" });
    }
    if (bootcamp.enrollments.includes(req.user._id)) {
      return res.status(400).json({ message: "Already enrolled" });
    }
    bootcamp.enrollments.push(req.user._id);
    await bootcamp.save();

    const user = await User.findById(req.user._id);
    user.enrolledBootcamps.push(bootcamp._id);
    await user.save();

    res.json({ message: "Enrolled successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const createBootcamp = async (req, res) => {
  try {
    const bootcamp = await Bootcamp.create(req.body);
    res.status(201).json(bootcamp);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateBootcamp = async (req, res) => {
  try {
    const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bootcamp) return res.status(404).json({ message: "Bootcamp not found" });
    res.json(bootcamp);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const deleteBootcamp = async (req, res) => {
  try {
    await Bootcamp.findByIdAndDelete(req.params.id);
    res.json({ message: "Bootcamp deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
