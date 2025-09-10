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

export async function simulatePerformance(
  input: SimulatePerformanceInput
): Promise<SimulationDataPoint> {
  return await simulatePerformanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'simulatePerformancePrompt',
  input: { schema: z.object({
      systemSize: SimulatePerformanceInputSchema.shape.systemSize,
      // Scenario-specific data
      liveSolarIrradiance: z.number(),
      liveTemperature: z.number(),
      forecastSolarIrradiance: z.number(),
      forecastTemperature: z.number(),
      clearSkySolarIrradiance: z.number(), // Ideal irradiance, e.g., 1000 W/m^2
  }) },
  output: { schema: z.object({
      liveOutputPower: z.number().describe('Calculated output power in Watts for the LIVE scenario.'),
      forecastOutputPower: z.number().describe('Calculated output power in Watts for the FORECAST scenario.'),
      clearSkyOutputPower: z.number().describe('Calculated output power in Watts for the CLEAR SKY scenario.'),
  }) },
  prompt: `You are a solar energy calculation engine. Your task is to calculate the power output of a solar PV system for three different scenarios using the provided formula.

System Specifications:
- System Size (DC): {{{systemSize}}} kWp

Formula to use for each scenario:
Power Output (Watts) = (System Size in Watts) * (Solar Irradiance / 1000) * (1 - (Temperature - 25) * 0.0035) * 0.85

Where:
- System Size in Watts = {{{systemSize}}} * 1000
- Solar Irradiance is the value for the specific scenario (in W/m^2).
- Temperature is the value for the specific scenario (in °C).
- 0.0035 is the temperature coefficient.
- 0.85 represents total system losses (e.g., inverter, dirt, wiring).

---

Scenario 1: Live Real-Time Weather Conditions
- Solar Irradiance: {{{liveSolarIrradiance}}} W/m^2
- Ambient Temperature: {{{liveTemperature}}} °C
Calculate 'liveOutputPower' using the formula.

---

Scenario 2: Forecasted Weather Conditions
- Solar Irradiance: {{{forecastSolarIrradiance}}} W/m^2
- Ambient Temperature: {{{forecastTemperature}}} °C
Calculate 'forecastOutputPower' using the formula.

---

Scenario 3: Ideal Clear Sky Conditions
- Solar Irradiance: {{{clearSkySolarIrradiance}}} W/m^2 (This is the ideal maximum)
- Ambient Temperature: 25 °C (This is the ideal temperature for panel efficiency)
Calculate 'clearSkyOutputPower' using the formula.

---

Instructions:
- Calculate the output for all three scenarios independently.
- Populate ALL fields in the output object with the calculated wattages. Do not add any extra text or explanations.
`,
});

const simulatePerformanceFlow = ai.defineFlow(
  {
    name: 'simulatePerformanceFlow',
    inputSchema: SimulatePerformanceInputSchema,
    outputSchema: SimulationDataPointSchema,
  },
  async (input) => {
    // 1. Fetch real-world weather data
    const weatherData = await getLiveAndForecastWeatherData(input.location);
    
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    // 2. Call the AI prompt with data for all scenarios
    const { output } = await prompt({
      systemSize: input.systemSize,
      // Live Data
      liveSolarIrradiance: weatherData.current.solarIrradiance,
      liveTemperature: weatherData.current.temperature,
      // Forecast Data
      forecastSolarIrradiance: weatherData.forecast.solarIrradiance,
      forecastTemperature: weatherData.forecast.temperature,
      // Ideal Data (using a standard high irradiance value)
      clearSkySolarIrradiance: 1000, 
    });

    if (!output) {
      throw new Error("AI model did not return an output.");
    }

    // 3. Combine AI results with weather data for the final response
    return {
      time: currentTime,
      // AI calculated power outputs
      liveOutputPower: output.liveOutputPower,
      forecastOutputPower: output.forecastOutputPower,
      clearSkyOutputPower: output.clearSkyOutputPower,
      // Weather data used for the calculations
      liveSolarIrradiance: weatherData.current.solarIrradiance,
      liveTemperature: weatherData.current.temperature,
      liveCloudCover: weatherData.current.cloudCover,
      forecastSolarIrradiance: weatherData.forecast.solarIrradiance,
      forecastTemperature: weatherData.forecast.temperature,
      forecastCloudCover: weatherData.forecast.cloudCover,
    };
  }
);
