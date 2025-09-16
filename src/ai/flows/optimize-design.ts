
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

- **If 'limitingFactor' is 'consumption':** "تم تحديد حجم النظام بـ {{{finalSystemSize}}} كيلوواط لتغطية استهلاكك الشهري بالكامل ({{{monthlyConsumption}}} كيلوواط/ساعة)، وهو الحد الأقصى الذي يسمح به قانون صافي القياس في الأردن. هذا النظام يتناسب مع مساحتك المتاحة، ويقدم جدوى مالية ممتازة على المدى الطويل."
- **If 'limitingFactor' is 'area':** "بناءً على مساحتك المتاحة البالغة {{{surfaceArea}}} متر مربع، تم تحديد حجم النظام الأقصى بـ {{{finalSystemSize}}} كيلوواط. هذا النظام يغطي جزءًا كبيرًا من استهلاكك وهو أكبر ما يمكن تركيبه، مما يحقق أفضل عائد ممكن من المساحة المتوفرة."

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
    
    // Pre-process input: if bill is provided, calculate consumption
    let monthlyConsumption = input.monthlyConsumption;
    if (input.calculationMode === 'bill' && input.monthlyBill && input.kwhPrice > 0) {
        monthlyConsumption = input.monthlyBill / input.kwhPrice;
    }

    if (!monthlyConsumption || monthlyConsumption <= 0) {
        throw new Error("Invalid monthly consumption value. Could not calculate from bill or was not provided.");
    }
    
    const processedInput = { ...input, monthlyConsumption };

    // Step 1: Get the definitive calculations from the physics-based service.
    const calculatedData: CalculationOutput = calculateOptimalDesign(processedInput);

    try {
        // Step 2: Try to call the AI model ONLY to generate the reasoning.
        const { output: reasoningOutput } = await generateReasoningPrompt({
            finalSystemSize: calculatedData.panelConfig.totalDcPower,
            limitingFactor: calculatedData.limitingFactor,
            monthlyConsumption: processedInput.monthlyConsumption,
            surfaceArea: processedInput.surfaceArea,
        });
        
        if (!reasoningOutput) {
            throw new Error("AI failed to generate reasoning.");
        }

        // Step 3 (Success Case): Combine accurate data with AI-generated reasoning.
        return {
          ...calculatedData,
          reasoning: reasoningOutput.reasoning,
        };

    } catch (error) {
        console.error("AI part of design optimization failed, returning calculation-only result.", error);

        // Step 3 (Fallback Case): If AI fails, return calculations with default text.
        const defaultReasoning = calculatedData.limitingFactor === 'consumption'
            ? `تم تحديد حجم النظام بـ ${calculatedData.panelConfig.totalDcPower} كيلوواط لتغطية استهلاكك الشهري، وهو ما يعتبر الحد الأقصى المسموح به قانونيًا أو المطلوب. هذا النظام هو الأمثل لاحتياجاتك.`
            : `تم تحديد حجم النظام بـ ${calculatedData.panelConfig.totalDcPower} كيلوواط بناءً على المساحة المتاحة لديك. هذا هو أكبر نظام يمكن تركيبه، مما يزيد من العائد الاستثماري للمساحة.`;

        return {
            ...calculatedData,
            reasoning: `ملاحظة: تعذر الحصول على تحليل الذكاء الاصطناعي بسبب ضغط على الشبكة. هذا شرح مبسط للنتائج. ${defaultReasoning}`,
        };
    }
  }
);
