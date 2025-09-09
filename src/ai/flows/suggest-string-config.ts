'use server';

/**
 * @fileOverview AI-powered string configuration suggestion for solar panel systems.
 *
 * - suggestStringConfiguration - A function to determine the optimal configuration of solar panels in strings and parallel strings.
 * - SuggestStringConfigurationInput - The input type for the suggestStringConfiguration function.
 * - SuggestStringConfigurationOutput - The return type for the suggestStringConfiguration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const SuggestStringConfigurationInputSchema = z.object({
  panelVoltage: z.number().describe('جهد اللوح الشمسي الواحد (فولت).'),
  panelCurrent: z.number().describe('تيار اللوح الشمسي الواحد (أمبير).'),
  desiredVoltage: z.number().describe('الجهد الإجمالي المطلوب للنظام (فولت).'),
  desiredCurrent: z.number().describe('التيار الإجمالي المطلوب للنظام (أمبير).'),
});
export type SuggestStringConfigurationInput = z.infer<
  typeof SuggestStringConfigurationInputSchema
>;

export const SuggestStringConfigurationOutputSchema = z.object({
  panelsPerString: z
    .number()
    .describe('العدد الموصى به من الألواح لتوصيلها على التوالي لكل سلسلة.'),
  parallelStrings: z
    .number()
    .describe('العدد الموصى به من السلاسل المتوازية للتوصيل.'),
  commonWiringErrors: z
    .string()
    .describe(
      'أخطاء التوصيل الشائعة التي يجب تجنبها، بناءً على التهيئة المقترحة.'
    ),
});
export type SuggestStringConfigurationOutput = z.infer<
  typeof SuggestStringConfigurationOutputSchema
>;

export async function suggestStringConfiguration(
  input: SuggestStringConfigurationInput
): Promise<SuggestStringConfigurationOutput> {
  return suggestStringConfigurationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestStringConfigurationPrompt',
  input: {schema: SuggestStringConfigurationInputSchema},
  output: {schema: SuggestStringConfigurationOutputSchema},
  prompt: `You are an expert solar panel installer. Given the following system requirements in Arabic, determine the optimal configuration of panels in strings and parallel strings to maximize efficiency and safety. Your response should also be in Arabic.

جهد اللوح: {{{panelVoltage}}} فولت
تيار اللوح: {{{panelCurrent}}} أمبير
الجهد المطلوب: {{{desiredVoltage}}} فولت
التيار المطلوب: {{{desiredCurrent}}} أمبير

ضع في اعتبارك أخطاء التوصيل الشائعة التي يرتكبها القائمون على التركيب وقم بتضمينها في الرد.

قدم عدد الألواح لكل سلسلة، وعدد السلاسل المتوازية، وأخطاء التوصيل الشائعة التي يجب تجنبها بناءً على متطلبات النظام المقدمة.
`,
});

const suggestStringConfigurationFlow = ai.defineFlow(
  {
    name: 'suggestStringConfigurationFlow',
    inputSchema: SuggestStringConfigurationInputSchema,
    outputSchema: SuggestStringConfigurationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
