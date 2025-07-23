
import { db } from '../db';
import { workoutsTable, usersTable } from '../db/schema';
import { type CreateWorkoutInput, type Workout } from '../schema';
import { eq } from 'drizzle-orm';

export const createWorkout = async (input: CreateWorkoutInput): Promise<Workout> => {
  try {
    // Verify that the user exists to prevent foreign key constraint violation
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.user_id} does not exist`);
    }

    // Insert workout record
    const result = await db.insert(workoutsTable)
      .values({
        user_id: input.user_id,
        name: input.name,
        date: input.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string for date column
        notes: input.notes
      })
      .returning()
      .execute();

    // Convert date field back to Date object before returning
    const workout = result[0];
    return {
      ...workout,
      date: new Date(workout.date) // Convert string back to Date
    };
  } catch (error) {
    console.error('Workout creation failed:', error);
    throw error;
  }
};
