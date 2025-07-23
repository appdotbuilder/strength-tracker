
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { setsTable, usersTable, exercisesTable, workoutsTable, workoutExercisesTable } from '../db/schema';
import { type CreateSetInput } from '../schema';
import { createSet } from '../handlers/create_set';
import { eq } from 'drizzle-orm';

describe('createSet', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a set', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const exercise = await db.insert(exercisesTable)
      .values({
        name: 'Bench Press',
        category: 'chest',
        description: 'A chest exercise'
      })
      .returning()
      .execute();

    const workout = await db.insert(workoutsTable)
      .values({
        user_id: user[0].id,
        name: 'Test Workout',
        date: '2024-01-01',
        notes: null
      })
      .returning()
      .execute();

    const workoutExercise = await db.insert(workoutExercisesTable)
      .values({
        workout_id: workout[0].id,
        exercise_id: exercise[0].id,
        order_index: 1
      })
      .returning()
      .execute();

    const testInput: CreateSetInput = {
      workout_exercise_id: workoutExercise[0].id,
      set_number: 1,
      reps: 10,
      weight: 135.5,
      completed: true,
      notes: 'Good form'
    };

    const result = await createSet(testInput);

    // Basic field validation
    expect(result.workout_exercise_id).toEqual(workoutExercise[0].id);
    expect(result.set_number).toEqual(1);
    expect(result.reps).toEqual(10);
    expect(result.weight).toEqual(135.5);
    expect(typeof result.weight).toBe('number');
    expect(result.completed).toEqual(true);
    expect(result.notes).toEqual('Good form');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save set to database', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const exercise = await db.insert(exercisesTable)
      .values({
        name: 'Squat',
        category: 'legs',
        description: null
      })
      .returning()
      .execute();

    const workout = await db.insert(workoutsTable)
      .values({
        user_id: user[0].id,
        name: 'Leg Day',
        date: '2024-01-02',
        notes: null
      })
      .returning()
      .execute();

    const workoutExercise = await db.insert(workoutExercisesTable)
      .values({
        workout_id: workout[0].id,
        exercise_id: exercise[0].id,
        order_index: 1
      })
      .returning()
      .execute();

    const testInput: CreateSetInput = {
      workout_exercise_id: workoutExercise[0].id,
      set_number: 2,
      reps: 8,
      weight: 225.0,
      completed: false,
      notes: null
    };

    const result = await createSet(testInput);

    // Query using proper drizzle syntax
    const sets = await db.select()
      .from(setsTable)
      .where(eq(setsTable.id, result.id))
      .execute();

    expect(sets).toHaveLength(1);
    expect(sets[0].workout_exercise_id).toEqual(workoutExercise[0].id);
    expect(sets[0].set_number).toEqual(2);
    expect(sets[0].reps).toEqual(8);
    expect(parseFloat(sets[0].weight)).toEqual(225.0);
    expect(sets[0].completed).toEqual(false);
    expect(sets[0].notes).toEqual(null);
    expect(sets[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle zero weight and reps correctly', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const exercise = await db.insert(exercisesTable)
      .values({
        name: 'Push-ups',
        category: 'chest',
        description: 'Bodyweight exercise'
      })
      .returning()
      .execute();

    const workout = await db.insert(workoutsTable)
      .values({
        user_id: user[0].id,
        name: 'Bodyweight Workout',
        date: '2024-01-03',
        notes: null
      })
      .returning()
      .execute();

    const workoutExercise = await db.insert(workoutExercisesTable)
      .values({
        workout_id: workout[0].id,
        exercise_id: exercise[0].id,
        order_index: 1
      })
      .returning()
      .execute();

    const testInput: CreateSetInput = {
      workout_exercise_id: workoutExercise[0].id,
      set_number: 1,
      reps: 0,
      weight: 0,
      completed: true,
      notes: 'Warm-up set'
    };

    const result = await createSet(testInput);

    expect(result.reps).toEqual(0);
    expect(result.weight).toEqual(0);
    expect(typeof result.weight).toBe('number');
    expect(result.completed).toEqual(true);
    expect(result.notes).toEqual('Warm-up set');
  });
});
