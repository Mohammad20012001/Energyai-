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

const SuggestStringConfigurationInputSchema = z.object({
  panelVoltage: z.number().describe('Voltage of a single solar panel (V).'),
  panelCurrent: z.number().describe('Current of a single solar panel (A).'),
  desiredVoltage: z.number().describe('Desired total voltage for the system (V).'),
  desiredCurrent: z.number().describe('Desired total current for the system (A).'),
});
export type SuggestStringConfigurationInput = z.infer<
  typeof SuggestStringConfigurationInputSchema
>;

const SuggestStringConfigurationOutputSchema = z.object({
  panelsPerString: z
    .number()
    .describe('Recommended number of panels to connect in series per string.'),
  parallelStrings: z
    .number()
    .describe('Recommended number of parallel strings to connect.'),
  commonWiringErrors: z
    .string()
    .describe(
      'Common wiring errors to avoid, based on the suggested configuration.'
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
  prompt: `You are an expert solar panel installer. Given the following system requirements, determine the optimal configuration of panels in strings and parallel strings to maximize efficiency and safety.

Panel Voltage: {{{panelVoltage}}} V
Panel Current: {{{panelCurrent}}} A
Desired Voltage: {{{desiredVoltage}}} V
Desired Current: {{{desiredCurrent}}} A

Consider common wiring errors that installers make and include these in the response.

Provide the number of panels per string, number of parallel strings, and common wiring errors to avoid based on the provided system requirements.
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
