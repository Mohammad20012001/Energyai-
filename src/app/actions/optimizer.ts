"use server";

import { z } from "zod";
import { optimizeDesign } from "@/ai/flows/optimize-design";
import type { OptimizeDesignInput } from "@/ai/tool-schemas";
import { OptimizeDesignInputSchema, type OptimizeDesignOutput } from "@/ai/tool-schemas";


export async function optimizeDesignAction(
  input: OptimizeDesignInput
): Promise<{ success: boolean; data?: OptimizeDesignOutput; error?: string }> {
  try {
    // Note: The schema from tool-schemas is reused here for validation.
    const validatedInput = OptimizeDesignInputSchema.parse(input);
    const result = await optimizeDesign(validatedInput);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in optimizeDesignAction:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "المدخلات المقدمة غير صالحة." };
    }
    // Check if error is an object and has a message property
    const errorMessage = (error instanceof Error) ? error.message : "فشل في الحصول على اقتراح التصميم من الذكاء الاصطناعي.";
    return { success: false, error: errorMessage };
  }
}
