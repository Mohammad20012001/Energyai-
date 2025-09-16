
'use server';

import {z} from 'zod';
import {
  suggestStringConfiguration,
} from '@/ai/flows/suggest-string-config';
import {SuggestStringConfigurationInputSchema, type SuggestStringConfigurationOutput} from '@/ai/tool-schemas';
import type {SuggestStringConfigurationInput} from '@/ai/tool-schemas';
import { FinancialViabilityInput, type FinancialViabilityResult, type MonthlyBreakdown, type CashFlowPoint, type SensitivityAnalysis } from '@/services/calculations';


const FinancialViabilityInputSchema = z.object({
  systemSize: z.coerce.number().positive("يجب أن يكون حجم النظام إيجابياً"),
  systemLoss: z.coerce.number().min(0, "لا يمكن أن يكون أقل من 0").max(99, "لا يمكن أن يكون أعلى من 99"),
  tilt: z.coerce.number().min(0).max(90),
  azimuth: z.coerce.number().min(0).max(360),
  location: z.enum(['amman', 'zarqa', 'irbid', 'aqaba'], { required_error: "الرجاء اختيار الموقع" }),
  costPerKw: z.coerce.number().positive("التكلفة يجب أن تكون إيجابية"),
  kwhPrice: z.coerce.number().positive("السعر يجب أن يكون إيجابياً"),
  degradationRate: z.coerce.number().min(0, "لا يمكن أن يكون سالباً").max(5, "النسبة مرتفعة جداً"),
});

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

// This helper function performs the core financial calculation logic.
// It's used for the main calculation and for the sensitivity analysis scenarios.
function performFinancialCalculation(
    systemSize: number, 
    costPerKw: number, 
    kwhPrice: number, 
    systemLoss: number, 
    degradationRate: number, 
    locationPSSH: number[]
): Pick<FinancialViabilityResult, 'totalInvestment' | 'annualRevenue' | 'paybackPeriodMonths' | 'netProfit25Years'> {
    const totalInvestment = systemSize * costPerKw;
    const systemLossFactor = 1 - systemLoss / 100;
    const degradationFactor = 1 - (degradationRate / 100);

    const firstYearAnnualProduction = locationPSSH.reduce((sum, dailyIrradiation, index) => {
        const dailyProduction = systemSize * dailyIrradiation * systemLossFactor;
        const monthlyProduction = dailyProduction * daysInMonth[index];
        return sum + monthlyProduction;
    }, 0);

    const firstYearAnnualRevenue = firstYearAnnualProduction * kwhPrice;

    let paybackPeriodMonths = Infinity;
    let total25YearRevenue = 0;
    let cumulativeRevenue = 0; // Renamed for clarity

    for (let year = 1; year <= 25; year++) {
        const currentYearProduction = firstYearAnnualProduction * Math.pow(degradationFactor, year - 1);
        const currentYearRevenue = currentYearProduction * kwhPrice;
        const revenueUpToPreviousYear = cumulativeRevenue;
        cumulativeRevenue += currentYearRevenue;

        if (paybackPeriodMonths === Infinity && cumulativeRevenue >= totalInvestment) {
            const remainingInvestment = totalInvestment - revenueUpToPreviousYear;
            const monthlyRevenueThisYear = currentYearRevenue / 12;
            const monthsIntoYear = monthlyRevenueThisYear > 0 ? Math.ceil(remainingInvestment / monthlyRevenueThisYear) : 0;
            paybackPeriodMonths = ((year - 1) * 12) + monthsIntoYear;
        }
    }
    
    const netProfit25Years = cumulativeRevenue - totalInvestment;
    if (paybackPeriodMonths > 25 * 12) paybackPeriodMonths = Infinity;

    return {
        totalInvestment,
        annualRevenue: firstYearAnnualRevenue,
        paybackPeriodMonths,
        netProfit25Years,
    };
}


