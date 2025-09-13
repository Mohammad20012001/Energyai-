/**
 * @fileoverview This file contains pure, physics-based calculation functions.
 * It follows standard electrical engineering formulas (IEC/NEC/IEEE) and does not involve AI.
 * This ensures that the numerical outputs of the application are reliable and accurate.
 */

import type { OptimizeDesignInput, OptimizeDesignOutput, SuggestWireSizeInput, SuggestWireSizeOutput } from "@/ai/tool-schemas";


/**
 * Calculates the appropriate wire size for a DC solar power system.
 * @param input The system parameters for the calculation.
 * @returns The calculated wire size and related performance metrics.
 */
export function calculateWireSize(input: SuggestWireSizeInput): Omit<SuggestWireSizeOutput, 'reasoning'> {
    const { current, voltage, distance, voltageDropPercentage } = input;

    // Constants
    const copperResistivity = 0.0172; // ρ for copper in Ω·mm²/m

    // 1. Calculate maximum allowed voltage drop in Volts
    const maxVoltageDrop = voltage * (voltageDropPercentage / 100);

    // 2. Calculate the theoretical wire cross-sectional area in mm²
    // Formula: Area = (2 * ρ * L * I) / Vd_max
    const calculatedArea = (2 * copperResistivity * distance * current) / maxVoltageDrop;

    // 3. Round up to the nearest standard available wire size
    const standardSizesMM2 = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120];
    const recommendedWireSizeMM2 = standardSizesMM2.find(size => size >= calculatedArea) ?? standardSizesMM2[standardSizesMM2.length - 1];

    // 4. Calculate the actual voltage drop with the standard wire size
    // Formula: Vd = (2 * ρ * L * I) / Area
    const actualVoltageDrop = (2 * copperResistivity * distance * current) / recommendedWireSizeMM2;

    // 5. Calculate power loss in Watts
    // Formula: P_loss = Vd * I
    const powerLoss = actualVoltageDrop * current;

    return {
        recommendedWireSizeMM2: parseFloat(recommendedWireSizeMM2.toFixed(2)),
        voltageDrop: parseFloat(actualVoltageDrop.toFixed(2)),
        powerLoss: parseFloat(powerLoss.toFixed(2)),
    };
}


// #region Panel Calculator (Consumption)
export interface PanelCalculationInput {
  monthlyBill: number;
  kwhPrice: number;
  sunHours: number;
  panelWattage: number;
  systemLoss: number;
}

export interface PanelCalculationResult {
  requiredPanels: number;
  totalKwh: number;
  dailyKwh: number;
}

export function calculatePanelsFromConsumption(input: PanelCalculationInput): PanelCalculationResult {
    const totalKwh = input.monthlyBill / input.kwhPrice;
    const dailyKwh = totalKwh / 30;
    const dailyProductionPerPanel = (input.panelWattage * input.sunHours) / 1000;
    const effectiveProductionPerPanel = dailyProductionPerPanel * (1 - input.systemLoss / 100);
    const requiredPanels = Math.ceil(dailyKwh / effectiveProductionPerPanel);

    return {
        requiredPanels,
        totalKwh,
        dailyKwh,
    };
}
// #endregion


// #region Area & Production Calculator
export interface AreaCalculationInput {
    landWidth: number;
    landLength: number;
    panelWidth: number;
    panelLength: number;
    panelWattage: number;
    sunHours: number;
}

export interface AreaCalculationResult {
    maxPanels: number;
    totalPowerKw: number;
    dailyEnergyKwh: number;
    monthlyEnergyKwh: number;
    yearlyEnergyKwh: number;
}

export function calculateProductionFromArea(input: AreaCalculationInput): AreaCalculationResult {
    const landArea = input.landWidth * input.landLength;
    const panelArea = input.panelWidth * input.panelLength;
    const requiredAreaPerPanel = panelArea * 1.5; 
    const maxPanels = Math.floor(landArea / requiredAreaPerPanel);

    const totalPowerKw = (maxPanels * input.panelWattage) / 1000;
    const dailyEnergyKwh = totalPowerKw * input.sunHours;
    const monthlyEnergyKwh = dailyEnergyKwh * 30;
    const yearlyEnergyKwh = dailyEnergyKwh * 365;

    return {
        maxPanels,
        totalPowerKw,
        dailyEnergyKwh,
        monthlyEnergyKwh,
        yearlyEnergyKwh,
    };
}
// #endregion

// #region Financial Viability Calculator
export interface FinancialViabilityInput {
    investmentAmount: number;
    costPerWatt: number;
    kwhPrice: number;
    sunHours: number;
    systemLoss: number;
}

export interface FinancialViabilityResult {
    systemSizeKw: number;
    annualProductionKwh: number;
    annualRevenue: number;
    paybackPeriodYears: number;
    netProfit25Years: number;
}

export function calculateFinancialViability(input: FinancialViabilityInput): FinancialViabilityResult {
    const systemSizeWatts = input.investmentAmount / input.costPerWatt;
    const systemSizeKw = systemSizeWatts / 1000;
    const dailyProductionKwh = systemSizeKw * input.sunHours * (1 - input.systemLoss / 100);
    const annualProductionKwh = dailyProductionKwh * 365;
    const annualRevenue = annualProductionKwh * input.kwhPrice;
    const paybackPeriodYears = annualRevenue > 0 ? input.investmentAmount / annualRevenue : Infinity;
    const netProfit25Years = (annualRevenue * 25) - input.investmentAmount;

    return {
        systemSizeKw,
        annualProductionKwh,
        annualRevenue,
        paybackPeriodYears,
        netProfit25Years,
    };
}
// #endregion


