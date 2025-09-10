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


// TODO: Later, we will implement the full flow with tools.
// For now, this is a placeholder.
export async function optimizeDesign(input: OptimizeDesignInput): Promise<OptimizeDesignOutput> {
  console.log("Running dummy optimization for:", input);
  
  // This is a placeholder that returns a fixed, dummy result.
  // In the future, this will be replaced with a real AI flow call.
  return {
    summary: {
      optimizedSystemSize: 8.2,
      totalCost: 6890,
      paybackPeriod: 5.8,
      twentyFiveYearProfit: 21500,
    },
    panelConfig: {
      panelCount: 15,
      panelWattage: 550,
      totalDcPower: 8.25,
      tilt: 30,
      azimuth: 180,
    },
    inverterConfig: {
      recommendedSize: "8 kW",
      phase: "Three-Phase",
      mpptVoltage: "300-800 V"
    },
    wiringConfig: {
      panelsPerString: 15,
      parallelStrings: 1,
      wireSize: 6
    },
    reasoning: "هذا تصميم مبدئي لأغراض العرض. سيقوم المهندس الذكي قريبًا بتحليل مدخلاتك بشكل كامل لتقديم تصميم مُحسَّن ومخصص بالكامل. هذا التصميم المقترح يوازن بين حجم النظام وميزانيتك، مع اختيار عاكس مناسب لمصفوفة الألواح لضمان كفاءة عالية. فترة الاسترداد ممتازة وتؤدي إلى ربح كبير على المدى الطويل."
  };
}
