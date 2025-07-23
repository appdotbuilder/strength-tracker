
import { db } from '../db';
import { workoutExercisesTable } from '../db/schema';
import { type CreateWorkoutExerciseInput, type WorkoutExercise } from '../schema';

export const addExerciseToWorkout = async (input: CreateWorkoutExerciseInput): Promise<WorkoutExercise> => {
  try {
    const result = await db.insert(workoutExercisesTable)
      .values({
        workout_id: input.workout_id,
        exercise_id: input.exercise_id,
        order_index: input.order_index
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Adding exercise to workout failed:', error);
    throw error;
  }
};
