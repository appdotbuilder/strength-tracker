
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, exercisesTable, workoutsTable, workoutExercisesTable } from '../db/schema';
import { type CreateWorkoutExerciseInput } from '../schema';
import { addExerciseToWorkout } from '../handlers/add_exercise_to_workout';
import { eq } from 'drizzle-orm';

describe('addExerciseToWorkout', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let exerciseId: number;
  let workoutId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({ name: 'Test User', email: 'test@example.com' })
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create test exercise
    const exerciseResult = await db.insert(exercisesTable)
      .values({ 
        name: 'Bench Press',
        category: 'chest',
        description: 'Classic chest exercise'
      })
      .returning()
      .execute();
    exerciseId = exerciseResult[0].id;

    // Create test workout
    const workoutResult = await db.insert(workoutsTable)
      .values({
        user_id: userId,
        name: 'Push Day',
        date: '2024-01-15',
        notes: 'Chest and shoulders'
      })
      .returning()
      .execute();
    workoutId = workoutResult[0].id;
  });

  it('should add exercise to workout', async () => {
    const testInput: CreateWorkoutExerciseInput = {
      workout_id: workoutId,
      exercise_id: exerciseId,
      order_index: 1
    };

    const result = await addExerciseToWorkout(testInput);

    expect(result.workout_id).toEqual(workoutId);
    expect(result.exercise_id).toEqual(exerciseId);
    expect(result.order_index).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save workout exercise to database', async () => {
    const testInput: CreateWorkoutExerciseInput = {
      workout_id: workoutId,
      exercise_id: exerciseId,
      order_index: 2
    };

    const result = await addExerciseToWorkout(testInput);

    const workoutExercises = await db.select()
      .from(workoutExercisesTable)
      .where(eq(workoutExercisesTable.id, result.id))
      .execute();

    expect(workoutExercises).toHaveLength(1);
    expect(workoutExercises[0].workout_id).toEqual(workoutId);
    expect(workoutExercises[0].exercise_id).toEqual(exerciseId);
    expect(workoutExercises[0].order_index).toEqual(2);
    expect(workoutExercises[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle multiple exercises in same workout with different order', async () => {
    // Create second exercise
    const exercise2Result = await db.insert(exercisesTable)
      .values({ 
        name: 'Shoulder Press',
        category: 'shoulders',
        description: 'Overhead pressing movement'
      })
      .returning()
      .execute();
    const exercise2Id = exercise2Result[0].id;

    // Add first exercise
    const input1: CreateWorkoutExerciseInput = {
      workout_id: workoutId,
      exercise_id: exerciseId,
      order_index: 1
    };

    // Add second exercise
    const input2: CreateWorkoutExerciseInput = {
      workout_id: workoutId,
      exercise_id: exercise2Id,
      order_index: 2
    };

    const result1 = await addExerciseToWorkout(input1);
    const result2 = await addExerciseToWorkout(input2);

    expect(result1.order_index).toEqual(1);
    expect(result2.order_index).toEqual(2);

    const allWorkoutExercises = await db.select()
      .from(workoutExercisesTable)
      .where(eq(workoutExercisesTable.workout_id, workoutId))
      .execute();

    expect(allWorkoutExercises).toHaveLength(2);
  });

  it('should throw error for non-existent workout', async () => {
    const testInput: CreateWorkoutExerciseInput = {
      workout_id: 99999, // Non-existent workout
      exercise_id: exerciseId,
      order_index: 1
    };

    expect(addExerciseToWorkout(testInput)).rejects.toThrow(/foreign key constraint/i);
  });

  it('should throw error for non-existent exercise', async () => {
    const testInput: CreateWorkoutExerciseInput = {
      workout_id: workoutId,
      exercise_id: 99999, // Non-existent exercise
      order_index: 1
    };

    expect(addExerciseToWorkout(testInput)).rejects.toThrow(/foreign key constraint/i);
  });
});
