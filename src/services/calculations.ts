

/**
 * @fileoverview This file contains pure, physics-based calculation functions.
 * It follows standard electrical engineering formulas (IEC/NEC/IEEE) and does not involve AI.
 * This ensures that the numerical outputs of the application are reliable and accurate.
 */

import type { OptimizeDesignInput, OptimizeDesignOutput, SuggestWireSizeInput, SuggestWireSizeOutput, SuggestStringConfigurationInput, SuggestStringConfigurationOutput } from "@/ai/tool-schemas";

// Constants for PSSH data and month details
const monthlyPSSH = {
    amman: [3.51, 4.48, 5.82, 6.95, 7.84, 8.43, 8.29, 7.91, 7.10, 5.67, 4.28, 3.39],
    zarqa: [3.55, 4.52, 5.89, 7.02, 7.91, 8.50, 8.36, 7.98, 7.17, 5.73, 4.33, 3.44],
    irbid: [3.31, 4.22, 5.56, 6.78, 7.76, 8.41, 8.32, 7.90, 7.01, 5.51, 4.08, 3.19],
    aqaba: [4.21, 5.07, 6.31, 7.34, 8.08, 8.60, 8.41, 8.09, 7.42, 6.17, 4.90, 4.09]
};
const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Calculates the appropriate wire size for a DC solar power system based on the voltage drop method.
 * This is a fundamental calculation in electrical design to ensure safety and minimize power loss.
 * 
 * The core formula used is derived from Ohm's Law (V=IR) and the formula for resistance of a conductor (R = ρL/A).
 * Combined, they give: Voltage Drop = (2 * ρ * L * I) / A
 * Where:
 * - ρ (rho) is the resistivity of the material (copper in this case).
 * - L is the one-way length of the wire in meters.
 * - I is the current in Amperes.
 * - A is the cross-sectional area in mm².
 * - The '2' accounts for the total length of the circuit (to the load and back).
 *
 * @param input The system parameters for the calculation.
 * @returns The calculated wire size and related performance metrics.
 */
export function calculateWireSize(input: SuggestWireSizeInput): Omit<SuggestWireSizeOutput, 'reasoning'> {
    const { current, voltage, distance, voltageDropPercentage } = input;

    // Constants
    const copperResistivity = 0.0172; // ρ for copper in Ω·mm²/m at 20°C

    // 1. Calculate maximum allowed voltage drop in Volts.
    // This is a percentage of the total system voltage.
    const maxVoltageDrop = voltage * (voltageDropPercentage / 100);

    // 2. Calculate the minimum required theoretical wire cross-sectional area in mm².
    // Formula derived from the voltage drop equation: Area = (2 * ρ * L * I) / Vd_max
    const calculatedArea = (2 * copperResistivity * distance * current) / maxVoltageDrop;

    // 3. Find the next available standard wire size.
    // Wires are manufactured in specific standard sizes. We must choose the next size up to be safe.
    const standardSizesMM2 = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120];
    const recommendedWireSizeMM2 = standardSizesMM2.find(size => size >= calculatedArea) ?? standardSizesMM2[standardSizesMM2.length - 1];

    // 4. Recalculate the actual voltage drop using the chosen standard wire size.
    // This shows the real-world performance of the selected wire.
    const actualVoltageDrop = (2 * copperResistivity * distance * current) / recommendedWireSizeMM2;

    // 5. Calculate power loss in Watts using the formula P = V * I.
    // In this case, the voltage is the voltage drop (Vd) across the wire.
    const powerLoss = actualVoltageDrop * current;

    return {
        recommendedWireSizeMM2: parseFloat(recommendedWireSizeMM2.toFixed(2)),
        voltageDrop: parseFloat(actualVoltageDrop.toFixed(2)),
        powerLoss: parseFloat(powerLoss.toFixed(2)),
    };
}


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

