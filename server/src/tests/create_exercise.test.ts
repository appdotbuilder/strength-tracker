
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { exercisesTable } from '../db/schema';
import { type CreateExerciseInput } from '../schema';
import { createExercise } from '../handlers/create_exercise';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateExerciseInput = {
  name: 'Bench Press',
  category: 'chest',
  description: 'Upper body pushing exercise targeting chest muscles'
};

// Test input with null description
const testInputNullDescription: CreateExerciseInput = {
  name: 'Squat',
  category: 'legs',
  description: null
};

describe('createExercise', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an exercise with description', async () => {
    const result = await createExercise(testInput);

    // Basic field validation
    expect(result.name).toEqual('Bench Press');
    expect(result.category).toEqual('chest');
    expect(result.description).toEqual('Upper body pushing exercise targeting chest muscles');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an exercise with null description', async () => {
    const result = await createExercise(testInputNullDescription);

    // Basic field validation
    expect(result.name).toEqual('Squat');
    expect(result.category).toEqual('legs');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save exercise to database', async () => {
    const result = await createExercise(testInput);

    // Query using proper drizzle syntax
    const exercises = await db.select()
      .from(exercisesTable)
      .where(eq(exercisesTable.id, result.id))
      .execute();

    expect(exercises).toHaveLength(1);
    expect(exercises[0].name).toEqual('Bench Press');
    expect(exercises[0].category).toEqual('chest');
    expect(exercises[0].description).toEqual('Upper body pushing exercise targeting chest muscles');
    expect(exercises[0].created_at).toBeInstanceOf(Date);
  });

  it('should save exercise with null description to database', async () => {
    const result = await createExercise(testInputNullDescription);

    // Query using proper drizzle syntax
    const exercises = await db.select()
      .from(exercisesTable)
      .where(eq(exercisesTable.id, result.id))
      .execute();

    expect(exercises).toHaveLength(1);
    expect(exercises[0].name).toEqual('Squat');
    expect(exercises[0].category).toEqual('legs');
    expect(exercises[0].description).toBeNull();
    expect(exercises[0].created_at).toBeInstanceOf(Date);
  });
});
