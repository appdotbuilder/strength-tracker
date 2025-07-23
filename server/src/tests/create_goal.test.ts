
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { goalsTable, usersTable, exercisesTable } from '../db/schema';
import { type CreateGoalInput, type CreateUserInput, type CreateExerciseInput } from '../schema';
import { createGoal } from '../handlers/create_goal';
import { eq } from 'drizzle-orm';

// Test data setup
const testUser: CreateUserInput = {
  name: 'Test User',
  email: 'test@example.com'
};

const testExercise: CreateExerciseInput = {
  name: 'Bench Press',
  category: 'chest',
  description: 'Classic chest exercise'
};

describe('createGoal', () => {
  let userId: number;
  let exerciseId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create prerequisite exercise
    const exerciseResult = await db.insert(exercisesTable)
      .values(testExercise)
      .returning()
      .execute();
    exerciseId = exerciseResult[0].id;
  });

  afterEach(resetDB);

  it('should create a goal with all fields', async () => {
    const testInput: CreateGoalInput = {
      user_id: userId,
      exercise_id: exerciseId,
      target_weight: 225.5,
      target_reps: 5,
      target_date: new Date('2024-12-31')
    };

    const result = await createGoal(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(userId);
    expect(result.exercise_id).toEqual(exerciseId);
    expect(result.target_weight).toEqual(225.5);
    expect(typeof result.target_weight).toBe('number');
    expect(result.target_reps).toEqual(5);
    expect(result.target_date).toEqual(new Date('2024-12-31'));
    expect(result.achieved).toEqual(false);
    expect(result.achieved_date).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a goal without target_date', async () => {
    const testInput: CreateGoalInput = {
      user_id: userId,
      exercise_id: exerciseId,
      target_weight: 185.0,
      target_reps: 10,
      target_date: null
    };

    const result = await createGoal(testInput);

    expect(result.user_id).toEqual(userId);
    expect(result.exercise_id).toEqual(exerciseId);
    expect(result.target_weight).toEqual(185.0);
    expect(result.target_reps).toEqual(10);
    expect(result.target_date).toBeNull();
    expect(result.achieved).toEqual(false);
    expect(result.achieved_date).toBeNull();
  });

  it('should save goal to database', async () => {
    const testInput: CreateGoalInput = {
      user_id: userId,
      exercise_id: exerciseId,
      target_weight: 315.25,
      target_reps: 1,
      target_date: new Date('2025-06-01')
    };

    const result = await createGoal(testInput);

    // Query using proper drizzle syntax
    const goals = await db.select()
      .from(goalsTable)
      .where(eq(goalsTable.id, result.id))
      .execute();

    expect(goals).toHaveLength(1);
    expect(goals[0].user_id).toEqual(userId);
    expect(goals[0].exercise_id).toEqual(exerciseId);
    expect(parseFloat(goals[0].target_weight)).toEqual(315.25);
    expect(goals[0].target_reps).toEqual(1);
    expect(goals[0].target_date).toEqual('2025-06-01'); // Date column returns string in YYYY-MM-DD format
    expect(goals[0].achieved).toEqual(false);
    expect(goals[0].achieved_date).toBeNull();
    expect(goals[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for invalid user_id', async () => {
    const testInput: CreateGoalInput = {
      user_id: 99999, // Non-existent user
      exercise_id: exerciseId,
      target_weight: 200.0,
      target_reps: 5,
      target_date: null
    };

    await expect(createGoal(testInput)).rejects.toThrow(/foreign key constraint/i);
  });

  it('should throw error for invalid exercise_id', async () => {
    const testInput: CreateGoalInput = {
      user_id: userId,
      exercise_id: 99999, // Non-existent exercise
      target_weight: 200.0,
      target_reps: 5,
      target_date: null
    };

    await expect(createGoal(testInput)).rejects.toThrow(/foreign key constraint/i);
  });
});
