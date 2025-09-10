"use server";

import { z } from "zod";
import {
  simulatePerformance,
} from "@/ai/flows/simulate-performance";
import { SimulatePerformanceInputSchema, type SimulatePerformanceInput } from "@/ai/types";

export async function startSimulationAction(
  input: SimulatePerformanceInput
) {
  try {
    const validatedInput = SimulatePerformanceInputSchema.parse(input);
    const result = await simulatePerformance(validatedInput);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in startSimulationAction:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "المدخلات المقدمة غير صالحة." };
    }
    return { success: false, error: "فشل في الحصول على بيانات المحاكاة." };
  }
}
