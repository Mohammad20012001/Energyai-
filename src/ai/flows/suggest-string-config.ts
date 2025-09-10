'use server';

/**
 * @fileOverview AI-powered string configuration suggestion for solar panel systems.
 *
 * - suggestStringConfiguration - A function to determine the optimal configuration of solar panels in strings and parallel strings.
 */

import {ai} from '@/ai/genkit';
import {
  SuggestStringConfigurationInputSchema,
  SuggestStringConfigurationOutputSchema,
  type SuggestStringConfigurationInput,
  type SuggestStringConfigurationOutput,
} from '@/ai/tool-schemas';

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