/**
 * Calculates the maximum number of panels that can fit in a given area and their estimated energy production.
 * 
 * Logic:
 * 1.  It calculates the panel arrangement for two scenarios: Portrait and Landscape.
 * 2.  It uses a `SPACING_FACTOR` (e.g., 1.5) to account for the space between rows of panels
 *     to prevent self-shading and allow for maintenance.
 *     - Row Capacity = Land Length / (Panel Dimension perpendicular to row * Spacing Factor)
 *     - Panels per Row = Land Width / (Panel Dimension parallel to row)
 * 3.  It compares the total number of panels in both orientations (or uses the forced one) to find the maximum.
 * 4.  Once the max number of panels is known, it calculates:
 *     - Total Power (kWp) = (Max Panels * Panel Wattage) / 1000
 *     - Yearly Energy (kWh) = Total Power * Peak Sun Hours * 365
 * 
 * @param input The dimensions of the land and panels.
 * @returns The calculation results including max panels and energy production.
 */
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

// #region Financial Viability Types and Function

export interface FinancialViabilityInput {
    systemSize: number;
    systemLoss: number;
    tilt: number;
    azimuth: number;
    location: keyof typeof monthlyPSSH;
    costPerKw: number;
    kwhPrice: number;
    degradationRate: number;
}

export interface MonthlyBreakdown {
    month: string;
    sunHours: number;
    production: number;
    revenue: number;
}

export interface CashFlowPoint {
    year: number;
    cashFlow: number;
}

export interface SensitivityAnalysis {
    cost: {
        lower: { paybackPeriodMonths: number; netProfit25Years: number };
        higher: { paybackPeriodMonths: number; netProfit25Years: number };
    },
    price: {
        lower: { paybackPeriodMonths: number; netProfit25Years: number };
        higher: { paybackPeriodMonths: number; netProfit25Years: number };
    }
}

export interface FinancialViabilityResult {
    totalInvestment: number;
    annualRevenue: number;
    paybackPeriodMonths: number;
    netProfit25Years: number;
    totalAnnualProduction: number;
    monthlyBreakdown: MonthlyBreakdown[];
    cashFlowAnalysis: CashFlowPoint[];
    sensitivityAnalysis: SensitivityAnalysis;
}

/**
 * Performs a detailed financial viability analysis for a solar PV system.
 * It simulates annual production based on historical weather data (PSSH) and calculates key financial metrics over 25 years.
 *
 * @param input The technical and financial parameters of the system.
 * @returns A comprehensive financial analysis result.
 */
