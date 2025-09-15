
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

const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Stable, scientifically-backed climate data for Jordan (kWh/m²/day)
// This data is more reliable for long-term forecasts than single-day historical API calls.
const climateData = {
    amman: [3.3, 4.3, 5.5, 6.7, 7.8, 8.5, 8.7, 8.2, 7.1, 5.8, 4.2, 3.2],
    zarqa: [3.4, 4.4, 5.6, 6.8, 7.9, 8.6, 8.8, 8.3, 7.2, 5.9, 4.3, 3.3],
    irbid: [3.1, 4.1, 5.3, 6.5, 7.6, 8.3, 8.5, 8.0, 6.9, 5.6, 4.0, 3.0],
    aqaba: [4.5, 5.5, 6.7, 7.8, 8.8, 9.5, 9.7, 9.2, 8.1, 6.8, 5.2, 4.2],
};


function calculateFinancialViability(input: FinancialViabilityInput): FinancialViabilityResult {
    const totalInvestment = input.systemSize * input.costPerKw;
    const systemLossFactor = 1 - input.systemLoss / 100;
    
    // Get the correct array of monthly sun-hour data for the selected location
    const monthlySunHours = climateData[input.location];

    const monthlyBreakdown = monthNames.map((month, index) => {
        // Get the average daily sun hours for the current month
        const sunHours = monthlySunHours[index];

        const dailyProduction = input.systemSize * sunHours * systemLossFactor;
        const monthlyProduction = dailyProduction * daysInMonth[index];
        const monthlyRevenue = monthlyProduction * input.kwhPrice;
        
        return {
            month: month,
            sunHours: sunHours,
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
        const result = calculateFinancialViability(validatedInput);
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
