"use server";

import { z } from "zod";
import {
  simulatePerformance,
} from "@/ai/flows/simulate-performance";
import { SimulatePerformanceInputSchema, SimulatePerformanceOutputSchema, type SimulatePerformanceInput } from "@/ai/tool-schemas";


const SimulationDataPointSchema = SimulatePerformanceOutputSchema.extend({
  // Live Data
  liveTemperature: z.number().describe('Live ambient temperature in degrees Celsius.'),
  liveCloudCover: z.number().describe('Live cloud cover percentage (0-100).'),
  
  // Forecast Data
  forecastUvIndex: z.number().describe('Forecasted UV index from the weather service.'),
  forecastTemperature: z.number().describe('Forecasted ambient temperature in degrees Celsius for the same instant.'),
  forecastCloudCover: z.number().describe('Forecasted cloud cover percentage (0-100) for the same instant.'),
});

type SimulationDataPoint = z.infer<typeof SimulationDataPointSchema>;


export async function startSimulationAction(
  input: SimulatePerformanceInput
) : Promise<{ success: boolean; data?: SimulationDataPoint; error?: string }>{
  try {
    const validatedInput = SimulatePerformanceInputSchema.parse(input);
    const result = await simulatePerformance(validatedInput);
    
    // The flow returns a partial result, so we need to fetch weather data again to have the full datapoint for the UI
    const weatherService = await import("@/services/weather-service");
    const weatherData = await weatherService.getLiveAndForecastWeatherData(validatedInput.location);

    const fullDataPoint: SimulationDataPoint = {
        ...result,
        liveTemperature: weatherData.current.temperature,
        liveCloudCover: weatherData.current.cloudCover,
        forecastUvIndex: weatherData.forecast.uvIndex,
        forecastTemperature: weatherData.forecast.temperature,
        forecastCloudCover: weatherData.forecast.cloudCover,
    };

    return { success: true, data: fullDataPoint };

  } catch (error) {
    console.error("Error in startSimulationAction:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "المدخلات المقدمة غير صالحة." };
    }
    const errorMessage = (error instanceof Error) ? error.message : "فشل في الحصول على بيانات المحاكاة.";
    return { success: false, error: errorMessage };
  }
}