export function calculateFinancialViability(input: FinancialViabilityInput): FinancialViabilityResult {
    const { systemSize, costPerKw, kwhPrice, systemLoss, degradationRate, location } = input;
    
    // This internal function is now the core logic from the old `performFinancialCalculation`
    const performCalculation = (
        size: number, 
        cost: number, 
        price: number, 
        loss: number, 
        degradation: number,
        loc: keyof typeof monthlyPSSH
    ): FinancialViabilityResult => {
        const totalInvestment = size * cost;
        const systemLossFactor = 1 - loss / 100;
        const degradationFactor = 1 - degradation / 100;
        const locationPSSH = monthlyPSSH[loc];

        const monthlyBreakdown: MonthlyBreakdown[] = monthNames.map((month, index) => {
            const dailyIrradiation = locationPSSH[index];
            const dailyProduction = size * dailyIrradiation * systemLossFactor;
            const monthlyProduction = dailyProduction * daysInMonth[index];
            const monthlyRevenue = monthlyProduction * price;
            return {
                month: month,
                sunHours: parseFloat(dailyIrradiation.toFixed(2)),
                production: monthlyProduction,
                revenue: monthlyRevenue,
            };
        });
        
        const totalAnnualProduction = monthlyBreakdown.reduce((sum, item) => sum + item.production, 0);
        const firstYearAnnualRevenue = totalAnnualProduction * price;
        
        let paybackPeriodMonths: number = 301; // Default to > 25 years
        let cumulativeRevenue = 0;
        const cashFlowAnalysis: CashFlowPoint[] = [{ year: 0, cashFlow: -totalInvestment }];
        let paybackFound = false;

        for (let year = 1; year <= 25; year++) {
            const currentYearProduction = totalAnnualProduction * Math.pow(degradationFactor, year - 1);
            const currentYearRevenue = currentYearProduction * price;
            const revenueUpToPreviousYear = cumulativeRevenue;
            cumulativeRevenue += currentYearRevenue;
            cashFlowAnalysis.push({ year: year, cashFlow: cumulativeRevenue - totalInvestment });

            if (!paybackFound && cumulativeRevenue >= totalInvestment) {
                const remainingInvestment = totalInvestment - revenueUpToPreviousYear;
                const monthlyRevenueThisYear = currentYearRevenue / 12;
                const monthsIntoYear = monthlyRevenueThisYear > 0 ? Math.ceil(remainingInvestment / monthlyRevenueThisYear) : 0;
                paybackPeriodMonths = ((year - 1) * 12) + monthsIntoYear;
                paybackFound = true;
            }
        }
        
        const netProfit25Years = cumulativeRevenue - totalInvestment;
        
        // The sensitivity calculation part is now self-contained for reuse.
        const calculateSensitivityPoint = (sensitivityCost: number, sensitivityPrice: number) => {
             const investment = size * sensitivityCost;
             let cumeRevenue = 0;
             let paybackMonths: number = 301;
             let pFound = false;
             for (let y = 1; y <= 25; y++) {
                 const annualProd = totalAnnualProduction * Math.pow(degradationFactor, y - 1);
                 const annualRevenue = annualProd * sensitivityPrice;
                 const prevCumeRevenue = cumeRevenue;
                 cumeRevenue += annualRevenue;
                 if (!pFound && cumeRevenue >= investment) {
                     const remainingInv = investment - prevCumeRevenue;
                     const monthlyRev = annualRevenue / 12;
                     paybackMonths = ((y - 1) * 12) + (monthlyRev > 0 ? Math.ceil(remainingInv / monthlyRev) : 0);
                     pFound = true;
                 }
             }
             const netProfit = cumeRevenue - investment;
             return { paybackPeriodMonths: paybackMonths, netProfit25Years: netProfit };
        };
        
        const costVariation = 0.10;
        const priceVariation = 0.10;
        const sensitivityAnalysis: SensitivityAnalysis = {
             cost: {
                 lower: calculateSensitivityPoint(cost * (1 - costVariation), price),
                 higher: calculateSensitivityPoint(cost * (1 + costVariation), price),
             },
             price: {
                 lower: calculateSensitivityPoint(cost, price * (1 - priceVariation)),
                 higher: calculateSensitivityPoint(cost, price * (1 + priceVariation)),
             }
        };

        return {
            totalInvestment,
            annualRevenue: firstYearAnnualRevenue,
            paybackPeriodMonths,
            netProfit25Years,
            totalAnnualProduction,
            monthlyBreakdown,
            cashFlowAnalysis,
            sensitivityAnalysis
        };
    };

    // Perform the main calculation with the user's input
    return performCalculation(systemSize, costPerKw, kwhPrice, systemLoss, degradationRate, location);
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
    appliances?: { power: number; quantity: number; hours: number }[];
}

export interface BatteryCalculationResult {
    requiredBankEnergyKwh: number;
    requiredBankCapacityAh: number;
    batteriesInSeries: number;
    parallelStrings: number;
    totalBatteries: number;
}

/**
 * Designs a battery bank for an off-grid or hybrid solar system.
 * 
 * Logic:
 * 1.  First, determine the total daily energy consumption (dailyLoadKwh). If a list of appliances
 *     is provided, it calculates the total load from them. Otherwise, it uses the manually entered value.
 *     - Appliance kWh = (Power * Quantity * Hours) / 1000
 * 2.  Calculate the total required energy capacity of the bank. This accounts for the desired
 *     number of 'autonomy' days (days the system can run without sun) and the battery's
 *     allowed Depth of Discharge (DoD). You can't use 100% of a battery's energy without damaging it.
 *     - Required kWh = (Daily Load kWh * Autonomy Days) / (DoD / 100)
 * 3.  Convert the required energy (kWh) to the required capacity in Amp-hours (Ah) at the system's voltage.
 *     - Required Ah = (Required kWh * 1000) / System Voltage
 * 4.  Determine the number of batteries to connect in series to achieve the system voltage.
 *     - Batteries in Series = System Voltage / Single Battery Voltage
 * 5.  Determine how many parallel strings of these series-connected batteries are needed to achieve the required capacity.
 *     - Parallel Strings = Required Bank Ah / Single Battery Ah (rounded up)
 * 6.  Calculate the total number of batteries.
 *     - Total Batteries = Batteries in Series * Parallel Strings
 * 
 * @param input The load requirements and battery specifications.
 * @returns The required size and configuration of the battery bank.
 */
