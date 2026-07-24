import express from "express";
import {
  getCourses, getCourseById, enrollCourse, getEnrolledCourses,
  createCourse, updateCourse, deleteCourse,
  updateProgress, addLesson, updateLesson, deleteLesson,
} from "../controllers/courseController.js";
import { protect, adminOnly, optionalProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getCourses);
router.get("/enrolled", protect, getEnrolledCourses);
router.get("/:id", optionalProtect, getCourseById);
router.post("/:id/enroll", protect, enrollCourse);
router.put("/:id/progress", protect, updateProgress);

// Admin routes
router.post("/", protect, adminOnly, createCourse);
router.put("/:id", protect, adminOnly, updateCourse);
router.delete("/:id", protect, adminOnly, deleteCourse);
router.post("/:id/lessons", protect, adminOnly, addLesson);
router.put("/:id/lessons/:lessonId", protect, adminOnly, updateLesson);
router.delete("/:id/lessons/:lessonId", protect, adminOnly, deleteLesson);

export default router;
