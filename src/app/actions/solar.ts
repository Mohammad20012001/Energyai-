"use server";

import { z } from "zod";
import {
  suggestStringConfiguration,
  type SuggestStringConfigurationInput,
} from "@/ai/flows/suggest-string-config";

const SuggestionSchema = z.object({
  panelVoltage: z.number(),
  panelCurrent: z.number(),
  desiredVoltage: z.number(),
  desiredCurrent: z.number(),
});

export async function suggestStringConfigurationAction(
  input: SuggestStringConfigurationInput
) {
  try {
    const validatedInput = SuggestionSchema.parse(input);
    const result = await suggestStringConfiguration(validatedInput);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in suggestStringConfigurationAction:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid input provided." };
    }
    return { success: false, error: "Failed to get suggestion from AI." };
  }
}