export function calculateBatteryBank(input: BatteryCalculationInput): BatteryCalculationResult {
    // Recalculate daily load from appliances if provided and non-empty, otherwise use the direct input
    let dailyLoadKwh = input.dailyLoadKwh;
    if (input.appliances && input.appliances.length > 0) {
        const applianceLoad = input.appliances.reduce((total, appliance) => {
             if (appliance && typeof appliance.power === 'number' && typeof appliance.quantity === 'number' && typeof appliance.hours === 'number') {
                return total + (appliance.power * appliance.quantity * appliance.hours) / 1000;
            }
            return total;
        }, 0);
        // Only use the calculated appliance load if it's a positive number
        if (applianceLoad > 0) {
            dailyLoadKwh = applianceLoad;
        }
    }
    
    // 1. Calculate the total energy needed, accounting for DoD and autonomy
    const dodFactor = input.depthOfDischarge / 100;
    const requiredBankEnergyKwh = (dailyLoadKwh * input.autonomyDays) / dodFactor;

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

export type CalculationOutput = Omit<OptimizeDesignOutput, 'reasoning'>;


/**
 * Performs a comprehensive technical and financial design for a solar PV system.
 */
export function calculateOptimalDesign(input: OptimizeDesignInput): CalculationOutput {
    
    // 1. Sun Hours & Irradiance data
    const sunHoursMap = { amman: 5.5, zarqa: 5.6, irbid: 5.4, aqaba: 6.0 };
    const sunHours = sunHoursMap[input.location];
    
    // 2. Calculate constraint sizes (in kWp)
    const dailyKwhConsumption = input.monthlyConsumption! / 30;
    const systemLossFactor = (100 - input.systemLoss) / 100;
    
    // System size required to meet consumption, accounting for losses and sun hours.
    const consumptionBasedSize = (dailyKwhConsumption / (sunHours * systemLossFactor));
    
    // An average panel requires about 2.58 sqm. Add 50% for spacing.
    const panelAreaWithSpacing = (1.13 * 2.28) * 1.5; 
    const maxPanelsFromArea = Math.floor(input.surfaceArea / panelAreaWithSpacing);
    const areaBasedSize = (maxPanelsFromArea * input.panelWattage) / 1000;

    // 3. Determine limiting factor and final system size
    let optimizedSystemSize: number;
    let limitingFactor: 'consumption' | 'area';
    
    if (consumptionBasedSize <= areaBasedSize) {
        limitingFactor = 'consumption';
        optimizedSystemSize = consumptionBasedSize;
    } else {
        limitingFactor = 'area';
        optimizedSystemSize = areaBasedSize;
    }
    
    // 4. Design the system based on the final, optimized size.
    const panelCount = Math.ceil((optimizedSystemSize * 1000) / input.panelWattage);
    const totalDcPower = parseFloat(((panelCount * input.panelWattage) / 1000).toFixed(2));
    const requiredArea = panelCount * panelAreaWithSpacing;
    
    // Inverter is typically 80-95% of DC size. DC/AC ratio ~1.1 to 1.25
    const inverterSize = totalDcPower * 0.9; 
    const phase = totalDcPower > 6 ? 'Three-Phase' : 'Single-Phase';

    // Simple stringing logic for the summary
    const panelsPerString = panelCount <= 22 ? panelCount : Math.ceil(panelCount / Math.ceil(panelCount/22));
    const parallelStrings = panelCount > 0 ? Math.ceil(panelCount / panelsPerString) : 0;
    

    // 5. Perform full financial analysis using the final calculated system size.
    const financialAnalysisResult = calculateFinancialViability({
        systemSize: totalDcPower,
        costPerKw: input.costPerWatt * 1000,
        kwhPrice: input.kwhPrice,
        systemLoss: input.systemLoss,
        degradationRate: input.degradationRate,
        location: input.location,
        // Tilt and azimuth can be passed through if they become form fields
        tilt: 30,
        azimuth: 180,
    });
    
    // Combine results
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
            mpptVoltage: "200-800V", // Example value
        },
        wiringConfig: {
            panelsPerString,
            parallelStrings,
            wireSize: 6, // Example value
        },
        financialAnalysis: {
            ...financialAnalysisResult,
            paybackPeriodYears: financialAnalysisResult.paybackPeriodMonths / 12,
        },
        limitingFactor: limitingFactor,
    };
}

