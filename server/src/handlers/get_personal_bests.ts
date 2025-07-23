
import { db } from '../db';
import { personalBestsTable } from '../db/schema';
import { type GetPersonalBestsInput, type PersonalBest } from '../schema';
import { eq, and } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export async function getPersonalBests(input: GetPersonalBestsInput): Promise<PersonalBest[]> {
  try {
    const conditions: SQL<unknown>[] = [];

    // Always filter by user_id
    conditions.push(eq(personalBestsTable.user_id, input.user_id));

    // Optionally filter by exercise_id
    if (input.exercise_id !== undefined) {
      conditions.push(eq(personalBestsTable.exercise_id, input.exercise_id));
    }

    // Build final query
    const results = await db.select()
      .from(personalBestsTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .execute();

    // Convert numeric fields back to numbers and date strings to Date objects
    return results.map(pb => ({
      ...pb,
      weight: parseFloat(pb.weight),
      date_achieved: new Date(pb.date_achieved)
    }));
  } catch (error) {
    console.error('Failed to get personal bests:', error);
    throw error;
  }
}
