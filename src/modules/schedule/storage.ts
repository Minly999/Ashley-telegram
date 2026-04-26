import redis from "../../core/redis.js";
import { Class } from "../../core/types.js";

export async function saveDaySchedule(userId: number, date: string, classes: Class[]): Promise<void> {
  const key = `schedule:${userId}`;
  const data = JSON.stringify(classes);
  
  // HSET creates the key if it doesn't exist, and adds/updates the specific date field
  await redis.hset(key, date, data);
  
  // Reset the TTL for the whole schedule to 14 days from the last update
  await redis.expire(key, 60 * 60 * 24 * 14); 
}

export async function getDaySchedule(userId: number, date: string): Promise<Class[] | null> {
  const key = `schedule:${userId}`;
  const data = await redis.hget(key, date);
  
  if (!data) return null;
  
  return JSON.parse(data) as Class[];
}

export async function getFullSchedule(userId: number): Promise<{ date: string; classes: Class[] }[]> {
  const key = `schedule:${userId}`;
  // Returns an object like { "2026-04-13": "[...]", "2026-04-14": "[...]" }
  const rawData = await redis.hgetall(key); 
  
  if (Object.keys(rawData).length === 0) return [];

  const schedule = Object.entries(rawData).map(([date, classesString]) => ({
    date,
    classes: JSON.parse(classesString as string) as Class[]
  }));

  return schedule.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function deleteSchedule(userId: number, date?: string): Promise<void> {
  const key = `schedule:${userId}`;
  if (date) {
    await redis.hdel(key, date); // Delete only one day
  } else {
    await redis.del(key); // Flush the whole schedule
  }
}