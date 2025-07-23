
import { db } from '../db';
import { workoutsTable, workoutExercisesTable, exercisesTable, setsTable } from '../db/schema';
import { eq, asc } from 'drizzle-orm';

export interface WorkoutDetails {
  id: number;
  user_id: number;
  name: string;
  date: Date;
  notes: string | null;
  created_at: Date;
  exercises: {
    id: number;
    exercise_id: number;
    exercise_name: string;
    exercise_category: string;
    exercise_description: string | null;
    order_index: number;
    sets: {
      id: number;
      set_number: number;
      reps: number;
      weight: number;
      completed: boolean;
      notes: string | null;
      created_at: Date;
    }[];
  }[];
}

export async function getWorkoutDetails(workoutId: number): Promise<WorkoutDetails | null> {
  try {
    // First, get the workout
    const workoutResult = await db.select()
      .from(workoutsTable)
      .where(eq(workoutsTable.id, workoutId))
      .execute();

    if (workoutResult.length === 0) {
      return null;
    }

    const workout = workoutResult[0];

    // Get workout exercises with exercise details and sets
    const workoutExercisesResult = await db.select()
      .from(workoutExercisesTable)
      .innerJoin(exercisesTable, eq(workoutExercisesTable.exercise_id, exercisesTable.id))
      .leftJoin(setsTable, eq(setsTable.workout_exercise_id, workoutExercisesTable.id))
      .where(eq(workoutExercisesTable.workout_id, workoutId))
      .orderBy(asc(workoutExercisesTable.order_index), asc(setsTable.set_number))
      .execute();

    // Group the results by workout exercise
    const exerciseMap = new Map<number, {
      id: number;
      exercise_id: number;
      exercise_name: string;
      exercise_category: string;
      exercise_description: string | null;
      order_index: number;
      sets: {
        id: number;
        set_number: number;
        reps: number;
        weight: number;
        completed: boolean;
        notes: string | null;
        created_at: Date;
      }[];
    }>();

    for (const result of workoutExercisesResult) {
      const workoutExercise = result.workout_exercises;
      const exercise = result.exercises;
      const set = result.sets;

      if (!exerciseMap.has(workoutExercise.id)) {
        exerciseMap.set(workoutExercise.id, {
          id: workoutExercise.id,
          exercise_id: exercise.id,
          exercise_name: exercise.name,
          exercise_category: exercise.category,
          exercise_description: exercise.description,
          order_index: workoutExercise.order_index,
          sets: []
        });
      }

      // Add set if it exists (left join might return null for exercises without sets)
      if (set) {
        exerciseMap.get(workoutExercise.id)!.sets.push({
          id: set.id,
          set_number: set.set_number,
          reps: set.reps,
          weight: parseFloat(set.weight), // Convert numeric to number
          completed: set.completed,
          notes: set.notes,
          created_at: set.created_at
        });
      }
    }

    // Convert map to array and sort by order_index
    const exercises = Array.from(exerciseMap.values())
      .sort((a, b) => a.order_index - b.order_index);

    return {
      id: workout.id,
      user_id: workout.user_id,
      name: workout.name,
      date: new Date(workout.date), // Convert string date to Date object
      notes: workout.notes,
      created_at: workout.created_at,
      exercises
    };
  } catch (error) {
    console.error('Get workout details failed:', error);
    throw error;
  }
}
