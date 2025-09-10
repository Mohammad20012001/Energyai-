'use server';

import {z} from 'zod';
import {
  simulatePerformance,
} from '@/ai/flows/simulate-performance';
import {
  SimulatePerformanceInputSchema,
  SimulatePerformanceOutputSchema,
  type SimulatePerformanceInput,
  type SimulatePerformanceOutput,
} from '@/ai/tool-schemas';


export async function startSimulationAction(
  input: SimulatePerformanceInput
): Promise<{success: boolean; data?: SimulatePerformanceOutput; error?: string}> {
  try {
    const validatedInput = SimulatePerformanceInputSchema.parse(input);
    // The flow now handles everything, including fetching weather and returning a complete object.
    const result = await simulatePerformance(validatedInput);

    return {success: true, data: result};
  } catch (error) {
    console.error('Error in startSimulationAction:', error);
    if (error instanceof z.ZodError) {
      return {success: false, error: 'المدخلات المقدمة غير صالحة.'};
    }
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'فشل في الحصول على بيانات المحاكاة.';
    return {success: false, error: errorMessage};
  }
}
