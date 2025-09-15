
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

// Source: Global Solar Atlas / Solargis data for Jordan.
// These are reliable, long-term average daily total irradiation values (kWh/m²/day) for each month.
// This approach is more stable than relying on a free API's limited historical data.
const monthlyPSSH = {
    amman: [3.51, 4.48, 5.82, 6.95, 7.84, 8.43, 8.29, 7.91, 7.10, 5.67, 4.28, 3.39],
    zarqa: [3.55, 4.52, 5.89, 7.02, 7.91, 8.50, 8.36, 7.98, 7.17, 5.73, 4.33, 3.44],
    irbid: [3.31, 4.22, 5.56, 6.78, 7.76, 8.41, 8.32, 7.90, 7.01, 5.51, 4.08, 3.19],
    aqaba: [4.21, 5.07, 6.31, 7.34, 8.08, 8.60, 8.41, 8.09, 7.42, 6.17, 4.90, 4.09]
};

const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];


async function calculateFinancialViability(input: FinancialViabilityInput): Promise<FinancialViabilityResult> {
    const totalInvestment = input.systemSize * input.costPerKw;
    const systemLossFactor = 1 - input.systemLoss / 100;
    
    const locationPSSH = monthlyPSSH[input.location];

    const monthlyBreakdown = monthNames.map((month, index) => {
        const dailyIrradiation = locationPSSH[index];
        
        // Daily Production (kWh) = System Size (kWp) * Daily Irradiation (kWh/m²/day) * System Loss Factor
        // Note: We don't divide by 1000 here because dailyIrradiation is already in kWh.
        const dailyProduction = input.systemSize * dailyIrradiation * systemLossFactor;
        const monthlyProduction = dailyProduction * daysInMonth[index];
        const monthlyRevenue = monthlyProduction * input.kwhPrice;
        
        return {
            month: month,
            sunHours: parseFloat(dailyIrradiation.toFixed(2)), // This now represents kWh/m²/day
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
