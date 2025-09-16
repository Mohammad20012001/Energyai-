

'use server';

/**
 * @fileOverview Inverter-centric string configuration suggestion for solar panel systems.
 * This is a hybrid model. It uses physics-based calculations for numerical accuracy
 * and an AI model for generating the human-readable analysis.
 *
 * - suggestStringConfiguration - A function to determine the optimal configuration of solar panels based on inverter specs.
 */

import {ai} from '@/ai/genkit';
import { z } from 'zod';
import {
  SuggestStringConfigurationInputSchema,
  SuggestStringConfigurationOutputSchema,
  type SuggestStringConfigurationInput,
  type SuggestStringConfigurationOutput,
} from '@/ai/tool-schemas';
import { calculateAdvancedStringConfiguration } from '@/services/calculations';

// This is the main exported function that will be called by the server action or other tools.
export async function suggestStringConfiguration(
  input: SuggestStringConfigurationInput
): Promise<SuggestStringConfigurationOutput> {
  return await suggestStringConfigurationFlow(input);
}


// 1. Define a new AI prompt that takes the calculated data and generates the reasoning.
const reasoningPrompt = ai.definePrompt({
  name: 'generateAdvancedStringConfigReasoningPrompt',
  input: { schema: z.object({
    ...SuggestStringConfigurationInputSchema.shape,
    ...SuggestStringConfigurationOutputSchema.omit({ reasoning: true, arrayConfig: true }).shape,
    arrayConfig: SuggestStringConfigurationOutputSchema.shape.arrayConfig.omit({ isCurrentSafe: true }),
  })},
  output: { schema: z.object({
    reasoning: SuggestStringConfigurationOutputSchema.shape.reasoning,
  })},
  prompt: `You are an expert solar engineer explaining a string configuration analysis to a client in Arabic.

**System Parameters:**
- Inverter MPPT Voltage Range: {{{mpptMin}}}V - {{{mpptMax}}}V
- Inverter Max Input Voltage: {{{inverterMaxVolt}}}V
- Panel Voc: {{{voc}}}V
- Panel Vmp: {{{vmp}}}V
- Temperature Coefficient: {{{tempCoefficient}}}%/°C
- Site Temperature Range: {{{minTemp}}}°C to {{{maxTemp}}}°C

**Calculation Results:**
- Maximum Panels for Safety: {{{maxPanels}}}
- Minimum Panels for Performance: {{{minPanels}}}
- Recommended Optimal Panels: {{{optimalPanels}}}
- Voltage at Coldest Temp (with {{{maxPanels}}} panels): {{{maxStringVocAtMinTemp}}}V
- Voltage at Hottest Temp (with {{{minPanels}}} panels): {{{minStringVmpAtMaxTemp}}}V

**Your Task:**
Write the 'reasoning' text in Arabic. Explain step-by-step **why** this specific range ({{{minPanels}}}-{{{maxPanels}}} panels) was determined for the string length.

1.  **Start with the safety limit (Max Panels):** Explain that at {{{minTemp}}}°C, the voltage of each panel increases. To avoid exceeding the inverter's absolute maximum voltage of {{{inverterMaxVolt}}}V, the string cannot have more than {{{maxPanels}}} panels. Mention the calculated maximum voltage of {{{maxStringVocAtMinTemp}}}V.
2.  **Explain the performance limit (Min Panels):** Explain that at {{{maxTemp}}}°C, the voltage of each panel decreases. To ensure the string voltage stays within the inverter's MPPT range (above {{{mpptMin}}}V), the string must have at least {{{minPanels}}} panels. Mention the calculated minimum voltage of {{{minStringVmpAtMaxTemp}}}V.
3.  **Justify the recommendation (Optimal Panels):** Explain why {{{optimalPanels}}} panels is the recommended number (e.g., it balances safety margins and keeps the operating voltage (Vmp) well within the MPPT range for most of the year, maximizing energy harvest).

The response must be ONLY the reasoning text in Arabic.
`,
});


// 2. Define the Genkit flow that orchestrates the calculation and AI reasoning.
const suggestStringConfigurationFlow = ai.defineFlow(
  {
    name: 'suggestStringConfigurationFlow',
    inputSchema: SuggestStringConfigurationInputSchema,
    outputSchema: SuggestStringConfigurationOutputSchema,
  },
  async (input) => {
    // Step 1: Get the definitive calculation from the physics-based service.
    const calculatedData = calculateAdvancedStringConfiguration(input);

    // Step 1.5: Perform the current safety check.
    const isCurrentSafe = calculatedData.arrayConfig.totalCurrent <= input.inverterMaxCurrent;

    try {
      // Step 2: Try to call the AI model with the input AND the calculated data to generate the reasoning.
      const { output: reasoningOutput } = await reasoningPrompt({
        ...input,
        ...calculatedData,
      });
      
      if (!reasoningOutput) {
          throw new Error("AI failed to generate reasoning.");
      }

      // Step 3 (Success Case): Combine the physics-based calculation with the AI-generated text.
      return {
        ...calculatedData,
        arrayConfig: {
            ...calculatedData.arrayConfig,
            isCurrentSafe,
        },
        reasoning: reasoningOutput.reasoning,
      };

    } catch (error) {
      console.error("AI part of string configuration failed, returning calculation-only result.", error);

      // Step 3 (Fallback Case): If the AI call fails, return the accurate calculations with default text.
      return {
        ...calculatedData,
        arrayConfig: {
            ...calculatedData.arrayConfig,
            isCurrentSafe,
        },
        reasoning: `تم تحديد المدى الآمن لعدد الألواح بين ${calculatedData.minPanels} و ${calculatedData.maxPanels} لوحًا. يضمن هذا النطاق أن جهد السلسلة لن يتجاوز الحد الأقصى للعاكس في الطقس البارد، وسيبقى ضمن نطاق تشغيل MPPT في الطقس الحار. العدد الموصى به هو ${calculatedData.optimalPanels} لتحقيق أفضل أداء.`,
      };
    }
  }
);
