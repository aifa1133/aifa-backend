/**
 * Temporarily marks the first available thread as "reported" so you can
 * verify the admin UI shows the REPORTED badge, hidden body, Resolve button,
 * and Moderation Hub report card.
 *
 * Usage:
 *   node backend/scripts/test_reported_thread.js set    ← mark as reported
 *   node backend/scripts/test_reported_thread.js revert ← undo
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

await mongoose.connect(process.env.MONGO_URI);
const col = mongoose.connection.db.collection("communitythreads");

const action = process.argv[2] || "set";

const thread = await col.findOne({});
if (!thread) { console.error("No threads found in database."); process.exit(1); }

if (action === "set") {
  await col.updateOne({ _id: thread._id }, {
    $set: { isReported: true, reportCount: 3, reportType: "SPAM", reports: [{ type: "SPAM", reason: "Test report" }] }
  });
  console.log(`✅ Thread "${thread.title}" (${thread._id}) marked as REPORTED with reportCount:3, type:SPAM`);
  console.log("→ Now open /admin → Community → Forum to verify the UI.");
  console.log("→ Run with 'revert' argument when done.");
} else {
  await col.updateOne({ _id: thread._id }, {
    $set: { isReported: false, reportCount: 0, reports: [] }, $unset: { reportType: "" }
  });
  console.log(`✅ Thread "${thread.title}" reverted back to normal.`);
}

await mongoose.disconnect();
