'use server';

/**
 * @fileOverview Solar system design optimization AI agent.
 *
 * This file defines a Genkit flow that acts as an expert solar engineer. It takes high-level
 * user requirements (budget, area, consumption) and uses a suite of tools to find an
 * optimized solar PV system design.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define input and output schemas for the main optimization flow

const OptimizeDesignInputSchema = z.object({
    budget: z.number().describe('The total available budget for the project in JOD.'),
    surfaceArea: z.number().describe('The available rooftop or land area in square meters (m²).'),
    monthlyBill: z.number().describe('The average monthly electricity bill in JOD, used to estimate consumption.'),
    location: z.enum(['amman', 'zarqa', 'irbid', 'aqaba']).describe('The city in Jordan for location-specific data like sun hours.'),
});

const OptimizeDesignOutputSchema = z.object({
  summary: z.object({
    optimizedSystemSize: z.number().describe('The final optimized DC system size in kilowatts (kW).'),
    totalCost: z.number().describe('The estimated total cost of the system in JOD.'),
    paybackPeriod: z.number().describe('The estimated payback period in years.'),
    twentyFiveYearProfit: z.number().describe('The estimated net profit over 25 years in JOD.'),
  }),
  panelConfig: z.object({
    panelCount: z.number().describe('The total number of solar panels.'),
    panelWattage: z.number().describe('The wattage of each individual panel.'),
    totalDcPower: z.number().describe('The total DC power of the panel array in kWp.'),
    tilt: z.number().describe('The recommended tilt angle for the panels in degrees.'),
    azimuth: z.number().describe('The recommended azimuth angle for the panels in degrees (e.g., 180 for South).'),
  }),
  inverterConfig: z.object({
    recommendedSize: z.string().describe('The recommended AC size of the inverter (e.g., "8 kW").'),
    phase: z.enum(['Single-Phase', 'Three-Phase']).describe('The recommended inverter phase type.'),
    mpptVoltage: z.string().describe('The recommended MPPT voltage range of the inverter (e.g., "300-800V").'),
  }),
  wiringConfig: z.object({
    panelsPerString: z.number().describe('Number of panels to be connected in each series string.'),
    parallelStrings: z.number().describe('Number of parallel strings.'),
    wireSize: z.number().describe('The recommended main DC wire size in mm².')
  }),
  reasoning: z.string().describe('A step-by-step explanation in Arabic of how the AI reached this design, explaining the trade-offs and why this design is optimal for the user\'s constraints.'),
});

export type OptimizeDesignInput = z.infer<typeof OptimizeDesignInputSchema>;
export type OptimizeDesignOutput = z.infer<typeof OptimizeDesignOutputSchema>;

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

**User Constraints:**
- **Budget:** {{{budget}}} JOD
- **Available Area:** {{{surfaceArea}}} m²
- **Average Monthly Bill:** {{{monthlyBill}}} JOD
- **Location:** {{{location}}}

**Assumptions & Data (Jordan Market):**
- Average cost per watt for a full system: 0.85 JOD/Wp
- Average electricity tariff: 0.12 JOD/kWh
- Average panel degradation per year: 0.5%
- Available panel wattage: 550 Wp
- Area per 550Wp panel (including spacing): 3.5 m²
- Optimal tilt angle for Jordan: 30 degrees
- Optimal azimuth: 180 degrees (South)
- System losses (inverter, wiring, dirt): 15%
- Average peak sun hours per day:
  - amman: 5.5
  - zarqa: 5.6
  - irbid: 5.4
  - aqaba: 6.0

**Your Task (Think Step-by-Step):**

1.  **Estimate Target System Size:**
    - Calculate the user's average monthly kWh consumption: ({{{monthlyBill}}} / 0.12).
    - Calculate the daily kWh consumption.
    - Calculate the required system size (kWp) to cover this daily consumption, considering sun hours for {{{location}}} and system losses. Let's call this 'ConsumptionBasedSize'.

2.  **Determine Constraints-Based System Size:**
    - Calculate the maximum system size based on budget: ({{{budget}}} / 0.85) / 1000 = 'BudgetBasedSize' (in kWp).
    - Calculate the maximum system size based on area: ({{{surfaceArea}}} / 3.5) * 550 / 1000 = 'AreaBasedSize' (in kWp).

3.  **Select the Optimized System Size:**
    - The 'optimizedSystemSize' is the **smallest** of the three calculated sizes: ConsumptionBasedSize, BudgetBasedSize, and AreaBasedSize. This ensures the design is realistic and meets all constraints. Round it to one decimal place.

4.  **Design the System based on 'optimizedSystemSize':**
    - **Total Cost:** 'optimizedSystemSize' * 1000 * 0.85
    - **Panel Configuration:**
      - 'panelCount': Math.floor(('optimizedSystemSize' * 1000) / 550).
      - 'panelWattage': 550.
      - 'totalDcPower': ('panelCount' * 550) / 1000.
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
    - Calculate annual energy production (kWh): 'totalDcPower' * (sun hours for {{{location}}}) * 365 * (1 - 0.15 system loss).
    - Calculate annual savings: annual energy production * 0.12 JOD/kWh.
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
