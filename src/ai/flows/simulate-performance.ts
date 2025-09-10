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
    liveTemperature: z.number(),
    liveCloudCover: z.number(),
    // Forecast weather data
    forecastTemperature: z.number(),
    forecastCloudCover: z.number(),
    currentTime: z.string(),
  }) },
  output: { schema: SimulationDataPointSchema },
  prompt: `You are an advanced solar energy simulation engine. Your task is to calculate the instantaneous power output of a solar PV system based on its specifications and multiple weather scenarios for a specific moment in time.

System Specifications:
- System Size (DC): {{{systemSize}}} kWp
- Location: {{{location}}} (This is a city name in Jordan, use it to determine sun angle based on typical coordinates)
- Panel Tilt Angle: {{{panelTilt}}} degrees
- Panel Azimuth Angle: {{{panelAzimuth}}} degrees (180 = South)
- Current Time: {{{currentTime}}}

You must perform the following steps for each scenario:
1.  Calculate the ideal, clear-sky Global Horizontal Irradiance (GHI) in W/m^2 for the given location and time. Use your knowledge of solar positioning and atmospheric models.
2.  Adjust the calculated GHI based on the provided cloud cover percentage for the scenario. Higher cloud cover drastically reduces irradiance.
3.  Factor in the panel's tilt and azimuth angles, and the sun's current position (calculated from location and time) to determine the Plane of Array (POA) irradiance.
4.  Calculate the final power output in Watts, considering the system size, POA irradiance, and temperature effects on panel efficiency (assume a standard temperature coefficient of -0.35%/°C from a 25°C baseline).
5.  Assume standard system losses (e.g., inverter efficiency, soiling, wiring) of about 15% in all final calculations.

You must calculate three separate output power values based on the three weather scenarios provided below.

Scenario 1: Live Real-Time Weather Conditions
- Live Ambient Temperature: {{{liveTemperature}}} °C
- Live Cloud Cover: {{{liveCloudCover}}} %
Calculate 'liveOutputPower' based on these live conditions.

Scenario 2: Forecasted Weather Conditions
- Forecasted Ambient Temperature: {{{forecastTemperature}}} °C
- Forecasted Cloud Cover: {{{forecastCloudCover}}} %
Calculate 'forecastOutputPower' based on these forecasted conditions.

Scenario 3: Ideal Clear Sky Conditions
- Use the live ambient temperature: {{{liveTemperature}}} °C
- Assume 0% cloud cover.
Calculate 'clearSkyOutputPower' based on these ideal conditions.

Instructions:
- Populate ALL fields in the output object.
- For the 'liveSolarIrradiance' and 'forecastSolarIrradiance' fields in the output, provide your calculated, cloud-adjusted GHI for the Live and Forecast scenarios, respectively.
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
      liveTemperature: weatherData.current.temperature,
      liveCloudCover: weatherData.current.cloudCover,
      // Forecast Data
      forecastTemperature: weatherData.forecast.temperature,
      forecastCloudCover: weatherData.forecast.cloudCover,
      currentTime: currentTime,
    });

    // The AI now returns the calculated irradiances. We just need to add the other weather data back.
    return {
      ...output!,
      time: currentTime,
      liveTemperature: weatherData.current.temperature,
      liveCloudCover: weatherData.current.cloudCover,
      forecastTemperature: weatherData.forecast.temperature,
      forecastCloudCover: weatherData.forecast.cloudCover,
    };
  }
);
