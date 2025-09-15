
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
 * - InspectionInputSchema: The Zod schema for the input (a data URI of the photo).
 * - InspectionResultSchema: The Zod schema for the structured output report.
 * - InspectionResult: The TypeScript type inferred from the output schema.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the schema for the input, which is just the image data URI.
const InspectionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a solar panel array, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type InspectionInput = z.infer<typeof InspectionInputSchema>;

// Define the schema for the structured JSON output we want from the AI model.
// This is the core of "structured output" and guides the model's response.
export const InspectionResultSchema = z.object({
  overallHealthScore: z.number().min(0).max(100).describe(
    "An overall health score for the solar panel array from 0 (very poor) to 100 (excellent), based on the identified issues."
  ),
  overallAssessment: z.string().describe(
    "A brief, one-sentence overall assessment of the system's condition in Arabic."
  ),
  issues: z.array(z.object({
    category: z.enum(['soiling', 'shading', 'damage', 'installation', 'other']).describe(
        "The category of the issue. 'soiling' for dirt/dust, 'shading' for shadows, 'damage' for physical harm, 'installation' for mounting/wiring issues."
    ),
    description: z.string().describe(
        "A short, specific description of the identified issue in Arabic (e.g., 'تراكم غبار متوسط على الألواح السفلية')."
    ),
    severity: z.enum(['Low', 'Medium', 'High', 'Critical']).describe(
        "The estimated severity of the issue's impact on performance or safety."
    ),
    recommendation: z.string().describe(
        "A concise, actionable recommendation in Arabic to address the issue (e.g., 'يوصى بجدولة تنظيف للألواح.')."
    ),
  })).describe("A list of all detected issues. If no issues are found, return an empty array."),
});
export type InspectionResult = z.infer<typeof InspectionResultSchema>;

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
