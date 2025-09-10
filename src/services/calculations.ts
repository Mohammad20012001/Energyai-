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
