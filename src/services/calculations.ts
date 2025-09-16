

/**
 * @fileoverview This file contains pure, physics-based calculation functions.
 * It follows standard electrical engineering formulas (IEC/NEC/IEEE) and does not involve AI.
 * This ensures that the numerical outputs of the application are reliable and accurate.
 */

import type { OptimizeDesignInput, OptimizeDesignOutput, SuggestWireSizeInput, SuggestWireSizeOutput, SuggestStringConfigurationInput, SuggestStringConfigurationOutput } from "@/ai/tool-schemas";


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

/**
 * Calculates the number of solar panels required to cover a given electricity consumption.
 * 
 * Logic:
 * 1.  Convert the monthly electricity bill (JOD) to total monthly energy consumption (kWh).
 *     Total kWh = Monthly Bill / Price per kWh
 * 2.  Calculate the average daily energy consumption.
 *     Daily kWh = Total Monthly kWh / 30
 * 3.  Calculate the energy (kWh) that a single solar panel can produce per day.
 *     Panel Daily Production = (Panel Wattage * Peak Sun Hours) / 1000
 * 4.  Account for system losses (e.g., inverter efficiency, dirt, temperature).
 *     Effective Panel Production = Panel Daily Production * (1 - System Loss %)
 * 5.  Determine the number of panels needed.
 *     Required Panels = Daily kWh Consumption / Effective Panel Production (rounded up).
 * 
 * @param input The consumption and panel data.
 * @returns The number of panels required and daily/total consumption.
 */
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

// #region Financial Viability Calculator Types
export interface FinancialViabilityInput {
    systemSize: number;
    systemLoss: number;
    tilt: number;
    azimuth: number;
    location: 'amman' | 'zarqa' | 'irbid' | 'aqaba';
    costPerKw: number;
    kwhPrice: number;
    degradationRate: number;
}

