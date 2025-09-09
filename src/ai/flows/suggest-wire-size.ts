'use server';

/**
 * @fileOverview AI-powered wire size suggestion for solar panel systems.
 *
 * - suggestWireSize - A function to determine the optimal wire size based on system parameters.
 * - SuggestWireSizeInput - The input type for the suggestWireSize function.
 * - SuggestWireSizeOutput - The return type for the suggestWireSize function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const SuggestWireSizeInputSchema = z.object({
  current: z.number().describe('تيار النظام (أمبير).'),
  voltage: z.number().describe('جهد النظام (فولت).'),
  distance: z.number().describe('طول السلك بالمتر (اتجاه واحد).'),
  voltageDropPercentage: z
    .number()
    .describe('النسبة المئوية لهبوط الجهد المسموح به (%).'),
});
export type SuggestWireSizeInput = z.infer<typeof SuggestWireSizeInputSchema>;

export const SuggestWireSizeOutputSchema = z.object({
  recommendedWireSizeMM2: z
    .number()
    .describe('مقطع السلك الموصى به بوحدة mm²'),
  voltageDrop: z.number().describe('قيمة هبوط الجهد الفعلية بالفولت.'),
  powerLoss: z.number().describe('قيمة الطاقة المفقودة بالواط.'),
  reasoning: z
    .string()
    .describe(
      'شرح مفصل باللغة العربية عن سبب اختيار هذا المقطع، وأهمية اختيار الحجم الصحيح، والمخاطر المترتبة على استخدام مقطع أصغر.'
    ),
});
export type SuggestWireSizeOutput = z.infer<typeof SuggestWireSizeOutputSchema>;

export async function suggestWireSize(
  input: SuggestWireSizeInput
): Promise<SuggestWireSizeOutput> {
  return suggestWireSizeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestWireSizePrompt',
  input: {schema: SuggestWireSizeInputSchema},
  output: {schema: SuggestWireSizeOutputSchema},
  prompt: `أنت مهندس كهربائي خبير في تصميم أنظمة الطاقة الشمسية. بناءً على المدخلات التالية باللغة العربية، قم بحساب وتوصية مقطع السلك المناسب (mm²) للتيار المستمر (DC) بين الألواح والعاكس.

المعطيات:
- تيار النظام: {{{current}}} أمبير
- جهد النظام: {{{voltage}}} فولت
- المسافة (اتجاه واحد): {{{distance}}} متر
- نسبة هبوط الجهد المسموح بها: {{{voltageDropPercentage}}}%

المهام:
1.  احسب هبوط الجهد الأقصى المسموح به بالفولت.
2.  استخدم قانون حساب مقطع السلك للتيار المستمر:
    مقطع السلك (mm²) = (2 * ρ * L * I) / Vd_max
    حيث:
    - ρ (المقاومة النوعية للنحاس) = 0.0172 Ω·mm²/m
    - L = المسافة بالمتر ({{{distance}}})
    - I = التيار بالأمبير ({{{current}}})
    - Vd_max = أقصى هبوط جهد مسموح به بالفولت.
3.  قرّب مساحة المقطع الناتجة إلى أقرب حجم قياسي متوفر في السوق (e.g., 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50 mm²). اختر القيمة الأكبر أو المساوية للنتيجة المحسوبة.
4.  احسب هبوط الجهد الفعلي (Vd) باستخدام الحجم القياسي الذي اخترته.
5.  احسب الطاقة المفقودة (Power Loss) بالواط: P_loss = Vd * I.
6.  قدم شرحاً (reasoning) مفصلاً باللغة العربية يوضح أهمية اختيار الحجم الصحيح للسلك، والمخاطر المترتبة على استخدام سلك أصغر من الموصى به (مثل فقدان الطاقة، ارتفاع درجة الحرارة، وخطر الحريق)، ولماذا تم اختيار هذا الحجم συγκεκριμένα.

يجب أن يكون الرد كاملاً باللغة العربية.`,
});

const suggestWireSizeFlow = ai.defineFlow(
  {
    name: 'suggestWireSizeFlow',
    inputSchema: SuggestWireSizeInputSchema,
    outputSchema: SuggestWireSizeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
