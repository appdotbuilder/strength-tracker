
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { exercisesTable } from '../db/schema';
import { getExercises } from '../handlers/get_exercises';

describe('getExercises', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no exercises exist', async () => {
    const result = await getExercises();

    expect(result).toEqual([]);
  });

  it('should return all exercises', async () => {
    // Create test data
    await db.insert(exercisesTable).values([
      {
        name: 'Bench Press',
        category: 'chest',
        description: 'Chest exercise'
      },
      {
        name: 'Squat',
        category: 'legs',
        description: 'Leg exercise'
      },
      {
        name: 'Deadlift',
        category: 'back',
        description: null
      }
    ]).execute();

    const result = await getExercises();

    expect(result).toHaveLength(3);
    
    // Verify structure of returned exercises
    const benchPress = result.find(ex => ex.name === 'Bench Press');
    expect(benchPress).toBeDefined();
    expect(benchPress!.category).toEqual('chest');
    expect(benchPress!.description).toEqual('Chest exercise');
    expect(benchPress!.id).toBeDefined();
    expect(benchPress!.created_at).toBeInstanceOf(Date);

    const deadlift = result.find(ex => ex.name === 'Deadlift');
    expect(deadlift).toBeDefined();
    expect(deadlift!.description).toBeNull();
  });

  it('should return exercises in consistent order', async () => {
    // Create test data
    await db.insert(exercisesTable).values([
      { name: 'Exercise C', category: 'chest', description: 'Description C' },
      { name: 'Exercise A', category: 'legs', description: 'Description A' },
      { name: 'Exercise B', category: 'back', description: 'Description B' }
    ]).execute();

    const result1 = await getExercises();
    const result2 = await getExercises();

    // Results should be in same order both times
    expect(result1.map(ex => ex.name)).toEqual(result2.map(ex => ex.name));
    expect(result1).toHaveLength(3);
    expect(result2).toHaveLength(3);
  });
});