// #region Inverter Sizing Calculator
export interface InverterSizingInput {
    totalDcPower: number;
    maxVoc: number;
    maxIsc: number;
    gridPhase: 'single' | 'three';
}

export interface InverterSizingResult {
    minInverterSize: number;
    maxInverterSize: number;
    recommendedVoc: number;
    recommendedIsc: number;
    gridPhase: string;
}

export function calculateInverterSize(input: InverterSizingInput): InverterSizingResult {
    const minInverterSize = input.totalDcPower * 0.9;
    const maxInverterSize = input.totalDcPower * 1.1;
    const recommendedVoc = input.maxVoc * 1.15;
    const recommendedIsc = input.maxIsc * 1.25;

    return {
        minInverterSize,
        maxInverterSize,
        recommendedVoc,
        recommendedIsc,
        gridPhase: input.gridPhase === 'single' ? 'أحادي الطور' : 'ثلاثي الطور',
    };
}
// #endregion

// #region Optimal Design Calculator (Hybrid)

export type CalculationOutput = Omit<OptimizeDesignOutput, 'reasoning'> & {
    limitingFactor: 'consumption' | 'budget' | 'area';
};

export function calculateOptimalDesign(input: OptimizeDesignInput): CalculationOutput {
    // 1. Calculate Effective kWh Price from Tariffs
    let bill = 0;
    let remainingKwh = input.monthlyConsumption;
    
    const tariffs = [
        { limit: 160, rate: 0.033 },
        { limit: 300, rate: 0.072 },
        { limit: 500, rate: 0.086 },
        { limit: 1000, rate: 0.114 },
        { limit: Infinity, rate: 0.152 },
    ];

    let lastTierKwh = 0;
    for (const tier of tariffs) {
        const tierConsumption = Math.min(remainingKwh, tier.limit - lastTierKwh);
        bill += tierConsumption * tier.rate;
        remainingKwh -= tierConsumption;
        if (remainingKwh <= 0) break;
        lastTierKwh = tier.limit;
    }
    const effectiveKwhPrice = (input.monthlyConsumption > 0) ? bill / input.monthlyConsumption : 0;
    
    // 2. Sun Hours
    const sunHoursMap = { amman: 5.5, zarqa: 5.6, irbid: 5.4, aqaba: 6.0 };
    const sunHours = sunHoursMap[input.location];
    
    // 3. Calculate constraint sizes (in kWp)
    const dailyKwhConsumption = input.monthlyConsumption / 30;
    const systemLossFactor = (100 - input.systemLoss) / 100;
    
    const consumptionBasedSize = (dailyKwhConsumption / (sunHours * systemLossFactor));
    const budgetBasedSize = (input.budget / input.costPerWatt) / 1000;
    const areaBasedSize = (input.surfaceArea / 3.5) * input.panelWattage / 1000;

    // 4. Determine limiting factor and final system size
    let optimizedSystemSize = Math.min(consumptionBasedSize, budgetBasedSize, areaBasedSize);
    let limitingFactor: 'consumption' | 'budget' | 'area';
    
    if (optimizedSystemSize === consumptionBasedSize) {
        limitingFactor = 'consumption';
    } else if (optimizedSystemSize === budgetBasedSize) {
        limitingFactor = 'budget';
    } else {
        limitingFactor = 'area';
    }
    optimizedSystemSize = parseFloat(optimizedSystemSize.toFixed(2));
    
    // 5. Design the system based on the final size
    const totalCost = optimizedSystemSize * 1000 * input.costPerWatt;
    const panelCount = Math.floor((optimizedSystemSize * 1000) / input.panelWattage);
    const totalDcPower = (panelCount * input.panelWattage) / 1000;
    
    // Inverter
    const inverterSize = totalDcPower * 0.95; // Aim for 95% of DC power
    const phase = totalDcPower > 6 ? 'Three-Phase' : 'Single-Phase';

    // Wiring
    const panelsPerString = panelCount <= 20 ? panelCount : Math.floor(panelCount / 2);
    const parallelStrings = panelCount <= 20 ? 1 : 2;

    // 6. Calculate Financials
    const annualEnergyProduction = totalDcPower * sunHours * 365 * systemLossFactor;
    const annualSavings = annualEnergyProduction * effectiveKwhPrice;
    const paybackPeriod = annualSavings > 0 ? (totalCost / annualSavings) : Infinity;
    const twentyFiveYearProfit = (annualSavings * 25 * (1 - 0.005 * 12.5)) - totalCost;

    return {
        summary: {
            optimizedSystemSize: totalDcPower,
            totalCost: parseFloat(totalCost.toFixed(0)),
            paybackPeriod: parseFloat(paybackPeriod.toFixed(1)),
            twentyFiveYearProfit: parseFloat(twentyFiveYearProfit.toFixed(0)),
        },
        panelConfig: {
            panelCount,
            panelWattage: input.panelWattage,
            totalDcPower: totalDcPower,
            tilt: 30,
            azimuth: 180,
        },
        inverterConfig: {
            recommendedSize: `${inverterSize.toFixed(1)} kW`,
            phase,
            mpptVoltage: "200-800V",
        },
        wiringConfig: {
            panelsPerString,
            parallelStrings,
            wireSize: 6,
        },
        limitingFactor: limitingFactor,
    };
}

// #endregion
