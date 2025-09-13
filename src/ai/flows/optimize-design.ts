'use server';

/**
 * @fileOverview Solar system design optimization AI agent.
 *
 * This file defines a Genkit flow that acts as an expert solar engineer. It takes high-level
 * user requirements (budget, area, consumption) and now also advanced parameters to find an
 * optimized solar PV system design that complies with Jordanian regulations.
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
Your goal is to find the optimal solar PV system design that maximizes the 25-year financial return for the user, while staying within their budget, available area, AND complying with Jordanian regulations (Net-Metering Law).

**Jordanian Net-Metering Law Summary:**
The most important rule is that a system's production should NOT exceed the user's previous year's consumption. The goal is to cover consumption, not to trade electricity. Therefore, the system size must be capped by the user's actual electricity needs.

**Jordanian Electricity Tariffs (Household - JEPCO/IDECO/EDCO):**
- From 1-160 kWh: 0.033 JOD/kWh
- From 161-300 kWh: 0.072 JOD/kWh
- From 301-500 kWh: 0.086 JOD/kWh
- From 501-1000 kWh: 0.114 JOD/kWh
- More than 1000 kWh: 0.152 JOD/kWh

**User Constraints & Parameters:**
- **Budget:** {{{budget}}} JOD
- **Available Area:** {{{surfaceArea}}} m²
- **Average Monthly Consumption:** {{{monthlyConsumption}}} kWh
- **Location:** {{{location}}}

**Advanced Parameters (Jordan Market):**
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

1.  **Calculate Effective kWh Price:**
    - Based on the user's 'monthlyConsumption' of {{{monthlyConsumption}}} kWh and the tiered tariff system, calculate the total monthly bill.
    - Then, calculate the 'effectiveKwhPrice' by dividing the total bill by the 'monthlyConsumption'. This gives a realistic, blended price per kWh for this specific user.

2.  **Calculate Constraint: Consumption-Based Size (The Legal Limit):**
    - The user's average monthly kWh consumption is {{{monthlyConsumption}}}.
    - Calculate the daily kWh consumption.
    - Calculate the required system size (kWp) to cover this daily consumption, considering sun hours for {{{location}}} and system losses ( (100-{{{systemLoss}}})/100 ). Let's call this 'ConsumptionBasedSize'. This is the legal maximum.

3.  **Calculate Constraint: Budget-Based Size:**
    - Calculate the maximum system size based on budget: ({{{budget}}} / {{{costPerWatt}}}) / 1000 = 'BudgetBasedSize' (in kWp).

4.  **Calculate Constraint: Area-Based Size:**
    - Calculate the maximum system size based on area: ({{{surfaceArea}}} / 3.5) * {{{panelWattage}}} / 1000 = 'AreaBasedSize' (in kWp).

5.  **Select the Final, Optimized, and Compliant System Size:**
    - The 'optimizedSystemSize' is the **smallest** of the three calculated sizes: ConsumptionBasedSize, BudgetBasedSize, and AreaBasedSize. This ensures the design is realistic, meets all user constraints, and complies with Jordanian law. Round it to one decimal place.

6.  **Design the System based on 'optimizedSystemSize':**
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

7.  **Calculate Financials:**
    - Calculate annual energy production (kWh): 'totalDcPower' * (sun hours for {{{location}}}) * 365 * (1 - {{{systemLoss}}}/100).
    - Calculate annual savings: annual energy production * 'effectiveKwhPrice' JOD/kWh.
    - **Payback Period:** 'totalCost' / annual savings.
    - **25-Year Profit:** (annual savings * 25 * (1 - 0.005 * 12.5) [for average degradation]) - 'totalCost'.

8.  **Generate Reasoning (in ARABIC):**
    - Provide a clear, step-by-step explanation in Arabic.
    - Start by stating the final recommended system size.
    - Explain **why** this size was chosen by explicitly mentioning which constraint was the limiting factor (consumption/law, budget, or area).
    - Example 1 (Budget is the limit): "لقد تم تحديد حجم النظام الأمثل بـ 8.2 كيلوواط. هذا هو أكبر نظام يمكن تركيبه ضمن ميزانيتك البالغة {{{budget}}} دينار، مع العلم أن مساحتك وقانون الاستهلاك كانا يسمحان بالمزيد."
    - Example 2 (Consumption/Law is the limit): "تم تحديد حجم النظام بـ 5.5 كيلوواط لتغطية استهلاكك الشهري بالكامل ({{{monthlyConsumption}}} كيلوواط/ساعة)، وهو الحد الأقصى الذي يسمح به قانون صافي القياس في الأردن. هذا النظام يتناسب مع ميزانيتك ومساحتك المتاحة."
    - Example 3 (Area is the limit): "بناءً على مساحتك المتاحة، تم تحديد حجم النظام الأقصى بـ 6.5 كيلوواط. هذا النظام يقع ضمن حدود ميزانيتك واستهلاكك."
    - Briefly justify the component choices (inverter, panels, etc.).
    - Conclude by highlighting the financial return.

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

    