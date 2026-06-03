import redis from "../../core/redis.js";

/**
 * Schema:
 * Disciplines (Set): user:{id}:disciplines
 * Notes (List/Stack): user:{id}:notes:{discipline_name}
 */

export async function addDiscipline(userId: number, name: string): Promise<boolean> {
  const key = `user:${userId}:disciplines`;
  
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
  await redis.srem(`user:${userId}:disciplines`, name);
  await redis.del(`user:${userId}:notes:${name}`);
}

export async function addNote(userId: number, discipline: string, content: string): Promise<void> {
  const key = `user:${userId}:notes:${discipline}`;
  await redis.lpush(key, content);
}

export async function getNotes(userId: number, discipline: string): Promise<string[]> {
  const key = `user:${userId}:notes:${discipline}`;
  return await redis.lrange(key, 0, -1);
}

export async function deleteNote(userId: number, discipline: string, content: string): Promise<void> {
  const key = `user:${userId}:notes:${discipline}`;
  await redis.lrem(key, 1, content);
}