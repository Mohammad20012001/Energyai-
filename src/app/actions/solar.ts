
'use server';

import {z} from 'zod';
import {
  suggestStringConfiguration,
} from '@/ai/flows/suggest-string-config';
import {SuggestStringConfigurationInputSchema, type SuggestStringConfigurationOutput} from '@/ai/tool-schemas';
import type {SuggestStringConfigurationInput} from '@/ai/tool-schemas';
import { calculateFinancialViability, type FinancialViabilityInput, type FinancialViabilityResult } from '@/services/calculations';

export async function suggestStringConfigurationAction(
  input: SuggestStringConfigurationInput
): Promise<{ success: boolean, data?: SuggestStringConfigurationOutput, error?: string }> {
  try {
    const validatedInput = SuggestStringConfigurationInputSchema.parse(input);
    const result = await suggestStringConfiguration(validatedInput);
    return {success: true, data: result};
  } catch (error) {
    console.error('Error in suggestStringConfigurationAction:', error);
    if (error instanceof z.ZodError) {
      return {success: false, error: 'المدخلات المقدمة غير صالحة.'};
    }
     const errorMessage =
      error instanceof Error
        ? error.message
        : 'فشل في الحصول على اقتراح من الذكاء الاصطناعي.';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

const FinancialViabilityInputSchema = z.object({
  systemSize: z.coerce.number().positive("يجب أن يكون حجم النظام إيجابياً"),
  systemLoss: z.coerce.number().min(0, "لا يمكن أن يكون أقل من 0").max(99, "لا يمكن أن يكون أعلى من 99"),
  tilt: z.coerce.number().min(0).max(90),
  azimuth: z.coerce.number().min(0).max(360),
  location: z.enum(['amman', 'zarqa', 'irbid', 'aqaba'], { required_error: "الرجاء اختيار الموقع" }),
  costPerKw: z.coerce.number().positive("التكلفة يجب أن تكون إيجابية"),
  kwhPrice: z.coerce.number().positive("السعر يجب أن يكون إيجابياً"),
  degradationRate: z.coerce.number().min(0, "لا يمكن أن يكون سالباً").max(5, "النسبة مرتفعة جداً"),
});


export async function calculateFinancialViabilityAction(
    input: FinancialViabilityInput
): Promise<{ success: boolean, data?: FinancialViabilityResult, error?: string }> {
    try {
        const validatedInput = FinancialViabilityInputSchema.parse(input);
        // The core calculation is now purely deterministic and lives in the services layer.
        const result = calculateFinancialViability(validatedInput);
        return { success: true, data: result };
    } catch (error) {
        console.error("Error in calculateFinancialViabilityAction: ", error);
        if (error instanceof z.ZodError) {
            return { success: false, error: "المدخلات المقدمة غير صالحة." };
        }
        const errorMessage = error instanceof Error ? error.message : "فشل في إجراء الحسابات.";
        return { success: false, error: errorMessage };
    }
}
