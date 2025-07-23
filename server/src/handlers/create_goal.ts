
import { db } from '../db';
import { goalsTable } from '../db/schema';
import { type CreateGoalInput, type Goal } from '../schema';

export const createGoal = async (input: CreateGoalInput): Promise<Goal> => {
  try {
    // Insert goal record
    const result = await db.insert(goalsTable)
      .values({
        user_id: input.user_id,
        exercise_id: input.exercise_id,
        target_weight: input.target_weight.toString(), // Convert number to string for numeric column
        target_reps: input.target_reps,
        target_date: input.target_date?.toISOString().split('T')[0] || null // Convert Date to string (YYYY-MM-DD) or null
      })
      .returning()
      .execute();

    // Convert fields back to correct types before returning
    const goal = result[0];
    return {
      ...goal,
      target_weight: parseFloat(goal.target_weight), // Convert string back to number
      target_date: goal.target_date ? new Date(goal.target_date) : null, // Convert string back to Date or null
      achieved_date: goal.achieved_date ? new Date(goal.achieved_date) : null // Convert string back to Date or null
    };
  } catch (error) {
    console.error('Goal creation failed:', error);
    throw error;
  }
};
