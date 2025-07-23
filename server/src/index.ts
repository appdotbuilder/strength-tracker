
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  createExerciseInputSchema,
  createWorkoutInputSchema,
  createWorkoutExerciseInputSchema,
  createSetInputSchema,
  updateSetInputSchema,
  createGoalInputSchema,
  getWorkoutsByDateRangeInputSchema,
  getPersonalBestsInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { createExercise } from './handlers/create_exercise';
import { getExercises } from './handlers/get_exercises';
import { createWorkout } from './handlers/create_workout';
import { addExerciseToWorkout } from './handlers/add_exercise_to_workout';
import { createSet } from './handlers/create_set';
import { updateSet } from './handlers/update_set';
import { createGoal } from './handlers/create_goal';
import { getWorkoutsByDateRange } from './handlers/get_workouts_by_date_range';
import { getWorkoutDetails } from './handlers/get_workout_details';
import { getPersonalBests } from './handlers/get_personal_bests';
import { getUserGoals } from './handlers/get_user_goals';
import { updatePersonalBests } from './handlers/update_personal_bests';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  // Exercise management
  createExercise: publicProcedure
    .input(createExerciseInputSchema)
    .mutation(({ input }) => createExercise(input)),

  getExercises: publicProcedure
    .query(() => getExercises()),

  // Workout management
  createWorkout: publicProcedure
    .input(createWorkoutInputSchema)
    .mutation(({ input }) => createWorkout(input)),

  addExerciseToWorkout: publicProcedure
    .input(createWorkoutExerciseInputSchema)
    .mutation(({ input }) => addExerciseToWorkout(input)),

  getWorkoutsByDateRange: publicProcedure
    .input(getWorkoutsByDateRangeInputSchema)
    .query(({ input }) => getWorkoutsByDateRange(input)),

  getWorkoutDetails: publicProcedure
    .input(z.number())
    .query(({ input }) => getWorkoutDetails(input)),

  // Set management
  createSet: publicProcedure
    .input(createSetInputSchema)
    .mutation(({ input }) => createSet(input)),

  updateSet: publicProcedure
    .input(updateSetInputSchema)
    .mutation(({ input }) => updateSet(input)),

  // Goal management
  createGoal: publicProcedure
    .input(createGoalInputSchema)
    .mutation(({ input }) => createGoal(input)),

  getUserGoals: publicProcedure
    .input(z.number())
    .query(({ input }) => getUserGoals(input)),

  // Personal bests and progress tracking
  getPersonalBests: publicProcedure
    .input(getPersonalBestsInputSchema)
    .query(({ input }) => getPersonalBests(input)),

  updatePersonalBests: publicProcedure
    .input(updateSetInputSchema)
    .mutation(async ({ input }) => {
      // This would typically be called after updating a set to check for new personal bests
      const updatedSet = await updateSet(input);
      if (updatedSet.completed) {
        await updatePersonalBests(updatedSet);
      }
      return updatedSet;
    }),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
