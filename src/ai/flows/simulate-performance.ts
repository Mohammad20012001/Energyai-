'use server';

/**
 * @fileOverview AI-powered live solar performance simulation.
 *
 * - simulatePerformance - A function to simulate the performance of a solar system based on its specs and weather data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { SimulatePerformanceInputSchema, SimulatePerformanceOutputSchema, type SimulatePerformanceInput, type SimulatePerformanceOutput } from '@/ai/tool-schemas';
import { getLiveAndForecastWeatherData } from '@/services/weather-service';

export async function simulatePerformance(
  input: SimulatePerformanceInput
): Promise<SimulatePerformanceOutput> {
  return await simulatePerformanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'simulatePerformancePrompt',
  input: { schema: z.object({
      systemSize: SimulatePerformanceInputSchema.shape.systemSize,
      // Scenario-specific data
      liveUvIndex: z.number(),
      liveTemperature: z.number(),
      liveCloudCover: z.number(),
      forecastUvIndex: z.number(),
      forecastTemperature: z.number(),
      forecastCloudCover: z.number(),
  }) },
  output: { schema: z.object({
      liveOutputPower: z.number().describe('Calculated output power in Watts for the LIVE scenario.'),
      forecastOutputPower: z.number().describe('Calculated output power in Watts for the FORECAST scenario.'),
      clearSkyOutputPower: z.number().describe('Calculated output power in Watts for the CLEAR SKY scenario.'),
      performanceAnalysis: z.string().describe('A concise, one-sentence analysis in Arabic of the system\'s current performance, comparing live to ideal and forecast, and considering weather conditions.'),
  }) },
  prompt: `You are a sophisticated solar energy calculation engine and performance analyst. Your task is to calculate the power output of a solar PV system for three different scenarios and then provide a concise analysis.

System Specifications:
- System Size (DC): {{{systemSize}}} kWp

---
Part 1: Power Calculation

Formula to use for each scenario:
Power Output (Watts) = (System Size in Watts) * (Estimated Solar Irradiance / 1000) * (1 - (Temperature - 25) * 0.0035) * 0.85

Where:
- System Size in Watts = {{{systemSize}}} * 1000
- Estimated Solar Irradiance is the value you must first estimate for each specific scenario (in W/m^2).
- Temperature is the value for the specific scenario (in °C).
- 0.0035 is the temperature coefficient.
- 0.85 represents total system losses (e.g., inverter, dirt, wiring).

---

Task 1: Calculate the output for all three scenarios independently.

Scenario 1: Live Real-Time Weather Conditions
- UV Index: {{{liveUvIndex}}}
- Cloud Cover: {{{liveCloudCover}}}%
- Ambient Temperature: {{{liveTemperature}}} °C
- Step 1: Estimate the 'liveSolarIrradiance' in W/m^2. A UV index of 1 is low irradiance (~100 W/m^2), while 10+ is high (~1000 W/m^2). Reduce the irradiance based on cloud cover.
- Step 2: Calculate 'liveOutputPower' using the formula.

Scenario 2: Forecasted Weather Conditions
- UV Index: {{{forecastUvIndex}}}
- Cloud Cover: {{{forecastCloudCover}}}%
- Ambient Temperature: {{{forecastTemperature}}} °C
- Step 1: Estimate the 'forecastSolarIrradiance' in W/m^2 using the same logic.
- Step 2: Calculate 'forecastOutputPower' using the formula.

Scenario 3: Ideal Clear Sky Conditions
- Solar Irradiance: 1000 W/m^2
- Ambient Temperature: 25 °C
- Step 1: Use these ideal values directly.
- Step 2: Calculate 'clearSkyOutputPower' using the formula.

---
Part 2: Performance Analysis

Task 2: Based on the three power values you just calculated, provide a single, concise sentence in ARABIC for 'performanceAnalysis'.
- Compare 'liveOutputPower' to 'clearSkyOutputPower' to get a sense of efficiency.
- Mention the reason for any significant drop (e.g., cloud cover).
- If performance is low but matches the forecast, state that it's expected.
- If performance is much lower than forecast, suggest checking the system.
- Example 1 (cloudy): "الأداء الحالي متوقع نظرًا لوجود غطاء سحابي بنسبة {{{liveCloudCover}}}%، مما يقلل الإنتاج مقارنة بالظروف المثالية."
- Example 2 (clear sky, good performance): "أداء ممتاز، النظام يعمل بكفاءة عالية قريبًا من الأداء المثالي في ظل الظروف الجوية الحالية."
- Example 3 (clear sky, low performance): "ملاحظة: الأداء الحالي أقل من المتوقع في هذه الظروف الصافية، قد تحتاج الألواح إلى فحص أو تنظيف."

---

Instructions:
- Populate ALL fields in the output object, including the analysis. Do not add extra text.
`,
});

const simulatePerformanceFlow = ai.defineFlow(
  {
    name: 'simulatePerformanceFlow',
    inputSchema: SimulatePerformanceInputSchema,
    outputSchema: SimulatePerformanceOutputSchema,
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
      liveUvIndex: weatherData.current.uvIndex,
      liveTemperature: weatherData.current.temperature,
      liveCloudCover: weatherData.current.cloudCover,
      // Forecast Data
      forecastUvIndex: weatherData.forecast.uvIndex,
      forecastTemperature: weatherData.forecast.temperature,
      forecastCloudCover: weatherData.forecast.cloudCover,
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
      // AI generated analysis
      performanceAnalysis: output.performanceAnalysis,
      // Pass back the key weather metric
      liveUvIndex: weatherData.current.uvIndex,
    };
  }
);
