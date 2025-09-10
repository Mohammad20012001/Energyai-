"use server";

import { z } from "zod";
import { optimizeDesign } from "@/ai/flows/optimize-design";
import type { OptimizeDesignInput, OptimizeDesignOutput } from "@/ai/flows/optimize-design";

// This schema is a re-definition for server action validation.
const OptimizeDesignActionSchema = z.object({
  budget: z.coerce.number().positive("يجب أن تكون الميزانية إيجابية"),
  surfaceArea: z.coerce.number().positive("يجب أن تكون المساحة إيجابية"),
  monthlyBill: z.coerce.number().positive("يجب أن تكون الفاتورة إيجابية"),
  location: z.enum(['amman', 'zarqa', 'irbid', 'aqaba']),
});


export async function optimizeDesignAction(
  input: OptimizeDesignInput
): Promise<{ success: boolean; data?: OptimizeDesignOutput; error?: string }> {
  try {
    const validatedInput = OptimizeDesignActionSchema.parse(input);
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