// #endregion


// #region Advanced String Configuration Calculator

type AdvancedStringConfigResult = Omit<SuggestStringConfigurationOutput, 'reasoning' | 'arrayConfig'> & {
    arrayConfig: Omit<SuggestStringConfigurationOutput['arrayConfig'], 'isCurrentSafe'>;
};


/**
 * Calculates the safe and optimal range for the number of panels in a series string,
 * and then designs the full array configuration based on a target system size.
 *
 * @param input The panel, inverter, and environmental specifications.
 * @returns The min, max, and optimal number of panels per string, critical voltage values, and the full array configuration.
 */
export function calculateAdvancedStringConfiguration(input: SuggestStringConfigurationInput): AdvancedStringConfigResult {
    const { vmp, voc, tempCoefficient, mpptMin, mpptMax, inverterMaxVolt, minTemp, maxTemp, targetSystemSize, panelWattage, imp, isc, inverterMaxCurrent } = input;
    const STC_TEMP = 25; // Standard Test Condition temperature

    // 1. Calculate adjusted voltages for one panel at temp extremes
    const vocAtMinTemp = voc * (1 + (minTemp - STC_TEMP) * (tempCoefficient / 100));
    const vmpAtMaxTemp = vmp * (1 + (maxTemp - STC_TEMP) * (tempCoefficient / 100));
    
    // 2. Calculate max number of panels (Safety)
    const maxPanels = Math.floor(inverterMaxVolt / vocAtMinTemp);

    // 3. Calculate min number of panels (Performance)
    const minPanels = Math.ceil(mpptMin / vmpAtMaxTemp);

    // 4. Calculate optimal number of panels
    const targetOptimalVoltage = (mpptMin + mpptMax) / 2;
    let optimalPanels = Math.round(targetOptimalVoltage / vmp);

    // 5. Clamp the optimal value to be within the safe range
    if (optimalPanels < minPanels) optimalPanels = minPanels;
    if (optimalPanels > maxPanels) optimalPanels = maxPanels;
    
    // Handle cases where no valid configuration is possible
    if (minPanels > maxPanels || optimalPanels <= 0) {
        return {
            minPanels: minPanels > maxPanels ? minPanels : 0, maxPanels, optimalPanels: 0,
            maxStringVocAtMinTemp: 0, minStringVmpAtMaxTemp: 0,
            arrayConfig: { totalPanels: 0, parallelStrings: 0, totalCurrent: 0 }
        };
    }

    // 6. Calculate full array configuration based on target size and OPTIMAL string length
    const totalPanels = Math.ceil((targetSystemSize * 1000) / panelWattage);
    const parallelStrings = Math.ceil(totalPanels / optimalPanels);
    
    // 7. Calculate final array current for safety check (using Isc for worst-case)
    // A 1.25 safety factor is standard (NEC 690.8(A)(1))
    const totalCurrent = parallelStrings * isc * 1.25;

    // 8. Calculate the critical voltages for the report
    const maxStringVocAtMinTemp = maxPanels * vocAtMinTemp;
    const minStringVmpAtMaxTemp = minPanels * vmpAtMaxTemp;

    return {
        minPanels,
        maxPanels,
        optimalPanels,
        maxStringVocAtMinTemp,
        minStringVmpAtMaxTemp,
        arrayConfig: {
            totalPanels: totalPanels,
            parallelStrings: parallelStrings,
            totalCurrent: parseFloat(totalCurrent.toFixed(2)),
        }
    };
}


// #endregion

