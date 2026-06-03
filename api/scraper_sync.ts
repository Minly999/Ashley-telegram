import { VercelRequest, VercelResponse } from "@vercel/node";
import { saveDaySchedule } from "../src/modules/schedule/storage.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const providedSecret = req.headers["x-sync-secret"];
  if (!providedSecret || providedSecret !== process.env.SCRAPE) {
    console.warn("Unauthorized sync attempt.");
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { userId, schedule } = req.body;

    if (!userId || !schedule || !Array.isArray(schedule)) {
      return res.status(400).json({ error: "Invalid payload format. Expected userId and a schedule array." });
    }

    let daysSaved = 0;
    for (const day of schedule) {
      await saveDaySchedule(userId, day.date, day.classes);
      daysSaved++;
    }

    console.log(`Successfully synced ${daysSaved} days for user ${userId}`);
    return res.status(200).json({ success: true, message: `Saved ${daysSaved} days.` });

  } catch (error) {
    console.error("Sync API Error:", error);
    return res.status(500).json({ error: "Internal server error during sync" });
  }
}