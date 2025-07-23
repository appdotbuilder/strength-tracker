
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, exercisesTable, workoutsTable, workoutExercisesTable, setsTable } from '../db/schema';
import { getWorkoutDetails } from '../handlers/get_workout_details';

describe('getWorkoutDetails', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent workout', async () => {
    const result = await getWorkoutDetails(999);
    expect(result).toBeNull();
  });

  it('should return workout with no exercises', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create workout with no exercises
    const workoutResult = await db.insert(workoutsTable)
      .values({
        user_id: userId,
        name: 'Empty Workout',
        date: '2024-01-15', // Use string format for date field
        notes: 'No exercises yet'
      })
      .returning()
      .execute();

    const workoutId = workoutResult[0].id;

    const result = await getWorkoutDetails(workoutId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(workoutId);
    expect(result!.name).toEqual('Empty Workout');
    expect(result!.user_id).toEqual(userId);
    expect(result!.date).toEqual(new Date('2024-01-15'));
    expect(result!.notes).toEqual('No exercises yet');
    expect(result!.exercises).toHaveLength(0);
  });

  it('should return complete workout details with exercises and sets', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create exercises
    const exerciseResults = await db.insert(exercisesTable)
      .values([
        {
          name: 'Bench Press',
          category: 'chest',
          description: 'Chest exercise'
        },
        {
          name: 'Squat',
          category: 'legs',
          description: 'Leg exercise'
        }
      ])
      .returning()
      .execute();

    const benchPressId = exerciseResults[0].id;
    const squatId = exerciseResults[1].id;

    // Create workout
    const workoutResult = await db.insert(workoutsTable)
      .values({
        user_id: userId,
        name: 'Push Day',
        date: '2024-01-15', // Use string format for date field
        notes: 'Great workout'
      })
      .returning()
      .execute();

    const workoutId = workoutResult[0].id;

    // Create workout exercises
    const workoutExerciseResults = await db.insert(workoutExercisesTable)
      .values([
        {
          workout_id: workoutId,
          exercise_id: benchPressId,
          order_index: 1
        },
        {
          workout_id: workoutId,
          exercise_id: squatId,
          order_index: 2
        }
      ])
      .returning()
      .execute();

    const benchWorkoutExerciseId = workoutExerciseResults[0].id;
    const squatWorkoutExerciseId = workoutExerciseResults[1].id;

    // Create sets for bench press
    await db.insert(setsTable)
      .values([
        {
          workout_exercise_id: benchWorkoutExerciseId,
          set_number: 1,
          reps: 10,
          weight: '135.50', // Use string format for numeric field
          completed: true,
          notes: 'Warm up set'
        },
        {
          workout_exercise_id: benchWorkoutExerciseId,
          set_number: 2,
          reps: 8,
          weight: '185.00', // Use string format for numeric field
          completed: true,
          notes: null
        }
      ])
      .execute();

    // Create sets for squat
    await db.insert(setsTable)
      .values([
        {
          workout_exercise_id: squatWorkoutExerciseId,
          set_number: 1,
          reps: 12,
          weight: '225.00', // Use string format for numeric field
          completed: true,
          notes: 'Heavy set'
        }
      ])
      .execute();

    const result = await getWorkoutDetails(workoutId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(workoutId);
    expect(result!.name).toEqual('Push Day');
    expect(result!.user_id).toEqual(userId);
    expect(result!.date).toEqual(new Date('2024-01-15'));
    expect(result!.notes).toEqual('Great workout');
    expect(result!.exercises).toHaveLength(2);

    // Check first exercise (Bench Press - order_index 1)
    const firstExercise = result!.exercises[0];
    expect(firstExercise.exercise_name).toEqual('Bench Press');
    expect(firstExercise.exercise_category).toEqual('chest');
    expect(firstExercise.exercise_description).toEqual('Chest exercise');
    expect(firstExercise.order_index).toEqual(1);
    expect(firstExercise.sets).toHaveLength(2);

    // Check bench press sets
    expect(firstExercise.sets[0].set_number).toEqual(1);
    expect(firstExercise.sets[0].reps).toEqual(10);
    expect(firstExercise.sets[0].weight).toEqual(135.5);
    expect(typeof firstExercise.sets[0].weight).toEqual('number');
    expect(firstExercise.sets[0].completed).toEqual(true);
    expect(firstExercise.sets[0].notes).toEqual('Warm up set');

    expect(firstExercise.sets[1].set_number).toEqual(2);
    expect(firstExercise.sets[1].reps).toEqual(8);
    expect(firstExercise.sets[1].weight).toEqual(185.0);
    expect(firstExercise.sets[1].completed).toEqual(true);
    expect(firstExercise.sets[1].notes).toBeNull();

    // Check second exercise (Squat - order_index 2)
    const secondExercise = result!.exercises[1];
    expect(secondExercise.exercise_name).toEqual('Squat');
    expect(secondExercise.exercise_category).toEqual('legs');
    expect(secondExercise.order_index).toEqual(2);
    expect(secondExercise.sets).toHaveLength(1);

    // Check squat set
    expect(secondExercise.sets[0].set_number).toEqual(1);
    expect(secondExercise.sets[0].reps).toEqual(12);
    expect(secondExercise.sets[0].weight).toEqual(225.0);
    expect(secondExercise.sets[0].completed).toEqual(true);
    expect(secondExercise.sets[0].notes).toEqual('Heavy set');
  });

  it('should return exercises in correct order', async () => {
    // Create test user and exercises
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const exerciseResults = await db.insert(exercisesTable)
      .values([
        { name: 'Exercise A', category: 'test', description: null },
        { name: 'Exercise B', category: 'test', description: null },
        { name: 'Exercise C', category: 'test', description: null }
      ])
      .returning()
      .execute();

    // Create workout
    const workoutResult = await db.insert(workoutsTable)
      .values({
        user_id: userResult[0].id,
        name: 'Order Test',
        date: '2024-01-15', // Use string format for date field
        notes: null
      })
      .returning()
      .execute();

    // Add exercises in different order (3, 1, 2)
    await db.insert(workoutExercisesTable)
      .values([
        {
          workout_id: workoutResult[0].id,
          exercise_id: exerciseResults[2].id, // Exercise C
          order_index: 3
        },
        {
          workout_id: workoutResult[0].id,
          exercise_id: exerciseResults[0].id, // Exercise A
          order_index: 1
        },
        {
          workout_id: workoutResult[0].id,
          exercise_id: exerciseResults[1].id, // Exercise B
          order_index: 2
        }
      ])
      .execute();

    const result = await getWorkoutDetails(workoutResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.exercises).toHaveLength(3);
    expect(result!.exercises[0].exercise_name).toEqual('Exercise A'); // order_index 1
    expect(result!.exercises[1].exercise_name).toEqual('Exercise B'); // order_index 2
    expect(result!.exercises[2].exercise_name).toEqual('Exercise C'); // order_index 3
  });

  it('should handle exercises without sets', async () => {
    // Create test user and exercise
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const exerciseResult = await db.insert(exercisesTable)
      .values({
        name: 'Planned Exercise',
        category: 'test',
        description: null
      })
      .returning()
      .execute();

    // Create workout
    const workoutResult = await db.insert(workoutsTable)
      .values({
        user_id: userResult[0].id,
        name: 'Incomplete Workout',
        date: '2024-01-15', // Use string format for date field
        notes: null
      })
      .returning()
      .execute();

    // Add exercise without sets
    await db.insert(workoutExercisesTable)
      .values({
        workout_id: workoutResult[0].id,
        exercise_id: exerciseResult[0].id,
        order_index: 1
      })
      .execute();

    const result = await getWorkoutDetails(workoutResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.exercises).toHaveLength(1);
    expect(result!.exercises[0].exercise_name).toEqual('Planned Exercise');
    expect(result!.exercises[0].sets).toHaveLength(0);
  });
});
