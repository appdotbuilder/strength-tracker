
import { db } from '../db';
import { goalsTable, exercisesTable, usersTable } from '../db/schema';
import { type Goal } from '../schema';
import { eq } from 'drizzle-orm';

export async function getUserGoals(userId: number): Promise<Goal[]> {
  try {
    const results = await db.select()
      .from(goalsTable)
      .innerJoin(exercisesTable, eq(goalsTable.exercise_id, exercisesTable.id))
      .innerJoin(usersTable, eq(goalsTable.user_id, usersTable.id))
      .where(eq(goalsTable.user_id, userId))
      .execute();

    return results.map(result => ({
      id: result.goals.id,
      user_id: result.goals.user_id,
      exercise_id: result.goals.exercise_id,
      target_weight: parseFloat(result.goals.target_weight),
      target_reps: result.goals.target_reps,
      target_date: result.goals.target_date ? new Date(result.goals.target_date) : null,
      achieved: result.goals.achieved,
      achieved_date: result.goals.achieved_date ? new Date(result.goals.achieved_date) : null,
      created_at: result.goals.created_at
    }));
  } catch (error) {
    console.error('Failed to get user goals:', error);
    throw error;
  }
}
