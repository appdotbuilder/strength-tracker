
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Exercise schema - represents exercise types (e.g., "Bench Press", "Squat")
export const exerciseSchema = z.object({
  id: z.number(),
  name: z.string(),
  category: z.string(), // e.g., "chest", "legs", "back"
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Exercise = z.infer<typeof exerciseSchema>;

// Workout schema
export const workoutSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  date: z.coerce.date(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Workout = z.infer<typeof workoutSchema>;

// Workout exercise schema - links exercises to workouts
export const workoutExerciseSchema = z.object({
  id: z.number(),
  workout_id: z.number(),
  exercise_id: z.number(),
  order_index: z.number().int(),
  created_at: z.coerce.date()
});

export type WorkoutExercise = z.infer<typeof workoutExerciseSchema>;

// Set schema - individual sets within workout exercises
export const setSchema = z.object({
  id: z.number(),
  workout_exercise_id: z.number(),
  set_number: z.number().int(),
  reps: z.number().int(),
  weight: z.number(),
  completed: z.boolean(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Set = z.infer<typeof setSchema>;

// Goal schema - lifting goals for specific exercises
export const goalSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  exercise_id: z.number(),
  target_weight: z.number(),
  target_reps: z.number().int(),
  target_date: z.coerce.date().nullable(),
  achieved: z.boolean(),
  achieved_date: z.coerce.date().nullable(),
  created_at: z.coerce.date()
});

export type Goal = z.infer<typeof goalSchema>;

// Personal best schema
export const personalBestSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  exercise_id: z.number(),
  weight: z.number(),
  reps: z.number().int(),
  date_achieved: z.coerce.date(),
  workout_id: z.number(),
  created_at: z.coerce.date()
});

export type PersonalBest = z.infer<typeof personalBestSchema>;

// Input schemas for creating/updating records
export const createUserInputSchema = z.object({
  name: z.string(),
  email: z.string().email()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createExerciseInputSchema = z.object({
  name: z.string(),
  category: z.string(),
  description: z.string().nullable()
});

export type CreateExerciseInput = z.infer<typeof createExerciseInputSchema>;

export const createWorkoutInputSchema = z.object({
  user_id: z.number(),
  name: z.string(),
  date: z.coerce.date(),
  notes: z.string().nullable()
});

export type CreateWorkoutInput = z.infer<typeof createWorkoutInputSchema>;

export const createWorkoutExerciseInputSchema = z.object({
  workout_id: z.number(),
  exercise_id: z.number(),
  order_index: z.number().int()
});

export type CreateWorkoutExerciseInput = z.infer<typeof createWorkoutExerciseInputSchema>;

export const createSetInputSchema = z.object({
  workout_exercise_id: z.number(),
  set_number: z.number().int(),
  reps: z.number().int().nonnegative(),
  weight: z.number().nonnegative(),
  completed: z.boolean(),
  notes: z.string().nullable()
});

export type CreateSetInput = z.infer<typeof createSetInputSchema>;

export const createGoalInputSchema = z.object({
  user_id: z.number(),
  exercise_id: z.number(),
  target_weight: z.number().positive(),
  target_reps: z.number().int().positive(),
  target_date: z.coerce.date().nullable()
});

export type CreateGoalInput = z.infer<typeof createGoalInputSchema>;

export const updateSetInputSchema = z.object({
  id: z.number(),
  reps: z.number().int().nonnegative().optional(),
  weight: z.number().nonnegative().optional(),
  completed: z.boolean().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateSetInput = z.infer<typeof updateSetInputSchema>;

// Query schemas
export const getWorkoutsByDateRangeInputSchema = z.object({
  user_id: z.number(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date()
});

export type GetWorkoutsByDateRangeInput = z.infer<typeof getWorkoutsByDateRangeInputSchema>;

export const getPersonalBestsInputSchema = z.object({
  user_id: z.number(),
  exercise_id: z.number().optional()
});

export type GetPersonalBestsInput = z.infer<typeof getPersonalBestsInputSchema>;
