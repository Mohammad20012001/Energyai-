'use server';

/**
 * @fileOverview AI-powered live solar performance simulation.
 * This is a hybrid model. It uses physics-based calculations for numerical accuracy
 * and an AI model for generating the human-readable analysis.
 *
 * - simulatePerformance - A function to simulate the performance of a solar system.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { SimulatePerformanceInputSchema, SimulatePerformanceOutputSchema, type SimulatePerformanceInput, type SimulatePerformanceOutput } from '@/ai/tool-schemas';
import { getLiveAndForecastWeatherData, type WeatherData } from '@/services/weather-service';

export async function simulatePerformance(
  input: SimulatePerformanceInput
): Promise<SimulatePerformanceOutput> {
  return await simulatePerformanceFlow(input);
}

// Helper function to perform the physics-based calculation
function calculatePower(systemSizeKw: number, irradiance: number, temperature: number): number {
    const systemSizeWatts = systemSizeKw * 1000;
    const temperatureCoefficient = 0.0035; // Per degree C
    const systemLosses = 0.85; // Represents total losses (inverter, dirt, wiring, etc.)

    // Temperature derating factor
    const tempDerating = 1 - ((temperature - 25) * temperatureCoefficient);

    // Irradiance factor
    const irradianceFactor = irradiance / 1000;

    const powerOutputWatts = systemSizeWatts * irradianceFactor * tempDerating * systemLosses;
    return powerOutputWatts > 0 ? powerOutputWatts : 0;
}

// Helper to estimate irradiance from UV and cloud cover
function estimateIrradiance(uvIndex: number, cloudCover: number): number {
    // Base irradiance on UV index (very rough approximation)
    const uvBasedIrradiance = uvIndex * 100;

    // Reduce irradiance based on cloud cover
    const cloudFactor = 1 - (cloudCover * 0.75 / 100); // Assume 75% of light is blocked by 100% cloud cover

    return uvBasedIrradiance * cloudFactor;
}

// Define a new, simpler AI prompt that only generates the reasoning.
const generateAnalysisPrompt = ai.definePrompt({
  name: 'generatePerformanceAnalysisPrompt',
  input: { schema: z.object({
      liveOutputPower: z.number(),
      forecastOutputPower: z.number(),
      clearSkyOutputPower: z.number(),
      liveCloudCover: z.number(),
  }) },
  output: { schema: z.object({
      performanceAnalysis: SimulatePerformanceOutputSchema.shape.performanceAnalysis,
  }) },
  prompt: `أنت خبير في تحليل أداء أنظمة الطاقة الشمسية. بناءً على الأرقام المحسوبة التالية، قدم جملة تحليلية واحدة وموجزة باللغة العربية.

**البيانات المحسوبة:**
- الإنتاج الفعلي: {{{liveOutputPower}}} واط
- الإنتاج المتوقع: {{{forecastOutputPower}}} واط
- الإنتاج المثالي (سماء صافية): {{{clearSkyOutputPower}}} واط
- نسبة الغيوم الحالية: {{{liveCloudCover}}}%

**مهمتك:**
اكتب جملة التحليل (performanceAnalysis) فقط.
- قارن "الإنتاج الفعلي" بـ "الإنتاج المثالي" للحصول على فكرة عن الكفاءة.
- اذكر السبب الرئيسي لأي انخفاض كبير (مثل الغيوم).
- إذا كان الأداء منخفضًا ولكنه يطابق التوقعات، اذكر أن هذا متوقع.
- إذا كان الأداء أقل بكثير من المتوقع في ظروف صافية، اقترح فحص النظام.

- مثال 1 (غائم): "الأداء الحالي متوقع نظرًا لوجود غطاء سحابي بنسبة {{{liveCloudCover}}}%، مما يقلل الإنتاج مقارنة بالظروف المثالية."
- مثال 2 (سماء صافية، أداء جيد): "أداء ممتاز، النظام يعمل بكفاءة عالية قريبًا من الأداء المثالي في ظل الظروف الجوية الحالية."
- مثال 3 (سماء صافية، أداء منخفض): "ملاحظة: الأداء الحالي أقل من المتوقع في هذه الظروف الصافية، قد تحتاج الألواح إلى فحص أو تنظيف."
`,
});

const simulatePerformanceFlow = ai.defineFlow(
  {
    name: 'simulatePerformanceFlow',
    inputSchema: SimulatePerformanceInputSchema,
    outputSchema: SimulatePerformanceOutputSchema,
  },
  async (input): Promise<SimulatePerformanceOutput> => {
    // 1. Fetch real-world weather data
    const weatherData = await getLiveAndForecastWeatherData(input.location);
    
    // 2. Perform physics-based calculations for all 3 scenarios
    const liveIrradiance = estimateIrradiance(weatherData.current.uvIndex, weatherData.current.cloudCover);
    const liveOutputPower = calculatePower(input.systemSize, liveIrradiance, weatherData.current.temperature);

    const forecastIrradiance = estimateIrradiance(weatherData.forecast.uvIndex, weatherData.forecast.cloudCover);
    const forecastOutputPower = calculatePower(input.systemSize, forecastIrradiance, weatherData.forecast.temperature);

    const clearSkyOutputPower = calculatePower(input.systemSize, 1000, 25);

    // 3. Call the AI model ONLY to generate the analysis, using the accurate data.
    const { output: analysisOutput } = await generateAnalysisPrompt({
      liveOutputPower,
      forecastOutputPower,
      clearSkyOutputPower,
      liveCloudCover: weatherData.current.cloudCover,
    });

    if (!analysisOutput) {
      throw new Error("AI model did not return an analysis.");
    }

    // 4. Combine calculated data with AI analysis for the final response
    return {
      liveOutputPower,
      forecastOutputPower,
      clearSkyOutputPower,
      performanceAnalysis: analysisOutput.performanceAnalysis,
      weather: weatherData,
    };
  }
);
