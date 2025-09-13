'use server';

/**
 * @fileOverview Solar system design optimization AI agent.
 *
 * This file defines a Genkit flow that acts as an expert solar engineer. It takes high-level
 * user requirements (budget, area, consumption) and now also advanced parameters to find an
 * optimized solar PV system design.
 */

import { ai } from '@/ai/genkit';
import { OptimizeDesignInputSchema, OptimizeDesignOutputSchema, type OptimizeDesignInput, type OptimizeDesignOutput } from '@/ai/tool-schemas';


// This is the main exported function that will be called by the server action.
export async function optimizeDesign(input: OptimizeDesignInput): Promise<OptimizeDesignOutput> {
  return await optimizeDesignFlow(input);
}


// 1. Define the AI prompt
const optimizeDesignPrompt = ai.definePrompt({
    name: 'optimizeDesignPrompt',
    input: { schema: OptimizeDesignInputSchema },
    output: { schema: OptimizeDesignOutputSchema },
    prompt: `You are an expert solar system design optimization engine for Jordan.
Your goal is to find the optimal solar PV system design that maximizes the 25-year financial return for the user, while staying within their budget and available area, and aiming to cover their electricity needs.

**User Constraints & Parameters:**
- **Budget:** {{{budget}}} JOD
- **Available Area:** {{{surfaceArea}}} m²
- **Average Monthly Bill:** {{{monthlyBill}}} JOD
- **Location:** {{{location}}}

**Advanced Parameters (Jordan Market):**
- **Electricity Tariff:** {{{kwhPrice}}} JOD/kWh
- **Cost per Watt (Full System):** {{{costPerWatt}}} JOD/Wp
- **System Losses (Inverter, Wiring, Dirt):** {{{systemLoss}}}%
- **Panel Wattage to Use:** {{{panelWattage}}} Wp
- **Panel Degradation per Year:** 0.5%
- **Area per Panel (including spacing):** 3.5 m² (This is an approximation for a {{{panelWattage}}}Wp panel)
- **Optimal Tilt/Azimuth:** 30 degrees / 180 degrees (South)
- **Average peak sun hours per day:**
  - amman: 5.5
  - zarqa: 5.6
  - irbid: 5.4
  - aqaba: 6.0

**Your Task (Think Step-by-Step):**

1.  **Estimate Target System Size:**
    - Calculate the user's average monthly kWh consumption: ({{{monthlyBill}}} / {{{kwhPrice}}}).
    - Calculate the daily kWh consumption.
    - Calculate the required system size (kWp) to cover this daily consumption, considering sun hours for {{{location}}} and system losses ( (100-{{{systemLoss}}})/100 ). Let's call this 'ConsumptionBasedSize'.

2.  **Determine Constraints-Based System Size:**
    - Calculate the maximum system size based on budget: ({{{budget}}} / {{{costPerWatt}}}) / 1000 = 'BudgetBasedSize' (in kWp).
    - Calculate the maximum system size based on area: ({{{surfaceArea}}} / 3.5) * {{{panelWattage}}} / 1000 = 'AreaBasedSize' (in kWp).

3.  **Select the Optimized System Size:**
    - The 'optimizedSystemSize' is the **smallest** of the three calculated sizes: ConsumptionBasedSize, BudgetBasedSize, and AreaBasedSize. This ensures the design is realistic and meets all constraints. Round it to one decimal place.

4.  **Design the System based on 'optimizedSystemSize':**
    - **Total Cost:** 'optimizedSystemSize' * 1000 * {{{costPerWatt}}}
    - **Panel Configuration:**
      - 'panelCount': Math.floor(('optimizedSystemSize' * 1000) / {{{panelWattage}}}).
      - 'panelWattage': {{{panelWattage}}}.
      - 'totalDcPower': ('panelCount' * {{{panelWattage}}}) / 1000.
      - 'tilt': 30.
      - 'azimuth': 180.
    - **Inverter Configuration:**
      - 'recommendedSize': Choose an inverter size that is 90-100% of the 'totalDcPower'. For example, for an 8.2 kWp system, an 8 kW inverter is perfect.
      - 'phase': Assume 'Three-Phase' for systems > 6 kW, otherwise 'Single-Phase'.
      - 'mpptVoltage': Provide a typical range like "200-800V".
    - **Wiring Configuration:**
      - 'panelsPerString': This is a complex calculation. For this model, assume a simple configuration. If total panels <= 20, make it one string. 'panelsPerString' = 'panelCount'.
      - 'parallelStrings': 1.
      - 'wireSize': Use 6mm² as a standard recommendation for systems of this size.

5.  **Calculate Financials:**
    - Calculate annual energy production (kWh): 'totalDcPower' * (sun hours for {{{location}}}) * 365 * (1 - {{{systemLoss}}}/100).
    - Calculate annual savings: annual energy production * {{{kwhPrice}}} JOD/kWh.
    - **Payback Period:** 'totalCost' / annual savings.
    - **25-Year Profit:** (annual savings * 25 * (1 - 0.005 * 12.5) [for average degradation]) - 'totalCost'.

6.  **Generate Reasoning (in ARABIC):**
    - Provide a clear, step-by-step explanation in Arabic.
    - Start by stating the final recommended system size.
    - Explain **why** this size was chosen by comparing the user's needs (consumption) with their constraints (budget and area). For example: "لقد تم تحديد حجم النظام الأمثل بـ 8.2 كيلوواط. هذا هو أكبر نظام يمكن تركيبه ضمن ميزانيتك البالغة {{{budget}}} دينار، مع العلم أن مساحتك كانت تسمح بالمزيد." or "تم تحديد حجم النظام لتغطية استهلاكك الشهري بالكامل، والذي يتناسب مع ميزانيتك ومساحتك المتاحة."
    - Briefly justify the component choices (inverter, panels, etc.).
    - Conclude by highlighting the excellent financial return.

**CRITICAL:** Fill out ALL fields in the output schema. Your response must be only the valid JSON object.
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
    const { output } = await optimizeDesignPrompt(input);
    if (!output) {
        throw new Error("AI model failed to generate a design.");
    }
    return output;
  }
);
