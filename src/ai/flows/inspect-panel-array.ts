
'use server';

/**
 * @fileOverview An AI agent for inspecting solar panel arrays from an image.
 *
 * This flow takes a user-provided image of a solar panel installation and uses a multimodal AI model
 * to identify potential issues related to soiling, shading, physical damage, and installation quality.
 * It returns a structured report with an overall health score, a summary assessment, and a list of
 * specific issues found, along with recommendations for each.
 *
 * - inspectPanelArray: The main function that orchestrates the inspection process.
 * - InspectionInput: The TypeScript type for the input.
 * - InspectionResult: The TypeScript type for the structured output report.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { InspectionInputSchema, InspectionResultSchema, type InspectionInput, type InspectionResult } from '@/ai/tool-schemas';


// This is the main exported function that the UI will call via a server action.
export async function inspectPanelArray(input: InspectionInput): Promise<InspectionResult> {
  return await panelInspectionFlow(input);
}


// 1. Define the AI Prompt with structured input and output schemas.
const inspectionPrompt = ai.definePrompt({
  name: 'panelInspectionPrompt',
  input: { schema: InspectionInputSchema },
  output: { schema: InspectionResultSchema }, // We tell the model to respond in this JSON format.
  prompt: `You are an expert solar panel installation inspector. Your task is to analyze the provided image of a solar panel array and identify any potential issues that could affect its performance, safety, or longevity.

Your analysis should cover the following categories:
1.  **Soiling:** Look for dust, dirt, bird droppings, or other debris on the panel surfaces. Estimate the severity and its potential impact on energy production.
2.  **Shading:** Identify any shadows cast on the panels from nearby objects like trees, buildings, antennas, or other parts of the installation. Note the time of day if possible from the shadows.
3.  **Physical Damage:** Look for visible cracks, chipping, discoloration, or any signs of physical harm to the panels or frames.
4.  **Installation Issues:** Check for obvious problems with the mounting structure, such as rust or poor alignment. Look for loose or improperly managed wiring if visible.

Based on your analysis, provide a structured JSON response. All text in the response must be in Arabic.

-   **overallHealthScore:** Give a score from 0-100 reflecting the overall condition. A brand new, perfect installation is 100. A system with critical damage or severe soiling would be much lower.
-   **overallAssessment:** Write a single, concise sentence summarizing the state of the array.
-   **issues:** Create a list of all identified problems. For each problem, specify its category, a clear description, its severity, and a practical recommendation. If you find no issues, return an empty array for "issues".

Analyze the following image:
{{media url=photoDataUri}}
`,
});


// 2. Define the Genkit Flow
const panelInspectionFlow = ai.defineFlow(
  {
    name: 'panelInspectionFlow',
    inputSchema: InspectionInputSchema,
    outputSchema: InspectionResultSchema,
  },
  async (input) => {
    // Call the Gemini model with the structured prompt and the user's input.
    // The 'prompt' function here is the compiled version of the `inspectionPrompt` object.
    const { output } = await inspectionPrompt(input);

    // If the model fails to return a structured output, throw an error.
    if (!output) {
      throw new Error("The AI model failed to return a structured analysis.");
    }
    
    // Return the structured JSON object.
    return output;
  }
);
