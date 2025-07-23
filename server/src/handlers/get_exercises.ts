
import { db } from '../db';
import { exercisesTable } from '../db/schema';
import { type Exercise } from '../schema';

export const getExercises = async (): Promise<Exercise[]> => {
  try {
    const results = await db.select()
      .from(exercisesTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch exercises:', error);
    throw error;
  }
};
