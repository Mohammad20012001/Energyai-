
'use server';

/**
 * @fileOverview An AI agent for inspecting solar panel arrays from an image.
 *
 * NOTE: This feature is temporarily disabled due to persistent model availability issues.
 * The core logic is preserved but the main function will return an error message
 * until the underlying service becomes stable.
 *
 * - inspectPanelArray: The main function that orchestrates the inspection process.
 * - InspectionInput: The TypeScript type for the input.
 * - InspectionResult: The TypeScript type for the structured output report.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { InspectionInputSchema, InspectionResultSchema, type InspectionInput, type InspectionResult } from '@/ai/tool-schemas';


// Define the return type for the server action
export type InspectionResponse = 
    | { success: true; data: InspectionResult }
    | { success: false; error: string };

// This is the main exported function that the UI will call via a server action.
export async function inspectPanelArray(input: InspectionInput): Promise<InspectionResponse> {
  // Immediately return the maintenance error message.
  return { 
    success: false, 
    error: "ميزة المفتش الميداني قيد الصيانة حاليًا بسبب عدم استقرار نماذج تحليل الصور. نعتذر عن هذا الإزعاج." 
  };

  // The original logic is kept below for when the feature is re-enabled.
  /*
  try {
    const output = await panelInspectionFlow(input);
    return { success: true, data: output };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during image analysis.";
    console.error("Error in inspectPanelArray server action:", errorMessage);
    
    if (errorMessage.includes('503') || errorMessage.toLowerCase().includes('overloaded')) {
        return { success: false, error: "نموذج الذكاء الاصطناعي مشغول حاليًا أو غير متاح. يرجى المحاولة مرة أخرى بعد لحظات." };
    }
    return { success: false, error: errorMessage };
  }
  */
}

// 1. Define the prompt separately for clarity and reusability.
const inspectionPrompt = ai.definePrompt(
  {
    name: 'panelInspectionPrompt',
    input: { schema: InspectionInputSchema },
    output: { schema: InspectionResultSchema },
    prompt: `You are a meticulous and critical expert solar panel installation inspector. Your primary task is to find and report problems. Do not be lenient. Your analysis of the provided image(s) of a solar panel array must be thorough.

Your analysis must cover the following categories across all images. Your focus is to identify defects:
1.  **Soiling (اتساخ):** Your highest priority. Scrutinize panel surfaces for any dust, dirt, bird droppings, grime, or other debris. Even light layers of dust count. Estimate the severity and its direct impact on energy production. If you see any dirt, you MUST report it.
2.  **Shading (تظليل):** Identify any shadows cast on the panels from ANY object. This includes nearby trees, buildings, antennas, other rows of panels, mounting hardware, or even poorly routed wires. Note the potential time of day if possible from the shadows.
3.  **Physical Damage (ضرر مادي):** Look for any visible cracks, chipping, discoloration, delamination, snail trails, or any signs of physical harm to the panels or frames. Be very critical.
4.  **Installation Issues (مشاكل تركيب):** Check for obvious problems with the mounting structure, such as visible rust, poor alignment, or insecure fittings. Look for loose, sagging, or improperly managed wiring (e.g., not tied down, messy).

Based on your critical analysis of ALL images provided, provide a single, consolidated structured JSON response. All text in the response must be in Arabic.

-   **overallHealthScore:** Give a score from 0-100. A score of 100 is reserved ONLY for a brand new, perfectly clean, perfectly installed system with zero issues. Any detected issue, no matter how small, MUST lower the score. Severe soiling or damage should result in a significantly lower score.
-   **overallAssessment:** Write a single, concise sentence summarizing the state of the array, focusing on the most significant issue found.
-   **issues:** Create a list of all identified problems. For each problem, specify its category, a clear description of what you see, its severity (Low, Medium, High, Critical), and a practical recommendation. If you find no issues after a highly critical review, and only then, return an empty array for "issues".

Analyze the following images critically:
{{#each photoDataUris}}
{{media url=this}}
{{/each}}
`,
  }
);


// 2. Define the Genkit Flow that calls the prompt and returns data or throws an error.
const panelInspectionFlow = ai.defineFlow(
  {
    name: 'panelInspectionFlow',
    inputSchema: InspectionInputSchema,
    outputSchema: InspectionResultSchema,
  },
  async (input) => {
    // Call the compiled prompt directly. Genkit handles the underlying model call.
    const { output } = await inspectionPrompt(input);
    
    // If the model fails to return a structured output, throw an error.
    if (!output) {
      throw new Error("The AI model failed to return a structured analysis. The output was empty.");
    }
    
    return output;
  }
);
