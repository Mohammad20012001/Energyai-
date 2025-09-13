'use server';

/**
 * @fileOverview Solar system design optimization AI agent.
 * This file defines a Genkit flow that acts as an expert solar engineer.
 * It now uses a hybrid approach:
 * 1. It calls a deterministic calculation service to get all the accurate numbers.
 * 2. It then passes these numbers to an AI model to generate the human-readable reasoning.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { OptimizeDesignInputSchema, OptimizeDesignOutputSchema, type OptimizeDesignInput, type OptimizeDesignOutput } from '@/ai/tool-schemas';
import { calculateOptimalDesign, type CalculationOutput } from '@/services/calculations';

// This is the main exported function that will be called by the server action.
export async function optimizeDesign(input: OptimizeDesignInput): Promise<OptimizeDesignOutput> {
  return await optimizeDesignFlow(input);
}

// 1. Define a new, simpler AI prompt that only generates the reasoning.
const generateReasoningPrompt = ai.definePrompt({
    name: 'generateOptimizerReasoningPrompt',
    input: { schema: z.object({
        finalSystemSize: z.number(),
        limitingFactor: z.enum(['consumption', 'area']),
        monthlyConsumption: z.number(),
        surfaceArea: z.number(),
    })},
    output: { schema: z.object({
        reasoning: OptimizeDesignOutputSchema.shape.reasoning,
    })},
    prompt: `You are an expert solar engineer writing a summary for a client in Jordan.
Based on the final, calculated data below, write a clear, step-by-step reasoning in Arabic.

**Final Design Data:**
- Final Recommended System Size: {{{finalSystemSize}}} kWp
- The Limiting Factor for the design was: {{{limitingFactor}}}
- User's Monthly Consumption: {{{monthlyConsumption}}} kWh
- User's Available Area: {{{surfaceArea}}} m²

**Your Task:**
Write the 'reasoning' text. Explain **why** this specific system size was chosen.
You MUST explicitly mention which constraint was the limiting factor (consumption/law or area).

- **If 'limitingFactor' is 'consumption':** "تم تحديد حجم النظام بـ {{{finalSystemSize}}} كيلوواط لتغطية استهلاكك الشهري بالكامل ({{{monthlyConsumption}}} كيلوواط/ساعة)، وهو الحد الأقصى الذي يسمح به قانون صافي القياس في الأردن. هذا النظام يتناسب مع مساحتك المتاحة."
- **If 'limitingFactor' is 'area':** "بناءً على مساحتك المتاحة البالغة {{{surfaceArea}}} متر مربع، تم تحديد حجم النظام الأقصى بـ {{{finalSystemSize}}} كيلوواط. هذا النظام يغطي جزءًا كبيرًا من استهلاكك وهو أكبر ما يمكن تركيبه."

Briefly justify the component choices (inverter, panels, etc.).
The response must be ONLY the reasoning text in Arabic.
`,
});


// 2. Define the Genkit flow
const optimizeDesignFlow = ai.defineFlow(
  {
    name: 'optimizeDesignFlow',
    inputSchema: OptimizeDesignInputSchema,
    outputSchema: OptimizeDesignOutputSchema,
  },
  async (input) => {
    // Step 1: Get the definitive calculations from the physics-based service.
    const calculatedData: CalculationOutput = calculateOptimalDesign(input);

    // Step 2: Call the AI model ONLY to generate the reasoning, using the accurate data.
    const { output: reasoningOutput } = await generateReasoningPrompt({
        finalSystemSize: calculatedData.panelConfig.totalDcPower,
        limitingFactor: calculatedData.limitingFactor,
        monthlyConsumption: input.monthlyConsumption,
        surfaceArea: input.surfaceArea,
    });
    
    if (!reasoningOutput) {
        throw new Error("AI failed to generate reasoning.");
    }

    // Step 3: Combine the accurate, calculated data with the AI-generated reasoning.
    return {
      ...calculatedData,
      reasoning: reasoningOutput.reasoning,
    };
  }
);
