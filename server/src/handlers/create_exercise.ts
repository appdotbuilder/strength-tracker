
import { db } from '../db';
import { exercisesTable } from '../db/schema';
import { type CreateExerciseInput, type Exercise } from '../schema';

export const createExercise = async (input: CreateExerciseInput): Promise<Exercise> => {
  try {
    // Insert exercise record
    const result = await db.insert(exercisesTable)
      .values({
        name: input.name,
        category: input.category,
        description: input.description
      })
      .returning()
      .execute();

    const exercise = result[0];
    return exercise;
  } catch (error) {
    console.error('Exercise creation failed:', error);
    throw error;
  }
};
