
import { db } from '../db';
import { workoutsTable } from '../db/schema';
import { type GetWorkoutsByDateRangeInput, type Workout } from '../schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export const getWorkoutsByDateRange = async (input: GetWorkoutsByDateRangeInput): Promise<Workout[]> => {
  try {
    // Convert dates to ISO date strings for comparison with date column
    const startDateStr = input.start_date.toISOString().split('T')[0];
    const endDateStr = input.end_date.toISOString().split('T')[0];

    const results = await db.select()
      .from(workoutsTable)
      .where(and(
        eq(workoutsTable.user_id, input.user_id),
        gte(workoutsTable.date, startDateStr),
        lte(workoutsTable.date, endDateStr)
      ))
      .orderBy(workoutsTable.date)
      .execute();

    // Convert date strings back to Date objects
    return results.map(workout => ({
      ...workout,
      date: new Date(workout.date)
    }));
  } catch (error) {
    console.error('Failed to get workouts by date range:', error);
    throw error;
  }
};
