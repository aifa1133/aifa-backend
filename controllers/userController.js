import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("enrolledCourses", "title image duration price")
      .populate("enrolledWorkshops", "title image duration price scheduledAt")
      .populate("enrolledBootcamps", "title image duration price startDate");
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, profilePicture, socialLinks } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (profilePicture !== undefined) updates.profilePicture = profilePicture;
    if (socialLinks !== undefined) updates.socialLinks = socialLinks;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user.password) return res.status(400).json({ message: "Password change not available for Google accounts" });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: "Current password is incorrect" });
    user.password = newPassword;
    await user.save();
    res.json({ message: "Password changed successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password")
      .populate("enrolledCourses",    "title image")
      .populate("enrolledWorkshops",  "title")
      .populate("enrolledBootcamps",  "title");
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateNotificationPrefs = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { notificationPrefs: req.body },
      { new: true }
    ).select("notificationPrefs");
    res.json(user.notificationPrefs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const getStudentStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("enrolledCourses enrolledWorkshops enrolledBootcamps courseProgress");
    const completedCount = user.courseProgress?.filter(p => p.percentComplete >= 100).length || 0;
    res.json({
      enrolledCourses:  user.enrolledCourses?.length  || 0,
      enrolledWorkshops:user.enrolledWorkshops?.length|| 0,
      enrolledBootcamps:user.enrolledBootcamps?.length|| 0,
      completedCourses: completedCount,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
