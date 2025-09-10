'use server';

/**
 * @fileOverview AI-powered live solar performance simulation.
 *
 * - simulatePerformance - A function to simulate the performance of a solar system based on its specs and weather data.
 * - SimulatePerformanceInputSchema - The input type for the function.
 * - SimulationDataPointSchema - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input schema for the simulation
export const SimulatePerformanceInputSchema = z.object({
  systemSize: z.number().describe('The total DC power of the solar panel system in kWp.'),
  location: z.string().describe('The geographical location (city) of the system.'),
  panelTilt: z.number().describe('The tilt angle of the solar panels in degrees.'),
  panelAzimuth: z.number().describe('The azimuth angle of the solar panels (e.g., 180 for South).'),
});

// Output schema for a single data point in the simulation
export const SimulationDataPointSchema = z.object({
  time: z.string().describe('The current timestamp for the data point (e.g., "14:32").'),
  solarIrradiance: z.number().describe('Simulated Global Horizontal Irradiance (GHI) in W/m^2.'),
  temperature: z.number().describe('Simulated ambient temperature in degrees Celsius.'),
  cloudCover: z.number().describe('Simulated cloud cover percentage (0-100).'),
  outputPower: z.number().describe('The calculated output power of the system in Watts at this instant.'),
});
export type SimulationDataPoint = z.infer<typeof SimulationDataPointSchema>;


// This function is the main entry point called by the server action.
export async function simulatePerformance(
  input: z.infer<typeof SimulatePerformanceInputSchema>
): Promise<SimulationDataPoint> {
  return await simulatePerformanceFlow(input);
}


const prompt = ai.definePrompt({
  name: 'simulatePerformancePrompt',
  input: { schema: z.object({
    systemSize: SimulatePerformanceInputSchema.shape.systemSize,
    location: SimulatePerformanceInputSchema.shape.location,
    panelTilt: SimulatePerformanceInputSchema.shape.panelTilt,
    panelAzimuth: SimulatePerformanceInputSchema.shape.panelAzimuth,
    // Add simulated weather data to the prompt input
    simulatedIrradiance: z.number(),
    simulatedTemperature: z.number(),
    simulatedCloudCover: z.number(),
    currentTime: z.string(),
  }) },
  output: { schema: SimulationDataPointSchema },
  prompt: `You are an advanced solar energy simulation engine. Your task is to calculate the instantaneous power output of a solar PV system based on its specifications and simulated weather data.

System Specifications:
- System Size (DC): {{{systemSize}}} kWp
- Location: {{{location}}}
- Panel Tilt Angle: {{{panelTilt}}} degrees
- Panel Azimuth Angle: {{{panelAzimuth}}} degrees (180 = South)

Simulated Weather Conditions for this moment ({{{currentTime}}}):
- Global Horizontal Irradiance (GHI): {{{simulatedIrradiance}}} W/m²
- Ambient Temperature: {{{simulatedTemperature}}} °C
- Cloud Cover: {{{simulatedCloudCover}}} %

Based on these inputs, calculate the final `outputPower` in Watts.
Also, populate the other fields in the output (`time`, `solarIrradiance`, `temperature`, `cloudCover`) with the exact values provided to you for this simulation step.
Assume standard system losses (e.g., inverter efficiency, soiling, wiring) of about 15% in your calculation.
The location affects the sun's angle, which you must factor in along with the panel angles and weather.
`,
});

const simulatePerformanceFlow = ai.defineFlow(
  {
    name: 'simulatePerformanceFlow',
    inputSchema: SimulatePerformanceInputSchema,
    outputSchema: SimulationDataPointSchema,
  },
  async (input) => {
    // In a real application, you would fetch live weather data here using a tool.
    // For this MVP, we will simulate realistic but random weather data.
    const now = new Date();
    const hour = now.getHours();
    
    // Simulate weather based on time of day
    const isDayTime = hour > 6 && hour < 18;
    let baseIrradiance = 0;
    if (isDayTime) {
      // Simulate a sun curve - peaks at midday (hour 12)
      const peakHour = 12;
      const hoursFromPeak = Math.abs(hour - peakHour);
      baseIrradiance = 950 * (1 - hoursFromPeak / 8); // Simple linear model
      baseIrradiance = Math.max(0, baseIrradiance);
    }
    
    const simulatedIrradiance = baseIrradiance * (1 - Math.random() * 0.4); // Random fluctuation
    const simulatedTemperature = 25 + (Math.random() - 0.5) * 10; // 20-30°C range
    const simulatedCloudCover = Math.random() * 50; // 0-50% cloud cover
    const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const { output } = await prompt({
      ...input,
      simulatedIrradiance: Math.round(simulatedIrradiance),
      simulatedTemperature: parseFloat(simulatedTemperature.toFixed(1)),
      simulatedCloudCover: parseFloat(simulatedCloudCover.toFixed(1)),
      currentTime: currentTime,
    });

    return output!;
  }
);
