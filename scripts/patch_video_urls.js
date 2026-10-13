/**
 * One-time migration: set videoUrl on every lesson across all courses.
 * Run: node scripts/patch_video_urls.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const VIMEO_URL = "https://player.vimeo.com/video/1212069002";
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const CourseSchema = new mongoose.Schema({}, { strict: false });
const Course = mongoose.model("Course", CourseSchema, "courses");

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const courses = await Course.find({});
  console.log(`Found ${courses.length} courses`);

  let updatedCourses = 0;
  let updatedLessons = 0;

  for (const course of courses) {
    const sections = course.toObject().sections || [];
    let changed = false;

    const patchedSections = sections.map(section => ({
      ...section,
      lessons: (section.lessons || []).map(lesson => {
        const needsUrl   = !lesson.videoUrl;
        const needsTitle = !lesson.title || lesson.title.trim() === "";
        if (needsUrl || needsTitle) {
          changed = true;
          updatedLessons++;
          return {
            ...lesson,
            videoUrl: lesson.videoUrl || VIMEO_URL,
            title:    (lesson.title && lesson.title.trim()) ? lesson.title : "test",
          };
        }
        return lesson;
      }),
    }));

    // Also handle flat lessons array (some schemas)
    const lessons = course.toObject().lessons || [];
    const patchedLessons = lessons.map(lesson => {
      const needsUrl   = !lesson.videoUrl;
      const needsTitle = !lesson.title || lesson.title.trim() === "";
      if (needsUrl || needsTitle) {
        changed = true;
        updatedLessons++;
        return {
          ...lesson,
          videoUrl: lesson.videoUrl || VIMEO_URL,
          title:    (lesson.title && lesson.title.trim()) ? lesson.title : "test",
        };
      }
      return lesson;
    });

    if (changed) {
      const update = {};
      if (sections.length)       update.sections = patchedSections;
      if (lessons.length)        update.lessons   = patchedLessons;
      await Course.updateOne({ _id: course._id }, { $set: update });
      updatedCourses++;
      console.log(`  Updated course: ${course.title || course._id}`);
    }
  }

  console.log(`\nDone — ${updatedCourses} courses updated, ${updatedLessons} lessons patched.`);
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
