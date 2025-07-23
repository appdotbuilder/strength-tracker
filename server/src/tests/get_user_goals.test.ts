
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, exercisesTable, goalsTable } from '../db/schema';
import { getUserGoals } from '../handlers/get_user_goals';

describe('getUserGoals', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no goals', async () => {
    // Create a user but no goals
    const users = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const result = await getUserGoals(users[0].id);

    expect(result).toEqual([]);
  });

  it('should return all goals for a user', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create exercises
    const exercises = await db.insert(exercisesTable)
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

    // Create goals
    const targetDate = '2024-12-31';
    const achievedDate = '2024-06-15';
    
    await db.insert(goalsTable)
      .values({
        user_id: users[0].id,
        exercise_id: exercises[0].id,
        target_weight: '225.50',
        target_reps: 5,
        target_date: targetDate,
        achieved: false
      })
      .execute();

    await db.insert(goalsTable)
      .values({
        user_id: users[0].id,
        exercise_id: exercises[1].id,
        target_weight: '315.00',
        target_reps: 3,
        target_date: null,
        achieved: true,
        achieved_date: achievedDate
      })
      .execute();

    const result = await getUserGoals(users[0].id);

    expect(result).toHaveLength(2);
    
    // Check first goal
    const benchGoal = result.find(g => g.exercise_id === exercises[0].id);
    expect(benchGoal).toBeDefined();
    expect(benchGoal!.target_weight).toEqual(225.50);
    expect(typeof benchGoal!.target_weight).toBe('number');
    expect(benchGoal!.target_reps).toEqual(5);
    expect(benchGoal!.target_date).toEqual(new Date('2024-12-31'));
    expect(benchGoal!.achieved).toBe(false);
    expect(benchGoal!.achieved_date).toBeNull();

    // Check second goal
    const squatGoal = result.find(g => g.exercise_id === exercises[1].id);
    expect(squatGoal).toBeDefined();
    expect(squatGoal!.target_weight).toEqual(315.00);
    expect(typeof squatGoal!.target_weight).toBe('number');
    expect(squatGoal!.target_reps).toEqual(3);
    expect(squatGoal!.target_date).toBeNull();
    expect(squatGoal!.achieved).toBe(true);
    expect(squatGoal!.achieved_date).toEqual(new Date('2024-06-15'));
  });

  it('should only return goals for the specified user', async () => {
    // Create two users
    const users = await db.insert(usersTable)
      .values([
        {
          name: 'User One',
          email: 'user1@example.com'
        },
        {
          name: 'User Two',
          email: 'user2@example.com'
        }
      ])
      .returning()
      .execute();

    // Create exercise
    const exercises = await db.insert(exercisesTable)
      .values({
        name: 'Deadlift',
        category: 'back',
        description: 'Back exercise'
      })
      .returning()
      .execute();

    // Create goals for both users
    await db.insert(goalsTable)
      .values({
        user_id: users[0].id,
        exercise_id: exercises[0].id,
        target_weight: '405.00',
        target_reps: 1,
        achieved: false
      })
      .execute();

    await db.insert(goalsTable)
      .values({
        user_id: users[1].id,
        exercise_id: exercises[0].id,
        target_weight: '315.00',
        target_reps: 2,
        achieved: false
      })
      .execute();

    const result = await getUserGoals(users[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(users[0].id);
    expect(result[0].target_weight).toEqual(405.00);
    expect(result[0].target_reps).toEqual(1);
  });

  it('should handle user with non-existent ID', async () => {
    const result = await getUserGoals(999);

    expect(result).toEqual([]);
  });
});
