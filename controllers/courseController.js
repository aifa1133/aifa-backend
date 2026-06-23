import Course from "../models/Course.js";
import User from "../models/User.js";

export const getCourses = async (req, res) => {
  try {
    const query = req.query.all === "true" ? {} : { isPublished: true };
    const courses = await Course.find(query).select("-lessons");
    /* Add enrollment count from User collection */
    const ids = courses.map(c => c._id);
    const counts = await User.aggregate([
      { $unwind: "$enrolledCourses" },
      { $match: { enrolledCourses: { $in: ids } } },
      { $group: { _id: "$enrolledCourses", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[String(c._id)] = c.count; });
    res.json(courses.map(c => ({ ...c.toObject(), enrollmentCount: countMap[String(c._id)] || 0 })));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Only enrolled users or admins can see lessons
    const user = req.user;
    const isEnrolled = user?.enrolledCourses?.some(
      (id) => id.toString() === course._id.toString()
    );
    if (!isEnrolled && user?.role !== "admin") {
      const { lessons, ...rest } = course.toObject();
      return res.json({ ...rest, lessons: [] });
    }
    res.json(course);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const user = await User.findById(req.user._id);
    if (user.enrolledCourses.includes(course._id)) {
      return res.status(400).json({ message: "Already enrolled" });
    }
    user.enrolledCourses.push(course._id);
    await user.save();
    res.json({ message: "Enrolled successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Admin
export const createCourse = async (req, res) => {
  try {
    const course = await Course.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(course);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: "Course deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateProgress = async (req, res) => {
  try {
    const { lessonId, completed } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const user = await User.findById(req.user._id);
    let prog = user.courseProgress.find(p => p.course.toString() === req.params.id);
    if (!prog) {
      user.courseProgress.push({ course: req.params.id, completedLessons: [], percentComplete: 0 });
      prog = user.courseProgress[user.courseProgress.length - 1];
    }

    if (completed && !prog.completedLessons.includes(lessonId)) {
      prog.completedLessons.push(lessonId);
    } else if (!completed) {
      prog.completedLessons = prog.completedLessons.filter(id => id !== lessonId);
    }
    prog.lastAccessedAt = new Date();
    const total = course.lessons.length || 1;
    prog.percentComplete = Math.round((prog.completedLessons.length / total) * 100);
    await user.save();
    res.json({ percentComplete: prog.percentComplete, completedLessons: prog.completedLessons });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const addLesson = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    course.lessons.push(req.body);
    await course.save();
    res.status(201).json(course.lessons[course.lessons.length - 1]);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateLesson = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    const lesson = course.lessons.id(req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });
    Object.assign(lesson, req.body);
    await course.save();
    res.json(lesson);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const deleteLesson = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    course.lessons = course.lessons.filter(l => l._id.toString() !== req.params.lessonId);
    await course.save();
    res.json({ message: "Lesson deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const getEnrolledCourses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("enrolledCourses", "title image duration price level category instructor")
      .select("enrolledCourses courseProgress");
    const courses = (user.enrolledCourses || []).map(c => {
      const prog = user.courseProgress?.find(p => p.course?.toString() === c._id.toString());
      return { ...c.toObject(), percentComplete: prog?.percentComplete || 0, lastAccessedAt: prog?.lastAccessedAt };
    });
    res.json(courses);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
