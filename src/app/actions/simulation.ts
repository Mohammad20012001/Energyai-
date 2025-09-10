'use server';

import {z} from 'zod';
import {
  simulatePerformance,
} from '@/ai/flows/simulate-performance';
import {
  SimulatePerformanceInputSchema,
  SimulatePerformanceOutputSchema,
  type SimulatePerformanceInput,
} from '@/ai/tool-schemas';

const WeatherDataSchema = z.object({
  temperature: z.number(),
  cloudCover: z.number(),
  uvIndex: z.number(),
});

const SimulationDataPointSchema = SimulatePerformanceOutputSchema.extend({
  live: WeatherDataSchema,
  forecast: WeatherDataSchema,
});

type SimulationDataPoint = z.infer<typeof SimulationDataPointSchema>;

export async function startSimulationAction(
  input: SimulatePerformanceInput
): Promise<{success: boolean; data?: SimulationDataPoint; error?: string}> {
  try {
    const validatedInput = SimulatePerformanceInputSchema.parse(input);
    const result = await simulatePerformance(validatedInput);

    const weatherService = await import('@/services/weather-service');
    const weatherData = await weatherService.getLiveAndForecastWeatherData(
      validatedInput.location
    );

    const fullDataPoint: SimulationDataPoint = {
      ...result,
      live: weatherData.current,
      forecast: weatherData.forecast,
    };

    return {success: true, data: fullDataPoint};
  } catch (error) {
    console.error('Error in startSimulationAction:', error);
    if (error instanceof z.ZodError) {
      return {success: false, error: 'المدخلات المقدمة غير صالحة.'};
    }
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'فشل في الحصول على بيانات المحاكاة.';
    return {success: false, error: errorMessage};
  }
}
