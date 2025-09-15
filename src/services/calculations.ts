
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
    orientation: 'auto' | 'portrait' | 'landscape';
}

interface OrientationResult {
    rows: number;
    panelsPerRow: number;
    totalPanels: number;
}

export interface AreaCalculationResult {
    maxPanels: number;
    totalPowerKw: number;
    dailyEnergyKwh: number;
    monthlyEnergyKwh: number;
    yearlyEnergyKwh: number;
    finalOrientation: 'portrait' | 'landscape';
    panelsPerString: number;
    rowCount: number;
}

export function calculateProductionFromArea(input: AreaCalculationInput): AreaCalculationResult {
    const SPACING_FACTOR = 1.5;

    // --- Portrait Orientation ---
    const rowsPortrait = Math.floor(input.landLength / (input.panelLength * SPACING_FACTOR));
    const panelsPerRowPortrait = Math.floor(input.landWidth / input.panelWidth);
    const totalPanelsPortrait = rowsPortrait * panelsPerRowPortrait;

    // --- Landscape Orientation ---
    const rowsLandscape = Math.floor(input.landLength / (input.panelWidth * SPACING_FACTOR));
    const panelsPerRowLandscape = Math.floor(input.landWidth / input.panelLength);
    const totalPanelsLandscape = rowsLandscape * panelsPerRowLandscape;

    // --- Determine Best Orientation based on input ---
    let maxPanels: number;
    let finalOrientation: 'portrait' | 'landscape';
    let panelsPerString: number;
    let rowCount: number;

    if (input.orientation === 'portrait') {
        maxPanels = totalPanelsPortrait;
        finalOrientation = 'portrait';
        panelsPerString = panelsPerRowPortrait;
        rowCount = rowsPortrait;
    } else if (input.orientation === 'landscape') {
        maxPanels = totalPanelsLandscape;
        finalOrientation = 'landscape';
        panelsPerString = panelsPerRowLandscape;
        rowCount = rowsLandscape;
    } else { // 'auto'
        if (totalPanelsPortrait >= totalPanelsLandscape) {
            maxPanels = totalPanelsPortrait;
            finalOrientation = 'portrait';
            panelsPerString = panelsPerRowPortrait;
            rowCount = rowsPortrait;
        } else {
            maxPanels = totalPanelsLandscape;
            finalOrientation = 'landscape';
            panelsPerString = panelsPerRowLandscape;
            rowCount = rowsLandscape;
        }
    }

    // --- Calculate Energy Production based on max panels ---
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
        finalOrientation,
        panelsPerString,
        rowCount,
    };
}
// #endregion

// #region Financial Viability Calculator
export interface FinancialViabilityInput {
    systemSize: number;
    systemLoss: number;
    tilt: number;
    azimuth: number;
    location: 'amman' | 'zarqa' | 'irbid' | 'aqaba';
    costPerKw: number;
    kwhPrice: number;
}

export interface MonthlyBreakdown {
    month: string;
    production: number;
    revenue: number;
}

export interface FinancialViabilityResult {
    totalInvestment: number;
    totalAnnualProduction: number;
    annualRevenue: number;
    paybackPeriodMonths: number;
    netProfit25Years: number;
    monthlyBreakdown: MonthlyBreakdown[];
}

const climateData = {
    amman: { pssh: [4.5, 5.5, 6.8, 8.2, 9.5, 10.5, 11, 10.2, 9, 7.5, 5.8, 4.8] },
    zarqa: { pssh: [4.6, 5.6, 6.9, 8.3, 9.6, 10.6, 11.1, 10.3, 9.1, 7.6, 5.9, 4.9] },
    irbid: { pssh: [4.2, 5.2, 6.5, 8.0, 9.3, 10.3, 10.8, 10.0, 8.8, 7.2, 5.5, 4.5] },
    aqaba: { pssh: [5.5, 6.5, 7.5, 9.0, 10.0, 11.0, 11.5, 10.8, 9.8, 8.5, 6.8, 5.8] },
};

