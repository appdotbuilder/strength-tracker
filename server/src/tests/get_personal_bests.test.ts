
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, exercisesTable, workoutsTable, personalBestsTable } from '../db/schema';
import { type GetPersonalBestsInput } from '../schema';
import { getPersonalBests } from '../handlers/get_personal_bests';

describe('getPersonalBests', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get all personal bests for a user', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values({ name: 'Test User', email: 'test@example.com' })
      .returning()
      .execute();

    // Create exercises
    const [exercise1] = await db.insert(exercisesTable)
      .values({ name: 'Bench Press', category: 'chest', description: null })
      .returning()
      .execute();

    const [exercise2] = await db.insert(exercisesTable)
      .values({ name: 'Squat', category: 'legs', description: null })
      .returning()
      .execute();

    // Create workout
    const [workout] = await db.insert(workoutsTable)
      .values({ 
        user_id: user.id, 
        name: 'Test Workout', 
        date: '2024-01-01',
        notes: null 
      })
      .returning()
      .execute();

    // Create personal bests
    await db.insert(personalBestsTable)
      .values([
        {
          user_id: user.id,
          exercise_id: exercise1.id,
          weight: '225.50',
          reps: 5,
          date_achieved: '2024-01-01',
          workout_id: workout.id
        },
        {
          user_id: user.id,
          exercise_id: exercise2.id,
          weight: '315.00', 
          reps: 3,
          date_achieved: '2024-01-01',
          workout_id: workout.id
        }
      ])
      .execute();

    const input: GetPersonalBestsInput = {
      user_id: user.id
    };

    const result = await getPersonalBests(input);

    expect(result).toHaveLength(2);
    expect(result[0].user_id).toEqual(user.id);
    expect(typeof result[0].weight).toBe('number');
    expect(result[0].weight).toEqual(225.5);
    expect(result[1].weight).toEqual(315);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].date_achieved).toBeInstanceOf(Date);
  });

  it('should get personal bests filtered by exercise', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values({ name: 'Test User', email: 'test@example.com' })
      .returning()
      .execute();

    // Create exercises
    const [exercise1] = await db.insert(exercisesTable)
      .values({ name: 'Bench Press', category: 'chest', description: null })
      .returning()
      .execute();

    const [exercise2] = await db.insert(exercisesTable)
      .values({ name: 'Squat', category: 'legs', description: null })
      .returning()
      .execute();

    // Create workout
    const [workout] = await db.insert(workoutsTable)
      .values({ 
        user_id: user.id, 
        name: 'Test Workout', 
        date: '2024-01-01',
        notes: null 
      })
      .returning()
      .execute();

    // Create personal bests for both exercises
    await db.insert(personalBestsTable)
      .values([
        {
          user_id: user.id,
          exercise_id: exercise1.id,
          weight: '225.50',
          reps: 5,
          date_achieved: '2024-01-01',
          workout_id: workout.id
        },
        {
          user_id: user.id,
          exercise_id: exercise2.id,
          weight: '315.00',
          reps: 3,
          date_achieved: '2024-01-01',
          workout_id: workout.id
        }
      ])
      .execute();

    const input: GetPersonalBestsInput = {
      user_id: user.id,
      exercise_id: exercise1.id
    };

    const result = await getPersonalBests(input);

    expect(result).toHaveLength(1);
    expect(result[0].exercise_id).toEqual(exercise1.id);
    expect(result[0].weight).toEqual(225.5);
    expect(typeof result[0].weight).toBe('number');
    expect(result[0].date_achieved).toBeInstanceOf(Date);
  });

  it('should return empty array for user with no personal bests', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values({ name: 'Test User', email: 'test@example.com' })
      .returning()
      .execute();

    const input: GetPersonalBestsInput = {
      user_id: user.id
    };

    const result = await getPersonalBests(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent user', async () => {
    const input: GetPersonalBestsInput = {
      user_id: 999 // Non-existent user ID
    };

    const result = await getPersonalBests(input);

    expect(result).toHaveLength(0);
  });
});
