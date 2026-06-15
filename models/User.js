

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, "Please add a name"] 
  },
  email: { 
    type: String, 
    required: [true, "Please add an email"], 
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email",
    ],
  },
  // ✅ CHANGE: Made phone optional (not required) for Google users
  phone: { 
    type: String, 
    required: false 
  },
  // ✅ CHANGE: Made password optional for Google users
  password: { 
    type: String, 
    required: function() {
      // Only require password if it's NOT a Google login
      return !this.isGoogleUser;
    },
    minlength: 6,
  },
  // ✅ ADDED: Field to track Google users
  isGoogleUser: {
    type: Boolean,
    default: false
  },
  profilePicture: {
    type: String,
    default: ""
  },
  role: {
    type: String,
    enum: ["student", "admin"],
    default: "student",
  },
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
  enrolledWorkshops: [{ type: mongoose.Schema.Types.ObjectId, ref: "Workshop" }],
  enrolledBootcamps: [{ type: mongoose.Schema.Types.ObjectId, ref: "Bootcamp" }],
  courseProgress: [{
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    completedLessons: [String],
    percentComplete: { type: Number, default: 0 },
    lastAccessedAt: { type: Date, default: Date.now },
  }],
  notificationPrefs: {
    newCourses:     { type: Boolean, default: true },
    workshopAlerts: { type: Boolean, default: true },
    progressEmails: { type: Boolean, default: false },
    promotions:     { type: Boolean, default: true },
  },
}, { timestamps: true });

// Hash password before saving to DB
userSchema.pre('save', async function () {
  if (!this.password || !this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  // Handle case where Google user tries to login with password but doesn't have one
  if(!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;