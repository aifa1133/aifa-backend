import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error("MONGO_URI not set"); process.exit(1); }

await mongoose.connect(MONGO_URI);
console.log("Connected to MongoDB");

const col = mongoose.connection.db.collection("communitythreads");

const titlesToDelete = [
  "+98",
  "QA Test Thread",
];

const result = await col.deleteMany({ title: { $in: titlesToDelete } });
console.log(`Deleted ${result.deletedCount} test/spam thread(s)`);

// Also delete threads with body matching known spam patterns
const spamResult = await col.deleteMany({
  $or: [
    { body: { $in: ["*9*5", "+98", "95"] } },
    { body: "This is a test thread for QA verification" },
  ]
});
if (spamResult.deletedCount > 0) console.log(`Deleted ${spamResult.deletedCount} additional spam thread(s) by body`);

await mongoose.disconnect();
console.log("Done.");