const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function calculateFinancialViability(input: FinancialViabilityInput): FinancialViabilityResult {
    const totalInvestment = input.systemSize * input.costPerKw;
    const systemLossFactor = 1 - input.systemLoss / 100;
    const locationPSSH = climateData[input.location].pssh;

    const monthlyBreakdown = monthNames.map((month, index) => {
        const dailyProduction = input.systemSize * locationPSSH[index] * systemLossFactor;
        const monthlyProduction = dailyProduction * daysInMonth[index];
        const monthlyRevenue = monthlyProduction * input.kwhPrice;
        return {
            month: month,
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

// #region Battery Storage Calculator
export interface BatteryCalculationInput {
    dailyLoadKwh: number;
    autonomyDays: number;
    depthOfDischarge: number;
    batteryVoltage: number;
    batteryCapacityAh: number;
    systemVoltage: number;
}

export interface BatteryCalculationResult {
    requiredBankEnergyKwh: number;
    requiredBankCapacityAh: number;
    batteriesInSeries: number;
    parallelStrings: number;
    totalBatteries: number;
}

export function calculateBatteryBank(input: BatteryCalculationInput): BatteryCalculationResult {
    // 1. Calculate the total energy needed, accounting for DoD and autonomy
    const dodFactor = input.depthOfDischarge / 100;
    const requiredBankEnergyKwh = (input.dailyLoadKwh * input.autonomyDays) / dodFactor;

    // 2. Convert the required energy (kWh) to Amp-hours at the desired system voltage
    const requiredBankCapacityAh = (requiredBankEnergyKwh * 1000) / input.systemVoltage;

    // 3. Determine the battery connection configuration
    const batteriesInSeries = Math.round(input.systemVoltage / input.batteryVoltage);
    
    // 4. Calculate how many parallel strings are needed
    const parallelStrings = Math.ceil(requiredBankCapacityAh / input.batteryCapacityAh);

    // 5. Calculate the total number of batteries
    const totalBatteries = batteriesInSeries * parallelStrings;

    return {
        requiredBankEnergyKwh: parseFloat(requiredBankEnergyKwh.toFixed(2)),
        requiredBankCapacityAh: parseFloat(requiredBankCapacityAh.toFixed(2)),
        batteriesInSeries,
        parallelStrings,
        totalBatteries,
    };
}
// #endregion

// #region Optimal Design Calculator (Hybrid)

export type CalculationOutput = Omit<OptimizeDesignOutput, 'reasoning'> & {
    limitingFactor: 'consumption' | 'area';
};

export function calculateOptimalDesign(input: OptimizeDesignInput): CalculationOutput {
    
    // 1. Sun Hours & Location Data
    const sunHoursMap = { amman: 5.5, zarqa: 5.6, irbid: 5.4, aqaba: 6.0 };
    const sunHours = sunHoursMap[input.location];
    
    // 2. Calculate constraint sizes (in kWp)
    const dailyKwhConsumption = input.monthlyConsumption / 30;
    const systemLossFactor = (100 - input.systemLoss) / 100;
    
    const consumptionBasedSize = (dailyKwhConsumption / (sunHours * systemLossFactor));
    
    // Assuming 2.6 m^2 per panel and 1.5 spacing factor.
    const panelArea = (1.13 * 2.28) * 1.5;
    const maxPanelsFromArea = Math.floor(input.surfaceArea / panelArea);
    const areaBasedSize = (maxPanelsFromArea * input.panelWattage) / 1000;

    // 3. Determine limiting factor and final system size
    let optimizedSystemSize = Math.min(consumptionBasedSize, areaBasedSize);
    let limitingFactor: 'consumption' | 'area';
    
    if (consumptionBasedSize <= areaBasedSize) {
        limitingFactor = 'consumption';
        optimizedSystemSize = consumptionBasedSize;
    } else {
        limitingFactor = 'area';
        optimizedSystemSize = areaBasedSize;
    }
    optimizedSystemSize = parseFloat(optimizedSystemSize.toFixed(2));
    
    // 4. Design the system based on the final size
    const panelCount = Math.floor((optimizedSystemSize * 1000) / input.panelWattage);
    const totalDcPower = parseFloat(((panelCount * input.panelWattage) / 1000).toFixed(2));
    const requiredArea = panelCount * panelArea;
    
    // Inverter
    const inverterSize = totalDcPower * 0.95; // Aim for 95% of DC power
    const phase = totalDcPower > 6 ? 'Three-Phase' : 'Single-Phase';

    // Wiring
    const panelsPerString = panelCount <= 20 ? panelCount : Math.floor(panelCount / 2);
    const parallelStrings = panelCount <= 20 ? 1 : 2;

    // 5. Financial Analysis
    const totalInvestment = totalDcPower * 1000 * input.costPerWatt;
    const dailyProductionKwh = totalDcPower * sunHours * systemLossFactor;
    const annualProductionKwh = dailyProductionKwh * 365;
    const annualRevenue = annualProductionKwh * input.kwhPrice;
    const paybackPeriodYears = annualRevenue > 0 ? totalInvestment / annualRevenue : Infinity;
    const netProfit25Years = (annualRevenue * 25) - totalInvestment;


    return {
        panelConfig: {
            panelCount,
            panelWattage: input.panelWattage,
            totalDcPower: totalDcPower,
            requiredArea: requiredArea,
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
        financialAnalysis: {
            totalInvestment,
            annualRevenue,
            paybackPeriodYears,
            netProfit25Years,
        },
        limitingFactor: limitingFactor,
    };
}

// #endregion

    