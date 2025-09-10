/**
 * @fileoverview This file contains pure, physics-based calculation functions.
 * It follows standard electrical engineering formulas (IEC/NEC/IEEE) and does not involve AI.
 * This ensures that the numerical outputs of the application are reliable and accurate.
 */

import type { SuggestWireSizeInput, SuggestWireSizeOutput } from "@/ai/tool-schemas";


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
