
import { db } from '../db';
import { setsTable } from '../db/schema';
import { type CreateSetInput, type Set } from '../schema';

export const createSet = async (input: CreateSetInput): Promise<Set> => {
  try {
    // Insert set record
    const result = await db.insert(setsTable)
      .values({
        workout_exercise_id: input.workout_exercise_id,
        set_number: input.set_number,
        reps: input.reps,
        weight: input.weight.toString(), // Convert number to string for numeric column
        completed: input.completed,
        notes: input.notes
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const set = result[0];
    return {
      ...set,
      weight: parseFloat(set.weight) // Convert string back to number
    };
  } catch (error) {
    console.error('Set creation failed:', error);
    throw error;
  }
};
