
import { db } from '../db';
import { setsTable } from '../db/schema';
import { type UpdateSetInput, type Set } from '../schema';
import { eq } from 'drizzle-orm';

export const updateSet = async (input: UpdateSetInput): Promise<Set> => {
  try {
    // Build update values object only with provided fields
    const updateValues: Partial<typeof setsTable.$inferInsert> = {};
    
    if (input.reps !== undefined) {
      updateValues.reps = input.reps;
    }
    
    if (input.weight !== undefined) {
      updateValues.weight = input.weight.toString(); // Convert number to string for numeric column
    }
    
    if (input.completed !== undefined) {
      updateValues.completed = input.completed;
    }
    
    if (input.notes !== undefined) {
      updateValues.notes = input.notes;
    }

    // Update the set record
    const result = await db.update(setsTable)
      .set(updateValues)
      .where(eq(setsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Set with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const set = result[0];
    return {
      ...set,
      weight: parseFloat(set.weight) // Convert string back to number
    };
  } catch (error) {
    console.error('Set update failed:', error);
    throw error;
  }
};
