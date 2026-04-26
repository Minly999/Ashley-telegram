import { Schedule, Class } from "../../core/types.js";

export function parseScheduleProtocol(rawText: string): Schedule {
  if (!rawText || rawText.trim() === "") {
    throw new Error("Empty schedule data provided.");
  }

  const days = rawText.split("---").map((block) => block.trim()).filter(Boolean);
  const schedule: Schedule = [];

  for (const dayBlock of days) {
    const lines = dayBlock.split("\n").map((line) => line.trim()).filter(Boolean);
    
    if (lines.length === 0) continue;

    const date = lines[0];
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD.`);
    }

    const classes: Class[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const parts = line.split("|").map((part) => part.trim());
      
      if (parts.length !== 3) {
        throw new Error(`Invalid class format on date ${date}: "${line}". Expected "Index | Discipline | Room".`);
      }

      const index = parseInt(parts[0]!, 10);
      if (isNaN(index)) {
        throw new Error(`Invalid class index on date ${date}: "${parts[0]}". Must be a number.`);
      }

      classes.push({
        index,
        discipline: parts[1]!,
        room: parts[2]!
      });
    }

    schedule.push({ date, classes });
  }

  return schedule;
}