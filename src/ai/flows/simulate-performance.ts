'use server';

/**
 * @fileOverview AI-powered live solar performance simulation.
 *
 * - simulatePerformance - A function to simulate the performance of a solar system based on its specs and weather data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { SimulatePerformanceInputSchema, SimulationDataPointSchema, type SimulatePerformanceInput, type SimulationDataPoint } from '@/ai/types';
import { getLiveWeatherData } from '@/services/weather-service';


// This function is the main entry point called by the server action.
export async function simulatePerformance(
  input: SimulatePerformanceInput
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
    // Add real weather data to the prompt input
    realIrradiance: z.number(),
    realTemperature: z.number(),
    realCloudCover: z.number(),
    currentTime: z.string(),
  }) },
  output: { schema: SimulationDataPointSchema },
  prompt: `You are an advanced solar energy simulation engine. Your task is to calculate the instantaneous power output of a solar PV system based on its specifications and real-time weather data.

System Specifications:
- System Size (DC): {{{systemSize}}} kWp
- Location: {{{location}}}
- Panel Tilt Angle: {{{panelTilt}}} degrees
- Panel Azimuth Angle: {{{panelAzimuth}}} degrees (180 = South)

Real-Time Weather Conditions for this moment ({{{currentTime}}}):
- Global Horizontal Irradiance (GHI): {{{realIrradiance}}} W/m^2
- Ambient Temperature: {{{realTemperature}}} °C
- Cloud Cover: {{{realCloudCover}}} %

Based on these inputs, calculate the final 'outputPower' in Watts.
Also, populate the other fields in the output ('time', 'solarIrradiance', 'temperature', 'cloudCover') with the exact real-time values provided to you for this simulation step.
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
    // Fetch live weather data using the weather service
    const weatherData = await getLiveWeatherData(input.location);
    
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const { output } = await prompt({
      ...input,
      realIrradiance: weatherData.solarIrradiance,
      realTemperature: weatherData.temperature,
      realCloudCover: weatherData.cloudCover,
      currentTime: currentTime,
    });

    return output!;
  }
);
