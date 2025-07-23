
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, workoutsTable } from '../db/schema';
import { type GetWorkoutsByDateRangeInput } from '../schema';
import { getWorkoutsByDateRange } from '../handlers/get_workouts_by_date_range';

describe('getWorkoutsByDateRange', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return workouts within date range for user', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = user[0].id;

    // Create workouts with different dates (convert to ISO date strings)
    const startDate = new Date('2024-01-01');
    const middleDate = new Date('2024-01-15');
    const endDate = new Date('2024-01-31');
    const outsideDate = new Date('2024-02-15');

    await db.insert(workoutsTable)
      .values([
        {
          user_id: userId,
          name: 'Workout 1',
          date: startDate.toISOString().split('T')[0],
          notes: null
        },
        {
          user_id: userId,
          name: 'Workout 2',
          date: middleDate.toISOString().split('T')[0],
          notes: 'Middle workout'
        },
        {
          user_id: userId,
          name: 'Workout 3',
          date: endDate.toISOString().split('T')[0],
          notes: null
        },
        {
          user_id: userId,
          name: 'Outside Workout',
          date: outsideDate.toISOString().split('T')[0],
          notes: 'Should not be included'
        }
      ])
      .execute();

    const input: GetWorkoutsByDateRangeInput = {
      user_id: userId,
      start_date: startDate,
      end_date: endDate
    };

    const result = await getWorkoutsByDateRange(input);

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Workout 1');
    expect(result[1].name).toEqual('Workout 2');
    expect(result[2].name).toEqual('Workout 3');
    
    // Verify dates are within range and are Date objects
    result.forEach(workout => {
      expect(workout.date).toBeInstanceOf(Date);
      expect(workout.date >= startDate).toBe(true);
      expect(workout.date <= endDate).toBe(true);
    });
  });

  it('should return empty array when no workouts in date range', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = user[0].id;

    // Create workout outside the search range
    await db.insert(workoutsTable)
      .values({
        user_id: userId,
        name: 'Outside Workout',
        date: new Date('2024-02-15').toISOString().split('T')[0],
        notes: null
      })
      .execute();

    const input: GetWorkoutsByDateRangeInput = {
      user_id: userId,
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getWorkoutsByDateRange(input);

    expect(result).toHaveLength(0);
  });

  it('should only return workouts for specified user', async () => {
    // Create two test users
    const users = await db.insert(usersTable)
      .values([
        {
          name: 'User 1',
          email: 'user1@example.com'
        },
        {
          name: 'User 2',
          email: 'user2@example.com'
        }
      ])
      .returning()
      .execute();

    const user1Id = users[0].id;
    const user2Id = users[1].id;

    const testDate = new Date('2024-01-15');

    // Create workouts for both users
    await db.insert(workoutsTable)
      .values([
        {
          user_id: user1Id,
          name: 'User 1 Workout',
          date: testDate.toISOString().split('T')[0],
          notes: null
        },
        {
          user_id: user2Id,
          name: 'User 2 Workout',
          date: testDate.toISOString().split('T')[0],
          notes: null
        }
      ])
      .execute();

    const input: GetWorkoutsByDateRangeInput = {
      user_id: user1Id,
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getWorkoutsByDateRange(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('User 1 Workout');
    expect(result[0].user_id).toEqual(user1Id);
  });

  it('should return workouts ordered by date', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = user[0].id;

    // Create workouts in reverse chronological order
    await db.insert(workoutsTable)
      .values([
        {
          user_id: userId,
          name: 'Latest Workout',
          date: new Date('2024-01-31').toISOString().split('T')[0],
          notes: null
        },
        {
          user_id: userId,
          name: 'Middle Workout',
          date: new Date('2024-01-15').toISOString().split('T')[0],
          notes: null
        },
        {
          user_id: userId,
          name: 'Earliest Workout',
          date: new Date('2024-01-01').toISOString().split('T')[0],
          notes: null
        }
      ])
      .execute();

    const input: GetWorkoutsByDateRangeInput = {
      user_id: userId,
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getWorkoutsByDateRange(input);

    expect(result).toHaveLength(3);
    // Should be ordered by date ascending
    expect(result[0].name).toEqual('Earliest Workout');
    expect(result[1].name).toEqual('Middle Workout');
    expect(result[2].name).toEqual('Latest Workout');
  });

  it('should handle single day date range', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = user[0].id;
    const singleDate = new Date('2024-01-15');

    // Create workouts on and around the target date
    await db.insert(workoutsTable)
      .values([
        {
          user_id: userId,
          name: 'Target Workout',
          date: singleDate.toISOString().split('T')[0],
          notes: null
        },
        {
          user_id: userId,
          name: 'Before Workout',
          date: new Date('2024-01-14').toISOString().split('T')[0],
          notes: null
        },
        {
          user_id: userId,
          name: 'After Workout',
          date: new Date('2024-01-16').toISOString().split('T')[0],
          notes: null
        }
      ])
      .execute();

    const input: GetWorkoutsByDateRangeInput = {
      user_id: userId,
      start_date: singleDate,
      end_date: singleDate
    };

    const result = await getWorkoutsByDateRange(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Target Workout');
    expect(result[0].date).toEqual(singleDate);
  });
});
