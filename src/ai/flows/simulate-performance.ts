
      
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
import { getLiveAndForecastWeatherData, type WeatherData, type WeatherPoint } from '@/services/weather-service';

export async function simulatePerformance(
  input: SimulatePerformanceInput
): Promise<SimulatePerformanceOutput> {
  return await simulatePerformanceFlow(input);
}

// Helper function to perform the physics-based calculation
function calculatePower(systemSizeKw: number, irradiance: number, temperature: number, systemLossPercentage: number): number {
    const systemSizeWatts = systemSizeKw * 1000;
    const temperatureCoefficient = -0.0035; // Standard is negative, per degree C
    const systemLossFactor = 1 - (systemLossPercentage / 100);

    // Temperature derating factor
    const tempDerating = 1 + ((temperature - 25) * temperatureCoefficient);

    // Irradiance factor
    const irradianceFactor = irradiance / 1000;

    const powerOutputWatts = systemSizeWatts * irradianceFactor * tempDerating * systemLossFactor;
    return powerOutputWatts > 0 ? powerOutputWatts : 0;
}

// Helper to estimate irradiance from UV and cloud cover
function estimateIrradiance(uvIndex: number, cloudCover: number): number {
    const uvBasedIrradiance = uvIndex * 100;
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

// Helper function to process the full day's forecast data
function calculateFullDayForecast(forecast: WeatherPoint[], systemSize: number, kwhPrice: number, systemLoss: number) {
    if (!forecast || forecast.length === 0) {
      return { totalProductionKwh: 0, totalRevenue: 0, chartData: [] };
    }

    const chartData = forecast.map(hourlyData => {
        const irradiance = estimateIrradiance(hourlyData.uvIndex, hourlyData.cloudCover);
        const power = calculatePower(systemSize, irradiance, hourlyData.temperature, systemLoss);
        return {
            time: new Date(hourlyData.time!).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            power: parseFloat(power.toFixed(0)),
        };
    });

    const totalProductionKwh = forecast.reduce((total, hourlyData) => {
      const irradiance = estimateIrradiance(hourlyData.uvIndex, hourlyData.cloudCover);
      const hourlyPowerWatts = calculatePower(systemSize, irradiance, hourlyData.temperature, systemLoss);
      const hourlyProductionKwh = hourlyPowerWatts / 1000;
      return total + hourlyProductionKwh;
    }, 0);

    return {
      totalProductionKwh: totalProductionKwh,
      totalRevenue: totalProductionKwh * kwhPrice,
      chartData: chartData,
    };
  };


const simulatePerformanceFlow = ai.defineFlow(
  {
    name: 'simulatePerformanceFlow',
    inputSchema: SimulatePerformanceInputSchema,
    outputSchema: SimulatePerformanceOutputSchema,
  },
  async (input): Promise<SimulatePerformanceOutput> => {
    // 1. Fetch real-world and full-day forecast weather data using coordinates
    const weatherData = await getLiveAndForecastWeatherData(input.latitude, input.longitude);
    const systemLoss = 15; // Assume a 15% system loss for all calculations for now
    
    // 2. Perform physics-based calculations for all 3 LIVE scenarios
    const liveIrradiance = estimateIrradiance(weatherData.current.uvIndex, weatherData.current.cloudCover);
    const liveOutputPower = calculatePower(input.systemSize, liveIrradiance, weatherData.current.temperature, systemLoss);
    
    // Find the forecast for the current hour to use for comparison
    const now = new Date();
    const currentHour = now.getHours();
    const currentHourForecast = weatherData.forecast.find(f => new Date(f.time!).getHours() === currentHour) || weatherData.forecast[currentHour];
    
    const forecastIrradiance = estimateIrradiance(currentHourForecast.uvIndex, currentHourForecast.cloudCover);
    const forecastOutputPower = calculatePower(input.systemSize, forecastIrradiance, currentHourForecast.temperature, systemLoss);

    // For ideal power, assume 0% loss and ideal temp/irradiance
    const clearSkyOutputPower = calculatePower(input.systemSize, 1000, 25, 0);

    // 4. Calculate full-day forecast metrics
    const dailyForecast = calculateFullDayForecast(weatherData.forecast, input.systemSize, input.kwhPrice, systemLoss);

    let performanceAnalysis: string;

    try {
        // 3. Try to call the AI model ONLY to generate the analysis, using the accurate data.
        const { output: analysisOutput } = await generateAnalysisPrompt({
            liveOutputPower,
            forecastOutputPower,
            clearSkyOutputPower,
            liveCloudCover: weatherData.current.cloudCover,
        });

        if (!analysisOutput) {
            throw new Error("AI model did not return an analysis.");
        }
        performanceAnalysis = analysisOutput.performanceAnalysis;

    } catch (error) {
        console.error("AI part of performance simulation failed, using fallback text.", error);
        performanceAnalysis = "تعذر الحصول على تحليل الذكاء الاصطناعي. يرجى مراجعة الأرقام ومقارنة الأداء الفعلي بالمتوقع والمثالي.";
    }

    // 5. Combine calculated data with AI analysis for the final response
    return {
      liveOutputPower,
      forecastOutputPower,
      clearSkyOutputPower,
      performanceAnalysis: performanceAnalysis,
      weather: weatherData,
      dailyForecast: dailyForecast,
    };
  }
);