async function calculateFinancialViability(input: z.infer<typeof FinancialViabilityInputSchema>): Promise<FinancialViabilityResult> {
    const { systemSize, costPerKw, kwhPrice, systemLoss, degradationRate, location } = input;
    const locationPSSH = monthlyPSSH[location];

    // --- Main Calculation ---
    const mainResult = performFinancialCalculation(systemSize, costPerKw, kwhPrice, systemLoss, degradationRate, locationPSSH);
    
    // --- First year monthly breakdown (only for main scenario) ---
    const systemLossFactor = 1 - systemLoss / 100;
    const monthlyBreakdown: MonthlyBreakdown[] = monthNames.map((month, index) => {
        const dailyIrradiation = locationPSSH[index];
        const dailyProduction = systemSize * dailyIrradiation * systemLossFactor;
        const monthlyProduction = dailyProduction * daysInMonth[index];
        const monthlyRevenue = monthlyProduction * kwhPrice;
        return {
            month: month,
            sunHours: parseFloat(dailyIrradiation.toFixed(2)),
            production: monthlyProduction,
            revenue: monthlyRevenue,
        };
    });
    const totalAnnualProduction = monthlyBreakdown.reduce((sum, item) => sum + item.production, 0);

    // --- Cash Flow Analysis (only for main scenario) ---
    const cashFlowAnalysis: CashFlowPoint[] = [{ year: 0, cashFlow: -mainResult.totalInvestment }];
    const degradationFactor = 1 - (degradationRate / 100);
    let cumulativeRevenue = 0;
    for (let year = 1; year <= 25; year++) {
        const currentYearProduction = totalAnnualProduction * Math.pow(degradationFactor, year - 1);
        const currentYearRevenue = currentYearProduction * kwhPrice;
        cumulativeRevenue += currentYearRevenue;
        cashFlowAnalysis.push({ year: year, cashFlow: cumulativeRevenue - mainResult.totalInvestment });
    }

    // --- Sensitivity Analysis ---
    const costVariation = 0.10; // 10%
    const priceVariation = 0.10; // 10%

    // Cost Sensitivity
    const costLowerResult = performFinancialCalculation(systemSize, costPerKw * (1 - costVariation), kwhPrice, systemLoss, degradationRate, locationPSSH);
    const costHigherResult = performFinancialCalculation(systemSize, costPerKw * (1 + costVariation), kwhPrice, systemLoss, degradationRate, locationPSSH);

    // KWH Price Sensitivity
    const priceLowerResult = performFinancialCalculation(systemSize, costPerKw, kwhPrice * (1 - priceVariation), systemLoss, degradationRate, locationPSSH);
    const priceHigherResult = performFinancialCalculation(systemSize, costPerKw, kwhPrice * (1 + priceVariation), systemLoss, degradationRate, locationPSSH);
    
    const sensitivityAnalysis: SensitivityAnalysis = {
        cost: {
            lower: { paybackPeriodMonths: costLowerResult.paybackPeriodMonths, netProfit25Years: costLowerResult.netProfit25Years },
            higher: { paybackPeriodMonths: costHigherResult.paybackPeriodMonths, netProfit25Years: costHigherResult.netProfit25Years },
        },
        price: {
            lower: { paybackPeriodMonths: priceLowerResult.paybackPeriodMonths, netProfit25Years: priceLowerResult.netProfit25Years },
            higher: { paybackPeriodMonths: priceHigherResult.paybackPeriodMonths, netProfit25Years: priceHigherResult.netProfit25Years },
        }
    };


    return {
        ...mainResult,
        totalAnnualProduction,
        monthlyBreakdown,
        cashFlowAnalysis,
        sensitivityAnalysis,
    };
}


export async function suggestStringConfigurationAction(
  input: SuggestStringConfigurationInput
): Promise<{ success: boolean, data?: SuggestStringConfigurationOutput, error?: string }> {
  try {
    const validatedInput = SuggestStringConfigurationInputSchema.parse(input);
    const result = await suggestStringConfiguration(validatedInput);
    return {success: true, data: result};
  } catch (error) {
    console.error('Error in suggestStringConfigurationAction:', error);
    if (error instanceof z.ZodError) {
      return {success: false, error: 'المدخلات المقدمة غير صالحة.'};
    }
     const errorMessage =
      error instanceof Error
        ? error.message
        : 'فشل في الحصول على اقتراح من الذكاء الاصطناعي.';
    return {
      success: false,
      error: errorMessage,
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
