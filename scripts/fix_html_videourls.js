import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const VIMEO_URL = "https://player.vimeo.com/video/1212069002";

const CourseSchema = new mongoose.Schema({}, { strict: false });
const Course = mongoose.model("Course", CourseSchema, "courses");

const fixUrl = url => (url && url.includes("<")) ? VIMEO_URL : url;

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const courses = await Course.find({}).lean();
  for (const c of courses) {
    let changed = false;
    const newSections = (c.sections || []).map(s => ({
      ...s,
      lessons: (s.lessons || []).map(l => {
        const fixed = fixUrl(l.videoUrl);
        if (fixed !== l.videoUrl) { changed = true; return { ...l, videoUrl: fixed }; }
        return l;
      }),
    }));
    const newLessons = (c.lessons || []).map(l => {
      const fixed = fixUrl(l.videoUrl);
      if (fixed !== l.videoUrl) { changed = true; return { ...l, videoUrl: fixed }; }
      return l;
    });
    if (changed) {
      const upd = {};
      if (c.sections && c.sections.length) upd.sections = newSections;
      if (c.lessons  && c.lessons.length)  upd.lessons  = newLessons;
      await Course.updateOne({ _id: c._id }, { $set: upd });
      console.log("Fixed:", c.title);
    }
  }
  console.log("Done");
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