export interface MonthlyBreakdown {
    month: string;
    sunHours: number; // Represents average daily irradiation in kWh/m²/day for the month
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
    totalAnnualProduction: number;
    annualRevenue: number;
    paybackPeriodMonths: number;
    netProfit25Years: number;
    monthlyBreakdown: MonthlyBreakdown[];
    cashFlowAnalysis: CashFlowPoint[];
    sensitivityAnalysis: SensitivityAnalysis;
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

/**
 * Calculates a suitable size range for a grid-tied inverter.
 * 
 * Logic (based on common industry practice):
 * 1.  The inverter's AC power rating is typically sized to be between 90% and 110% of the
 *     solar array's total DC power (kWp). This is known as the DC-to-AC ratio.
 *     - Min Size = DC Power * 0.9
 *     - Max Size = DC Power * 1.1
 * 2.  The inverter's maximum input voltage should be higher than the array's maximum
 *     open-circuit voltage (Voc), typically with a safety margin of 15%.
 * 3.  The inverter's maximum input current should be higher than the array's maximum
 *     short-circuit current (Isc), typically with a safety margin of 25%.
 * 
 * @param input The DC power and electrical characteristics of the solar array.
 * @returns A recommended size range and electrical ratings for the inverter.
 */
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

export type CalculationOutput = Omit<OptimizeDesignOutput, 'reasoning'> & {
    limitingFactor: 'consumption' | 'area';
};

/**
 * Performs a comprehensive technical and financial design for a solar PV system.
 * This function acts as the core "physics engine" for the AI Design Optimizer.
 * 
 * Logic:
 * 1.  It first determines the maximum system size (in kWp) that can be installed based on two primary constraints:
 *     a.  **Consumption Constraint:** Calculates the system size needed to cover the user's monthly energy consumption.
 *         This is often a legal or practical limit (e.g., net-metering laws).
 *     b.  **Area Constraint:** Calculates the maximum system size that can physically fit in the available surface area.
 * 2.  It selects the **smaller** of these two sizes as the final, optimized system size. This ensures the design
 *     is both physically possible and compliant with consumption limits. The constraint that determined this
 *     final size is identified as the `limitingFactor`.
 * 3.  Based on the final system size, it calculates all other system components:
 *     - Total number of panels.
 *     - Required area.
 *     - Recommended inverter size.
 *     - Basic wiring configuration.
 * 4.  Finally, it performs a complete financial analysis based on the designed system:
 *     - Total Investment = System Size (kW) * Cost per kW
 *     - Annual Revenue = Annual Energy Production (kWh) * Price per kWh
 *     - Payback Period (Years) = Total Investment / Annual Revenue
 *     - Net Profit over 25 years.
 * 
 * @param input The user's constraints (consumption, area) and financial parameters.
 * @returns A complete technical and financial design object.
 */
export function calculateOptimalDesign(input: OptimizeDesignInput): CalculationOutput {
    
    // 1. Sun Hours & Location Data
    const sunHoursMap = { amman: 5.5, zarqa: 5.6, irbid: 5.4, aqaba: 6.0 };
    const sunHours = sunHoursMap[input.location];
    
    // 2. Calculate constraint sizes (in kWp)
    const dailyKwhConsumption = input.monthlyConsumption / 30;
    const systemLossFactor = (100 - input.systemLoss) / 100;
    
    // This is the system size required to meet the consumption needs.
    const consumptionBasedSize = (dailyKwhConsumption / (sunHours * systemLossFactor));
    
    // This is the maximum system size that can fit in the given area.
    // Assuming 2.6 m^2 per panel and 1.5 spacing factor.
    const panelArea = (1.13 * 2.28) * 1.5;
    const maxPanelsFromArea = Math.floor(input.surfaceArea / panelArea);
    const areaBasedSize = (maxPanelsFromArea * input.panelWattage) / 1000;

    // 3. Determine limiting factor and final system size. The optimal size is the MINIMUM of the two constraints.
    let optimizedSystemSize: number;
    let limitingFactor: 'consumption' | 'area';
    
    if (consumptionBasedSize <= areaBasedSize) {
        limitingFactor = 'consumption';
        optimizedSystemSize = consumptionBasedSize;
    } else {
        limitingFactor = 'area';
        optimizedSystemSize = areaBasedSize;
    }
    optimizedSystemSize = parseFloat(optimizedSystemSize.toFixed(2));
    
    // 4. Design the system based on the final, optimized size.
    const panelCount = Math.floor((optimizedSystemSize * 1000) / input.panelWattage);
    const totalDcPower = parseFloat(((panelCount * input.panelWattage) / 1000).toFixed(2));
    const requiredArea = panelCount * panelArea;
    
    // Inverter
    const inverterSize = totalDcPower * 0.95; // Aim for 95% of DC power, a common practice.
    const phase = totalDcPower > 6 ? 'Three-Phase' : 'Single-Phase';

    // Wiring (simplified for this high-level design)
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
            tilt: 30, // Assumed optimal tilt for Jordan
            azimuth: 180, // South-facing
        },
        inverterConfig: {
            recommendedSize: `${inverterSize.toFixed(1)} kW`,
            phase,
            mpptVoltage: "200-800V", // Typical range
        },
        wiringConfig: {
            panelsPerString,
            parallelStrings,
            wireSize: 6, // Assumed standard size for DC mains
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


// #region String Configuration Calculator
type StringConfigCalculationResult = Omit<SuggestStringConfigurationOutput, 'commonWiringErrors' | 'reasoning'>;

/**
 * Calculates the optimal string configuration for a solar panel array.
 * 
 * Logic:
 * 1.  **Panels per String (Series):** Connecting panels in series adds up their voltages. To find out how many panels
 *     are needed to reach the desired system voltage, we divide the desired voltage by the voltage of a single panel.
 *     We use `Math.floor` because we cannot exceed the inverter's maximum input voltage.
 *     `Panels per String = floor(Desired Voltage / Panel Voltage)`
 * 
 * 2.  **Parallel Strings:** Connecting strings in parallel adds up their currents. To find out how many parallel
 *     strings are needed to reach the desired total current, we divide the desired current by the current of a single string.
 *     We use `Math.ceil` because we need to provide at least the desired current.
 *     `Parallel Strings = ceil(Desired Current / Panel Current)`
 * 
 * @param input The panel's electrical characteristics and the system's desired voltage and current.
 * @returns The calculated number of panels per string and the number of parallel strings.
 */
export function calculateStringConfiguration(input: SuggestStringConfigurationInput): StringConfigCalculationResult {
    const { panelVoltage, panelCurrent, desiredVoltage, desiredCurrent } = input;

    // We use Math.floor for voltage to ensure we don't exceed the inverter's max voltage limit.
    const panelsPerString = Math.floor(desiredVoltage / panelVoltage);

    // We use Math.ceil for current to ensure we meet the required power output.
    const parallelStrings = Math.ceil(desiredCurrent / panelCurrent);

    return {
        panelsPerString: panelsPerString > 0 ? panelsPerString : 1,
        parallelStrings: parallelStrings > 0 ? parallelStrings : 1,
    };
}
// #endregion
