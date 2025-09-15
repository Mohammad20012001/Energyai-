
'use server';

import {z} from 'zod';
import {
  suggestStringConfiguration,
} from '@/ai/flows/suggest-string-config';
import {SuggestStringConfigurationInputSchema} from '@/ai/tool-schemas';
import type {SuggestStringConfigurationInput} from '@/ai/tool-schemas';
import { FinancialViabilityInput, calculateFinancialViability } from '@/services/calculations';

const FinancialViabilityInputSchema = z.object({
  systemSize: z.coerce.number().positive("يجب أن يكون حجم النظام إيجابياً"),
  systemLoss: z.coerce.number().min(0, "لا يمكن أن يكون أقل من 0").max(99, "لا يمكن أن يكون أعلى من 99"),
  tilt: z.coerce.number().min(0).max(90),
  azimuth: z.coerce.number().min(0).max(360),
  location: z.enum(['amman', 'zarqa', 'irbid', 'aqaba'], { required_error: "الرجاء اختيار الموقع" }),
  costPerKw: z.coerce.number().positive("التكلفة يجب أن تكون إيجابية"),
  kwhPrice: z.coerce.number().positive("السعر يجب أن يكون إيجابياً"),
});

export async function suggestStringConfigurationAction(
  input: SuggestStringConfigurationInput
) {
  try {
    const validatedInput = SuggestStringConfigurationInputSchema.parse(input);
    const result = await suggestStringConfiguration(validatedInput);
    return {success: true, data: result};
  } catch (error) {
    console.error('Error in suggestStringConfigurationAction:', error);
    if (error instanceof z.ZodError) {
      return {success: false, error: 'المدخلات المقدمة غير صالحة.'};
    }
    return {
      success: false,
      error: 'فشل في الحصول على اقتراح من الذكاء الاصطناعي.',
    };
  }
}

export async function calculateFinancialViabilityAction(input: FinancialViabilityInput) {
    try {
        const validatedInput = FinancialViabilityInputSchema.parse(input);
        const result = await calculateFinancialViability(validatedInput);
        return { success: true, data: result };
    } catch (error) {
        console.error("Error in calculateFinancialViabilityAction:", error);
        if (error instanceof z.ZodError) {
            return { success: false, error: 'المدخلات المقدمة غير صالحة.' };
        }
        const errorMessage = error instanceof Error ? error.message : 'فشل في حساب الجدوى المالية.';
        return { success: false, error: errorMessage };
    }
}
