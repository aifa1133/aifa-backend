import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const workshopSchema = new mongoose.Schema({
  title: String,
  slug: { type: String, default: "" },
}, { strict: false });
const Workshop = mongoose.model("Workshop", workshopSchema);

const slugify = (title) =>
  title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");

async function run() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const workshops = await Workshop.find({ $or: [{ slug: "" }, { slug: { $exists: false } }] });
  console.log(`Found ${workshops.length} workshops needing slugs`);
  for (const w of workshops) {
    const base = slugify(w.title);
    let slug = base, n = 1;
    while (await Workshop.findOne({ slug, _id: { $ne: w._id } })) slug = `${base}-${++n}`;
    await Workshop.updateOne({ _id: w._id }, { $set: { slug } });
    console.log(`  ${w.title} → ${slug}`);
  }
  console.log("Done.");
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
