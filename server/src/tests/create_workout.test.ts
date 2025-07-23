
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { workoutsTable, usersTable } from '../db/schema';
import { type CreateWorkoutInput } from '../schema';
import { createWorkout } from '../handlers/create_workout';
import { eq } from 'drizzle-orm';

describe('createWorkout', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  beforeEach(async () => {
    // Create a test user first for foreign key relationship
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
  });

  it('should create a workout', async () => {
    const testInput: CreateWorkoutInput = {
      user_id: testUserId,
      name: 'Chest Day',
      date: new Date('2024-01-15'),
      notes: 'Heavy bench press session'
    };

    const result = await createWorkout(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(testUserId);
    expect(result.name).toEqual('Chest Day');
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.notes).toEqual('Heavy bench press session');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save workout to database', async () => {
    const testInput: CreateWorkoutInput = {
      user_id: testUserId,
      name: 'Leg Day',
      date: new Date('2024-01-16'),
      notes: 'Squat focus'
    };

    const result = await createWorkout(testInput);

    // Query database to verify workout was saved
    const workouts = await db.select()
      .from(workoutsTable)
      .where(eq(workoutsTable.id, result.id))
      .execute();

    expect(workouts).toHaveLength(1);
    expect(workouts[0].user_id).toEqual(testUserId);
    expect(workouts[0].name).toEqual('Leg Day');
    expect(new Date(workouts[0].date)).toEqual(new Date('2024-01-16'));
    expect(workouts[0].notes).toEqual('Squat focus');
    expect(workouts[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle workout with null notes', async () => {
    const testInput: CreateWorkoutInput = {
      user_id: testUserId,
      name: 'Back Day',
      date: new Date('2024-01-17'),
      notes: null
    };

    const result = await createWorkout(testInput);

    expect(result.notes).toBeNull();
    expect(result.name).toEqual('Back Day');
    expect(result.user_id).toEqual(testUserId);
  });

  it('should throw error for non-existent user', async () => {
    const testInput: CreateWorkoutInput = {
      user_id: 99999, // Non-existent user ID
      name: 'Invalid Workout',
      date: new Date('2024-01-18'),
      notes: 'This should fail'
    };

    await expect(createWorkout(testInput)).rejects.toThrow(/user with id 99999 does not exist/i);
  });
});
