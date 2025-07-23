
import { serial, text, pgTable, timestamp, numeric, integer, boolean, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const exercisesTable = pgTable('exercises', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(), // e.g., "chest", "legs", "back"
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const workoutsTable = pgTable('workouts', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  name: text('name').notNull(),
  date: date('date').notNull(), // Date without time for scheduling
  notes: text('notes'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const workoutExercisesTable = pgTable('workout_exercises', {
  id: serial('id').primaryKey(),
  workout_id: integer('workout_id').notNull().references(() => workoutsTable.id, { onDelete: 'cascade' }),
  exercise_id: integer('exercise_id').notNull().references(() => exercisesTable.id),
  order_index: integer('order_index').notNull(), // Order of exercises in workout
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const setsTable = pgTable('sets', {
  id: serial('id').primaryKey(),
  workout_exercise_id: integer('workout_exercise_id').notNull().references(() => workoutExercisesTable.id, { onDelete: 'cascade' }),
  set_number: integer('set_number').notNull(), // 1st set, 2nd set, etc.
  reps: integer('reps').notNull(),
  weight: numeric('weight', { precision: 6, scale: 2 }).notNull(), // Weight in lbs/kg with precision
  completed: boolean('completed').notNull().default(false),
  notes: text('notes'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const goalsTable = pgTable('goals', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  exercise_id: integer('exercise_id').notNull().references(() => exercisesTable.id),
  target_weight: numeric('target_weight', { precision: 6, scale: 2 }).notNull(),
  target_reps: integer('target_reps').notNull(),
  target_date: date('target_date'), // Nullable target date
  achieved: boolean('achieved').notNull().default(false),
  achieved_date: date('achieved_date'), // Nullable until achieved
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const personalBestsTable = pgTable('personal_bests', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  exercise_id: integer('exercise_id').notNull().references(() => exercisesTable.id),
  weight: numeric('weight', { precision: 6, scale: 2 }).notNull(),
  reps: integer('reps').notNull(),
  date_achieved: date('date_achieved').notNull(),
  workout_id: integer('workout_id').notNull().references(() => workoutsTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  workouts: many(workoutsTable),
  goals: many(goalsTable),
  personalBests: many(personalBestsTable),
}));

export const exercisesRelations = relations(exercisesTable, ({ many }) => ({
  workoutExercises: many(workoutExercisesTable),
  goals: many(goalsTable),
  personalBests: many(personalBestsTable),
}));

export const workoutsRelations = relations(workoutsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [workoutsTable.user_id],
    references: [usersTable.id],
  }),
  workoutExercises: many(workoutExercisesTable),
  personalBests: many(personalBestsTable),
}));

export const workoutExercisesRelations = relations(workoutExercisesTable, ({ one, many }) => ({
  workout: one(workoutsTable, {
    fields: [workoutExercisesTable.workout_id],
    references: [workoutsTable.id],
  }),
  exercise: one(exercisesTable, {
    fields: [workoutExercisesTable.exercise_id],
    references: [exercisesTable.id],
  }),
  sets: many(setsTable),
}));

export const setsRelations = relations(setsTable, ({ one }) => ({
  workoutExercise: one(workoutExercisesTable, {
    fields: [setsTable.workout_exercise_id],
    references: [workoutExercisesTable.id],
  }),
}));

export const goalsRelations = relations(goalsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [goalsTable.user_id],
    references: [usersTable.id],
  }),
  exercise: one(exercisesTable, {
    fields: [goalsTable.exercise_id],
    references: [exercisesTable.id],
  }),
}));

export const personalBestsRelations = relations(personalBestsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [personalBestsTable.user_id],
    references: [usersTable.id],
  }),
  exercise: one(exercisesTable, {
    fields: [personalBestsTable.exercise_id],
    references: [exercisesTable.id],
  }),
  workout: one(workoutsTable, {
    fields: [personalBestsTable.workout_id],
    references: [workoutsTable.id],
  }),
}));

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  exercises: exercisesTable,
  workouts: workoutsTable,
  workoutExercises: workoutExercisesTable,
  sets: setsTable,
  goals: goalsTable,
  personalBests: personalBestsTable,
};
