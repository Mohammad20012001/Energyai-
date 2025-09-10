'use server';

/**
 * @fileOverview AI-powered live solar performance simulation.
 *
 * - simulatePerformance - A function to simulate the performance of a solar system based on its specs and weather data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { SimulatePerformanceInputSchema, SimulationDataPointSchema, type SimulatePerformanceInput, type SimulationDataPoint } from '@/ai/types';
import { getLiveAndForecastWeatherData } from '@/services/weather-service';


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
    // Live weather data
    liveIrradiance: z.number(),
    liveTemperature: z.number(),
    liveCloudCover: z.number(),
    // Forecast weather data
    forecastIrradiance: z.number(),
    forecastTemperature: z.number(),
    forecastCloudCover: z.number(),
    currentTime: z.string(),
  }) },
  output: { schema: SimulationDataPointSchema },
  prompt: `You are an advanced solar energy simulation engine. Your task is to calculate the instantaneous power output of a solar PV system based on its specifications and multiple weather scenarios for a specific moment in time.

System Specifications:
- System Size (DC): {{{systemSize}}} kWp
- Location: {{{location}}}
- Panel Tilt Angle: {{{panelTilt}}} degrees
- Panel Azimuth Angle: {{{panelAzimuth}}} degrees (180 = South)
- Current Time: {{{currentTime}}}

You must calculate three separate output power values based on the three weather scenarios provided below.

Scenario 1: Live Real-Time Weather Conditions
- Live Direct Normal Irradiance (DNI): {{{liveIrradiance}}} W/m^2
- Live Ambient Temperature: {{{liveTemperature}}} °C
- Live Cloud Cover: {{{liveCloudCover}}} %
Calculate 'liveOutputPower' based on these live conditions.

Scenario 2: Forecasted Weather Conditions
- Forecasted DNI: {{{forecastIrradiance}}} W/m^2
- Forecasted Ambient Temperature: {{{forecastTemperature}}} °C
- Forecasted Cloud Cover: {{{forecastCloudCover}}} %
Calculate 'forecastOutputPower' based on these forecasted conditions.

Scenario 3: Ideal Clear Sky Conditions
- Assume ideal DNI for the given location and time (you can estimate this based on the provided live irradiance, but assume 0% cloud cover).
- Use the live ambient temperature: {{{liveTemperature}}} °C
- Assume 0% cloud cover.
Calculate 'clearSkyOutputPower' based on these ideal conditions.

Instructions:
- The location affects the sun's angle, which you must factor in along with the panel angles and weather for all calculations.
- Assume standard system losses (e.g., inverter efficiency, soiling, wiring) of about 15% in all calculations.
- Populate ALL fields in the output object, including all live and forecast weather data, and the three calculated power outputs in Watts.
`,
});

const simulatePerformanceFlow = ai.defineFlow(
  {
    name: 'simulatePerformanceFlow',
    inputSchema: SimulatePerformanceInputSchema,
    outputSchema: SimulationDataPointSchema,
  },
  async (input) => {
    // Fetch live and forecast weather data using the weather service
    const weatherData = await getLiveAndForecastWeatherData(input.location);
    
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const { output } = await prompt({
      ...input,
      // Live Data
      liveIrradiance: weatherData.current.solarIrradiance,
      liveTemperature: weatherData.current.temperature,
      liveCloudCover: weatherData.current.cloudCover,
      // Forecast Data
      forecastIrradiance: weatherData.forecast.solarIrradiance,
      forecastTemperature: weatherData.forecast.temperature,
      forecastCloudCover: weatherData.forecast.cloudCover,
      currentTime: currentTime,
    });

    return output!;
  }
);
