// src/modules/notes/database.ts
import redis from "../../core/redis.js";

/**
 * Disciplines (Set): user:{id}:disciplines
 * Notes (List/Stack): user:{id}:notes:{discipline_name}
 */

export async function addDiscipline(userId: number, name: string): Promise<boolean> {
  const key = `user:${userId}:disciplines`;
  
  // Get all existing names to check for case-insensitive duplicates
  const existing = await redis.smembers(key);
  const isDuplicate = existing.some(d => d.toLowerCase() === name.toLowerCase());

  if (isDuplicate) return false;

  await redis.sadd(key, name);
  return true;
}

export async function getDisciplines(userId: number): Promise<string[]> {
  return await redis.smembers(`user:${userId}:disciplines`);
}

export async function deleteDiscipline(userId: number, name: string): Promise<void> {
  // Remove the name from the list of disciplines
  await redis.srem(`user:${userId}:disciplines`, name);
  // Wipe all notes associated with that discipline
  await redis.del(`user:${userId}:notes:${name}`);
}

export async function addNote(userId: number, discipline: string, content: string): Promise<void> {
  const key = `user:${userId}:notes:${discipline}`;
  // LPUSH puts the note at the top of the stack (index 0)
  await redis.lpush(key, content);
}

export async function getNotes(userId: number, discipline: string): Promise<string[]> {
  const key = `user:${userId}:notes:${discipline}`;
  // Fetch the entire stack (newest first)
  return await redis.lrange(key, 0, -1);
}

export async function deleteNote(userId: number, discipline: string, content: string): Promise<void> {
  const key = `user:${userId}:notes:${discipline}`;
  // Removes only 1 specific instance of this note content
  await redis.lrem(key, 1, content);
}