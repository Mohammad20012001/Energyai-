"use server";

import { z } from "zod";
import {
  suggestStringConfiguration,
  SuggestStringConfigurationInputSchema,
} from "@/ai/flows/suggest-string-config";
import type { SuggestStringConfigurationInput } from "@/ai/flows/suggest-string-config";


export async function suggestStringConfigurationAction(
  input: SuggestStringConfigurationInput
) {
  try {
    const validatedInput = SuggestStringConfigurationInputSchema.parse(input);
    const result = await suggestStringConfiguration(validatedInput);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in suggestStringConfigurationAction:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "المدخلات المقدمة غير صالحة." };
    }
    return { success: false, error: "فشل في الحصول على اقتراح من الذكاء الاصطناعي." };
  }
}