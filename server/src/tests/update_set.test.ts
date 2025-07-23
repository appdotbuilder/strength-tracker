
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, exercisesTable, workoutsTable, workoutExercisesTable, setsTable } from '../db/schema';
import { type UpdateSetInput } from '../schema';
import { updateSet } from '../handlers/update_set';
import { eq } from 'drizzle-orm';

describe('updateSet', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let exerciseId: number;
  let workoutId: number;
  let workoutExerciseId: number;
  let setId: number;

  beforeEach(async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    userId = user[0].id;

    const exercise = await db.insert(exercisesTable)
      .values({
        name: 'Bench Press',
        category: 'chest',
        description: 'Chest exercise'
      })
      .returning()
      .execute();
    exerciseId = exercise[0].id;

    const workout = await db.insert(workoutsTable)
      .values({
        user_id: userId,
        name: 'Test Workout',
        date: '2024-01-01',
        notes: 'Test workout'
      })
      .returning()
      .execute();
    workoutId = workout[0].id;

    const workoutExercise = await db.insert(workoutExercisesTable)
      .values({
        workout_id: workoutId,
        exercise_id: exerciseId,
        order_index: 1
      })
      .returning()
      .execute();
    workoutExerciseId = workoutExercise[0].id;

    const set = await db.insert(setsTable)
      .values({
        workout_exercise_id: workoutExerciseId,
        set_number: 1,
        reps: 10,
        weight: '100.00',
        completed: false,
        notes: 'Initial notes'
      })
      .returning()
      .execute();
    setId = set[0].id;
  });

  it('should update a set with all fields', async () => {
    const input: UpdateSetInput = {
      id: setId,
      reps: 12,
      weight: 105.5,
      completed: true,
      notes: 'Updated notes'
    };

    const result = await updateSet(input);

    expect(result.id).toEqual(setId);
    expect(result.reps).toEqual(12);
    expect(result.weight).toEqual(105.5);
    expect(typeof result.weight).toEqual('number');
    expect(result.completed).toEqual(true);
    expect(result.notes).toEqual('Updated notes');
    expect(result.workout_exercise_id).toEqual(workoutExerciseId);
    expect(result.set_number).toEqual(1);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update a set with partial fields', async () => {
    const input: UpdateSetInput = {
      id: setId,
      reps: 8,
      completed: true
    };

    const result = await updateSet(input);

    expect(result.id).toEqual(setId);
    expect(result.reps).toEqual(8);
    expect(result.weight).toEqual(100); // Original value
    expect(result.completed).toEqual(true);
    expect(result.notes).toEqual('Initial notes'); // Original value
  });

  it('should update notes to null', async () => {
    const input: UpdateSetInput = {
      id: setId,
      notes: null
    };

    const result = await updateSet(input);

    expect(result.notes).toBeNull();
  });

  it('should persist changes in database', async () => {
    const input: UpdateSetInput = {
      id: setId,
      reps: 15,
      weight: 110.25,
      completed: true,
      notes: 'Great set!'
    };

    await updateSet(input);

    const sets = await db.select()
      .from(setsTable)
      .where(eq(setsTable.id, setId))
      .execute();

    expect(sets).toHaveLength(1);
    const dbSet = sets[0];
    expect(dbSet.reps).toEqual(15);
    expect(parseFloat(dbSet.weight)).toEqual(110.25);
    expect(dbSet.completed).toEqual(true);
    expect(dbSet.notes).toEqual('Great set!');
  });

  it('should throw error when set does not exist', async () => {
    const input: UpdateSetInput = {
      id: 99999,
      reps: 10
    };

    expect(updateSet(input)).rejects.toThrow(/not found/i);
  });

  it('should handle zero values correctly', async () => {
    const input: UpdateSetInput = {
      id: setId,
      reps: 0,
      weight: 0
    };

    const result = await updateSet(input);

    expect(result.reps).toEqual(0);
    expect(result.weight).toEqual(0);
    expect(typeof result.weight).toEqual('number');
  });
});
