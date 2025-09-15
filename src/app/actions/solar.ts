
'use server';

import {z} from 'zod';
import {
  suggestStringConfiguration,
} from '@/ai/flows/suggest-string-config';
import {SuggestStringConfigurationInputSchema} from '@/ai/tool-schemas';
import type {SuggestStringConfigurationInput} from '@/ai/tool-schemas';
import { FinancialViabilityInput, type FinancialViabilityResult, type MonthlyBreakdown } from '@/services/calculations';
import { getHistoricalWeatherForYear } from '@/services/weather-service';


const FinancialViabilityInputSchema = z.object({
  systemSize: z.coerce.number().positive("يجب أن يكون حجم النظام إيجابياً"),
  systemLoss: z.coerce.number().min(0, "لا يمكن أن يكون أقل من 0").max(99, "لا يمكن أن يكون أعلى من 99"),
  tilt: z.coerce.number().min(0).max(90),
  azimuth: z.coerce.number().min(0).max(360),
  location: z.enum(['amman', 'zarqa', 'irbid', 'aqaba'], { required_error: "الرجاء اختيار الموقع" }),
  costPerKw: z.coerce.number().positive("التكلفة يجب أن تكون إيجابية"),
  kwhPrice: z.coerce.number().positive("السعر يجب أن يكون إيجابياً"),
});

const locationCoordinates = {
    amman: { lat: 31.95, lon: 35.91 },
    zarqa: { lat: 32.05, lon: 36.09 },
    irbid: { lat: 32.55, lon: 35.85 },
    aqaba: { lat: 29.53, lon: 35.00 },
};

const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];


async function calculateFinancialViability(input: FinancialViabilityInput): Promise<FinancialViabilityResult> {
    const totalInvestment = input.systemSize * input.costPerKw;
    const systemLossFactor = 1 - input.systemLoss / 100;
    
    const coordinates = locationCoordinates[input.location];
    const historicalData = await getHistoricalWeatherForYear(coordinates.lat, coordinates.lon);

    const monthlyBreakdown = monthNames.map((month, index) => {
        const monthData = historicalData.find(d => d.month === index);
        const dailyIrradiation_Wh_m2 = monthData ? monthData.total_irrad_Wh_m2 : 0; 
        
        // Correct Calculation:
        // Daily Production (kWh) = [System Size (kWp) * Daily Irradiation (Wh/m²) * System Loss Factor] / 1000
        // We divide by 1000 because the irradiation is in Watt-hours, and we need kWh.
        const dailyProduction = (input.systemSize * dailyIrradiation_Wh_m2 * systemLossFactor) / 1000;
        const monthlyProduction = dailyProduction * daysInMonth[index];
        const monthlyRevenue = monthlyProduction * input.kwhPrice;
        
        return {
            month: month,
            // The value to display should be in kWh/m²/day, so we divide by 1000.
            sunHours: parseFloat((dailyIrradiation_Wh_m2 / 1000).toFixed(2)),
            production: monthlyProduction,
            revenue: monthlyRevenue,
        };
    });

    const totalAnnualProduction = monthlyBreakdown.reduce((sum, item) => sum + item.production, 0);
    const annualRevenue = monthlyBreakdown.reduce((sum, item) => sum + item.revenue, 0);
    const paybackPeriodMonths = annualRevenue > 0 ? Math.ceil((totalInvestment / annualRevenue) * 12) : Infinity;
    const netProfit25Years = (annualRevenue * 25) - totalInvestment;

    return {
        totalInvestment,
        totalAnnualProduction,
        annualRevenue,
        paybackPeriodMonths,
        netProfit25Years,
        monthlyBreakdown,
    };
}


export async function suggestStringConfigurationAction(
  input: SuggestStringConfigurationInput
) {
  try {
    const validatedInput = SuggestStringConfigurationInputSchema.parse(input);
    const result = await suggestStringConfiguration(validatedInput);
    return {success: true, data: result};
  } catch (error) {
    console.error('Error in suggestStringConfigurationAction:', error);
    if (error instanceof z.ZodError) {
      return {success: false, error: 'المدخلات المقدمة غير صالحة.'};
    }
    return {
      success: false,
      error: 'فشل في الحصول على اقتراح من الذكاء الاصطناعي.',
    };
  }
}

export async function calculateFinancialViabilityAction(input: FinancialViabilityInput) {
    try {
        const validatedInput = FinancialViabilityInputSchema.parse(input);
        const result = await calculateFinancialViability(validatedInput);
        return { success: true, data: result };
    } catch (error) {
        console.error("Error in calculateFinancialViabilityAction:", error);
        if (error instanceof z.ZodError) {
            return { success: false, error: 'المدخلات المقدمة غير صالحة.' };
        }
        const errorMessage = error instanceof Error ? error.message : 'فشل في حساب الجدوى المالية.';
        return { success: false, error: errorMessage };
    }
}
