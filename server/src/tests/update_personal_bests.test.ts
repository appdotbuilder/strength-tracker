
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, exercisesTable, workoutsTable, workoutExercisesTable, setsTable, personalBestsTable } from '../db/schema';
import { type Set } from '../schema';
import { updatePersonalBests } from '../handlers/update_personal_bests';
import { eq, and } from 'drizzle-orm';

describe('updatePersonalBests', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let exerciseId: number;
  let workoutId: number;
  let workoutExerciseId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create test exercise
    const exerciseResult = await db.insert(exercisesTable)
      .values({
        name: 'Bench Press',
        category: 'chest',
        description: 'Chest exercise'
      })
      .returning()
      .execute();
    exerciseId = exerciseResult[0].id;

    // Create test workout
    const workoutResult = await db.insert(workoutsTable)
      .values({
        user_id: userId,
        name: 'Test Workout',
        date: '2024-01-15', // Use string format for date column
        notes: null
      })
      .returning()
      .execute();
    workoutId = workoutResult[0].id;

    // Create workout exercise
    const workoutExerciseResult = await db.insert(workoutExercisesTable)
      .values({
        workout_id: workoutId,
        exercise_id: exerciseId,
        order_index: 1
      })
      .returning()
      .execute();
    workoutExerciseId = workoutExerciseResult[0].id;
  });

  it('should create first personal best for completed set', async () => {
    const testSet: Set = {
      id: 1,
      workout_exercise_id: workoutExerciseId,
      set_number: 1,
      reps: 10,
      weight: 135.0,
      completed: true,
      notes: null,
      created_at: new Date()
    };

    await updatePersonalBests(testSet);

    // Check that personal best was created
    const personalBests = await db.select()
      .from(personalBestsTable)
      .where(
        and(
          eq(personalBestsTable.user_id, userId),
          eq(personalBestsTable.exercise_id, exerciseId)
        )
      )
      .execute();

    expect(personalBests).toHaveLength(1);
    expect(parseFloat(personalBests[0].weight)).toEqual(135.0);
    expect(personalBests[0].reps).toEqual(10);
    expect(personalBests[0].user_id).toEqual(userId);
    expect(personalBests[0].exercise_id).toEqual(exerciseId);
    expect(personalBests[0].workout_id).toEqual(workoutId);
  });

  it('should update personal best with higher weight', async () => {
    // Create initial personal best
    await db.insert(personalBestsTable)
      .values({
        user_id: userId,
        exercise_id: exerciseId,
        weight: '135.0',
        reps: 10,
        date_achieved: '2024-01-14', // Use string format for date column
        workout_id: workoutId
      })
      .execute();

    const testSet: Set = {
      id: 1,
      workout_exercise_id: workoutExerciseId,
      set_number: 1,
      reps: 8,
      weight: 145.0, // Higher weight
      completed: true,
      notes: null,
      created_at: new Date()
    };

    await updatePersonalBests(testSet);

    // Check that new personal best was created
    const personalBests = await db.select()
      .from(personalBestsTable)
      .where(
        and(
          eq(personalBestsTable.user_id, userId),
          eq(personalBestsTable.exercise_id, exerciseId)
        )
      )
      .execute();

    expect(personalBests).toHaveLength(2); // Both records should exist
    
    // Find the latest personal best (highest weight)
    const latestPB = personalBests.find(pb => parseFloat(pb.weight) === 145.0);
    expect(latestPB).toBeDefined();
    expect(latestPB!.reps).toEqual(8);
  });

  it('should update personal best with same weight but more reps', async () => {
    // Create initial personal best
    await db.insert(personalBestsTable)
      .values({
        user_id: userId,
        exercise_id: exerciseId,
        weight: '135.0',
        reps: 8,
        date_achieved: '2024-01-14', // Use string format for date column
        workout_id: workoutId
      })
      .execute();

    const testSet: Set = {
      id: 1,
      workout_exercise_id: workoutExerciseId,
      set_number: 1,
      reps: 12, // More reps
      weight: 135.0, // Same weight
      completed: true,
      notes: null,
      created_at: new Date()
    };

    await updatePersonalBests(testSet);

    const personalBests = await db.select()
      .from(personalBestsTable)
      .where(
        and(
          eq(personalBestsTable.user_id, userId),
          eq(personalBestsTable.exercise_id, exerciseId)
        )
      )
      .execute();

    expect(personalBests).toHaveLength(2);
    
    // Find the new personal best
    const newPB = personalBests.find(pb => pb.reps === 12);
    expect(newPB).toBeDefined();
    expect(parseFloat(newPB!.weight)).toEqual(135.0);
  });

  it('should not create personal best for lower performance', async () => {
    // Create initial personal best
    await db.insert(personalBestsTable)
      .values({
        user_id: userId,
        exercise_id: exerciseId,
        weight: '145.0',
        reps: 10,
        date_achieved: '2024-01-14', // Use string format for date column
        workout_id: workoutId
      })
      .execute();

    const testSet: Set = {
      id: 1,
      workout_exercise_id: workoutExerciseId,
      set_number: 1,
      reps: 8, // Fewer reps
      weight: 135.0, // Lower weight
      completed: true,
      notes: null,
      created_at: new Date()
    };

    await updatePersonalBests(testSet);

    const personalBests = await db.select()
      .from(personalBestsTable)
      .where(
        and(
          eq(personalBestsTable.user_id, userId),
          eq(personalBestsTable.exercise_id, exerciseId)
        )
      )
      .execute();

    // Should still only have the original personal best
    expect(personalBests).toHaveLength(1);
    expect(parseFloat(personalBests[0].weight)).toEqual(145.0);
    expect(personalBests[0].reps).toEqual(10);
  });

  it('should not process incomplete sets', async () => {
    const testSet: Set = {
      id: 1,
      workout_exercise_id: workoutExerciseId,
      set_number: 1,
      reps: 10,
      weight: 135.0,
      completed: false, // Not completed
      notes: null,
      created_at: new Date()
    };

    await updatePersonalBests(testSet);

    const personalBests = await db.select()
      .from(personalBestsTable)
      .where(
        and(
          eq(personalBestsTable.user_id, userId),
          eq(personalBestsTable.exercise_id, exerciseId)
        )
      )
      .execute();

    expect(personalBests).toHaveLength(0);
  });
});
