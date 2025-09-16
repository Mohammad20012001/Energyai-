'use server';

/**
 * @fileOverview AI-powered string configuration suggestion for solar panel systems.
 * This is a hybrid model. It uses physics-based calculations for numerical accuracy
 * and an AI model for generating the human-readable analysis and common errors.
 *
 * - suggestStringConfiguration - A function to determine the optimal configuration of solar panels.
 */

import {ai} from '@/ai/genkit';
import { z } from 'zod';
import {
  SuggestStringConfigurationInputSchema,
  SuggestStringConfigurationOutputSchema,
  type SuggestStringConfigurationInput,
  type SuggestStringConfigurationOutput,
} from '@/ai/tool-schemas';
import { calculateStringConfiguration } from '@/services/calculations';

// This is the main exported function that will be called by the server action or other tools.
export async function suggestStringConfiguration(
  input: SuggestStringConfigurationInput
): Promise<SuggestStringConfigurationOutput> {
  return await suggestStringConfigurationFlow(input);
}


// 1. Define a new AI prompt that takes the calculated data and generates the reasoning.
const reasoningPrompt = ai.definePrompt({
  name: 'generateStringConfigReasoningPrompt',
  input: { schema: z.object({
    panelVoltage: z.number(),
    panelCurrent: z.number(),
    desiredVoltage: z.number(),
    desiredCurrent: z.number(),
    panelsPerString: z.number(),
    parallelStrings: z.number(),
  })},
  output: { schema: z.object({
    commonWiringErrors: SuggestStringConfigurationOutputSchema.shape.commonWiringErrors,
    reasoning: SuggestStringConfigurationOutputSchema.shape.reasoning,
  })},
  prompt: `أنت مهندس كهربائي خبير يقدم نصائح لمركب أنظمة شمسية. بناءً على الحسابات التالية، قدم شرحاً وأبرز الأخطاء الشائعة.

**المعطيات:**
- جهد اللوح: {{{panelVoltage}}} فولت
- تيار اللوح: {{{panelCurrent}}} أمبير
- الجهد المطلوب: {{{desiredVoltage}}} فولت
- التيار المطلوب: {{{desiredCurrent}}} أمبير

**النتائج المحسوبة:**
- عدد الألواح لكل سلسلة (توالي): {{{panelsPerString}}}
- عدد السلاسل المتوازية (توازي): {{{parallelStrings}}}

**مهمتك:**
1.  **اكتب الشرح (reasoning):** اشرح بوضوح لماذا تم اختيار هذا التكوين. وضح أن التوصيل على التوالي يزيد الجهد بينما التوصيل على التوازي يزيد التيار.
2.  **اكتب الأخطاء الشائعة (commonWiringErrors):** اذكر 2-3 أخطاء شائعة وحرجة تتعلق بتوصيل السلاسل، مثل عدم تطابق عدد الألواح في السلاسل المتوازية، أو استخدام أسلاك ذات مقاطع غير مناسبة، أو عكس القطبية.

الرد يجب أن يكون فقط كائن JSON يحتوي على 'reasoning' و 'commonWiringErrors' باللغة العربية.`,
});


// 2. Define the Genkit flow that orchestrates the calculation and AI reasoning.
const suggestStringConfigurationFlow = ai.defineFlow(
  {
    name: 'suggestStringConfigurationFlow',
    inputSchema: SuggestStringConfigurationInputSchema,
    outputSchema: SuggestStringConfigurationOutputSchema,
  },
  async (input) => {
    // Step 1: Get the definitive calculation from the physics-based service. This part is always reliable.
    const calculatedData = calculateStringConfiguration(input);

    try {
      // Step 2: Try to call the AI model with the input AND the calculated data to generate the reasoning.
      const { output: reasoningOutput } = await reasoningPrompt({
        ...input,
        ...calculatedData,
      });
      
      if (!reasoningOutput) {
          throw new Error("AI failed to generate reasoning and common errors.");
      }

      // Step 3 (Success Case): Combine the physics-based calculation with the AI-generated text.
      return {
        ...calculatedData,
        reasoning: reasoningOutput.reasoning,
        commonWiringErrors: reasoningOutput.commonWiringErrors,
      };

    } catch (error) {
      console.error("AI part of string configuration failed, returning calculation-only result.", error);

      // Step 3 (Fallback Case): If the AI call fails, return the accurate calculations with default text.
      // This makes the tool resilient and always useful.
      return {
        ...calculatedData,
        reasoning: `لتحقيق الجهد المطلوب (${input.desiredVoltage} فولت)، تحتاج إلى توصيل ${calculatedData.panelsPerString} لوحًا على التوالي. ولتحقيق التيار المطلوب (${input.desiredCurrent} أمبير)، تحتاج إلى ${calculatedData.parallelStrings} من هذه السلاسل على التوازي.`,
        commonWiringErrors: `- تأكد من أن جميع السلاسل المتوازية لها نفس عدد الألواح بالضبط.
- استخدم أسلاكًا ذات حجم مناسب للتعامل مع إجمالي التيار.
- تحقق دائمًا من القطبية (+/-) قبل التوصيل النهائي.`,
      };
    }
  }
);
