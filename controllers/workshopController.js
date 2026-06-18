import Workshop from "../models/Workshop.js";
import User from "../models/User.js";

export const getWorkshops = async (req, res) => {
  try {
    const workshops = await Workshop.find({ isPublished: true });
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
    if (workshop.registrations.includes(req.user._id)) {
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

export const createWorkshop = async (req, res) => {
  try {
    if (req.body.mode) req.body.mode = req.body.mode.toUpperCase();
    const workshop = await Workshop.create(req.body);
    res.status(201).json(workshop);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateWorkshop = async (req, res) => {
  try {
    if (req.body.mode) req.body.mode = req.body.mode.toUpperCase();
    const workshop = await Workshop.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!workshop) return res.status(404).json({ message: "Workshop not found" });
    res.json(workshop);
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
