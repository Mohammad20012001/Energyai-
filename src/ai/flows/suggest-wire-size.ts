'use server';

/**
 * @fileOverview AI-powered wire size suggestion for solar panel systems. This is a hybrid model.
 * It uses a physics-based calculation service for numerical accuracy and an AI model for reasoning.
 *
 * - suggestWireSize - A function to determine the optimal wire size based on system parameters.
 */

import {ai} from '@/ai/genkit';
import {
  SuggestWireSizeInputSchema,
  SuggestWireSizeOutputSchema,
  type SuggestWireSizeInput,
  type SuggestWireSizeOutput,
} from '@/ai/tool-schemas';
import { calculateWireSize } from '@/services/calculations';


export async function suggestWireSize(
  input: SuggestWireSizeInput
): Promise<SuggestWireSizeOutput> {
  return suggestWireSizeFlow(input);
}

// 1. Get the accurate, physics-based calculation result first.
const physicsResult = calculateWireSize(input);

// 2. Define a prompt that takes the accurate data and generates only the reasoning.
const reasoningPrompt = ai.definePrompt({
  name: 'generateWireSizeReasoningPrompt',
  input: { schema: z.object({
    ...SuggestWireSizeInputSchema.shape,
    ...SuggestWireSizeOutputSchema.omit({ reasoning: true }).shape,
  })},
  output: { schema: z.object({
    reasoning: SuggestWireSizeOutputSchema.shape.reasoning,
  })},
  prompt: `أنت مهندس كهربائي خبير في تصميم أنظمة الطاقة الشمسية. لقد قمنا بإجراء الحسابات التالية لتحديد حجم السلك:

المعطيات:
- تيار النظام: {{{current}}} أمبير
- جهد النظام: {{{voltage}}} فولت
- المسافة (اتجاه واحد): {{{distance}}} متر
- نسبة هبوط الجهد المسموح بها: {{{voltageDropPercentage}}}%

النتائج المحسوبة:
- مقطع السلك الموصى به: {{{recommendedWireSizeMM2}}} مم²
- هبوط الجهد الفعلي: {{{voltageDrop}}} فولت
- الطاقة المفقودة: {{{powerLoss}}} واط

مهمتك هي كتابة شرح (reasoning) مفصل باللغة العربية. يجب أن يوضح هذا الشرح أهمية اختيار الحجم الصحيح للسلك، والمخاطر المترتبة على استخدام سلك أصغر من الموصى به (مثل فقدان الطاقة، ارتفاع درجة الحرارة، وخطر الحريق)، ولماذا تم اختيار هذا الحجم على وجه الخصوص بناءً على النتائج.

الرد يجب أن يكون فقط نص الشرح باللغة العربية.`,
});


const suggestWireSizeFlow = ai.defineFlow(
  {
    name: 'suggestWireSizeFlow',
    inputSchema: SuggestWireSizeInputSchema,
    outputSchema: SuggestWireSizeOutputSchema,
  },
  async (input) => {
    // Step 1: Get the definitive calculation from the physics-based service.
    const calculatedData = calculateWireSize(input);

    // Step 2: Call the AI model with the input AND the calculated data to generate the reasoning.
    const { output: reasoningOutput } = await reasoningPrompt({
      ...input,
      ...calculatedData,
    });
    
    if (!reasoningOutput) {
        throw new Error("AI failed to generate reasoning.");
    }

    // Step 3: Combine the physics-based calculation with the AI-generated reasoning.
    return {
      ...calculatedData,
      reasoning: reasoningOutput.reasoning,
    };
  }
);
