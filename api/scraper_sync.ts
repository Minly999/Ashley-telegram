import { VercelRequest, VercelResponse } from "@vercel/node";
import { saveDaySchedule } from "../src/modules/schedule/storage.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Block anything that isn't a POST request
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 2. The Security Check
  // We look for a custom header named 'x-sync-secret'
  const providedSecret = req.headers["SCRAPE"];
  if (!providedSecret || providedSecret !== process.env.SCRAPE) {
    console.warn("🛑 Unauthorized sync attempt.");
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // 3. Extract the data
    const { userId, schedule } = req.body;

    // Validate the payload shape
    if (!userId || !schedule || !Array.isArray(schedule)) {
      return res.status(400).json({ error: "Invalid payload format. Expected userId and a schedule array." });
    }

    // 4. Write to Redis using your existing storage logic
    let daysSaved = 0;
    for (const day of schedule) {
      // The Python script will send data perfectly formatted for this function
      await saveDaySchedule(userId, day.date, day.classes);
      daysSaved++;
    }

    // 5. Send the green light back to GitHub Actions
    console.log(`✅ Successfully synced ${daysSaved} days for user ${userId}`);
    return res.status(200).json({ success: true, message: `Saved ${daysSaved} days.` });

  } catch (error) {
    console.error("❌ Sync API Error:", error);
    return res.status(500).json({ error: "Internal server error during sync" });
  }
}