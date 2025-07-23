
import { db } from '../db';
import { personalBestsTable, workoutExercisesTable, workoutsTable } from '../db/schema';
import { type Set } from '../schema';
import { eq, and, desc } from 'drizzle-orm';

export async function updatePersonalBests(completedSet: Set): Promise<void> {
  try {
    // Only process completed sets
    if (!completedSet.completed) {
      return;
    }

    // Get workout exercise details to find exercise_id and workout_id
    const workoutExerciseDetails = await db.select({
      workout_id: workoutExercisesTable.workout_id,
      exercise_id: workoutExercisesTable.exercise_id
    })
    .from(workoutExercisesTable)
    .where(eq(workoutExercisesTable.id, completedSet.workout_exercise_id))
    .execute();

    if (workoutExerciseDetails.length === 0) {
      return;
    }

    const { workout_id, exercise_id } = workoutExerciseDetails[0];

    // Get user_id from workout
    const workoutData = await db.select({
      user_id: workoutsTable.user_id,
      date: workoutsTable.date
    })
    .from(workoutsTable)
    .where(eq(workoutsTable.id, workout_id))
    .execute();

    if (workoutData.length === 0) {
      return;
    }

    const { user_id, date: workoutDate } = workoutData[0];

    // Get current personal best for this user and exercise
    const existingPB = await db.select()
    .from(personalBestsTable)
    .where(
      and(
        eq(personalBestsTable.user_id, user_id),
        eq(personalBestsTable.exercise_id, exercise_id)
      )
    )
    .orderBy(desc(personalBestsTable.weight), desc(personalBestsTable.reps))
    .limit(1)
    .execute();

    const setWeight = parseFloat(completedSet.weight.toString());
    
    // Check if this set is a new personal best
    let isNewPB = false;
    
    if (existingPB.length === 0) {
      // No existing PB, this is the first one
      isNewPB = true;
    } else {
      const currentPB = existingPB[0];
      const currentPBWeight = parseFloat(currentPB.weight);
      
      // New PB if: higher weight, or same weight with more reps
      if (setWeight > currentPBWeight || 
          (setWeight === currentPBWeight && completedSet.reps > currentPB.reps)) {
        isNewPB = true;
      }
    }

    // If it's a new personal best, record it
    if (isNewPB) {
      await db.insert(personalBestsTable)
      .values({
        user_id: user_id,
        exercise_id: exercise_id,
        weight: setWeight.toString(), // Convert to string for numeric column
        reps: completedSet.reps,
        date_achieved: workoutDate, // This is already a string from the date column
        workout_id: workout_id
      })
      .execute();
    }
  } catch (error) {
    console.error('Failed to update personal bests:', error);
    throw error;
  }
}
