'use server';

/**
 * @fileOverview A conversational agent that can use tools to answer questions about solar panel installation.
 */

import {ai} from '@/ai/genkit';
import {
  suggestStringConfiguration,
} from './suggest-string-config';
import {
  suggestWireSize,
} from './suggest-wire-size';
import {
  SuggestStringConfigurationInputSchema,
  SuggestStringConfigurationOutputSchema,
  SuggestWireSizeInputSchema,
  SuggestWireSizeOutputSchema
} from '@/ai/tool-schemas';
import {z} from 'zod';
import {Part} from 'genkit';

// Define tools that the agent can use.
const suggestStringConfigurationTool = ai.defineTool(
  {
    name: 'suggestStringConfiguration',
    description:
      'Suggests the optimal configuration of solar panels in strings and parallel strings based on system requirements. Use this when the user asks about panel configuration, stringing, or how to connect panels.',
    inputSchema: SuggestStringConfigurationInputSchema,
    outputSchema: SuggestStringConfigurationOutputSchema,
  },
  async input => suggestStringConfiguration(input)
);

const suggestWireSizeTool = ai.defineTool(
  {
    name: 'suggestWireSize',
    description:
      'Suggests the optimal wire size (in mm²) for a solar panel system based on current, voltage, distance, and allowed voltage drop. Use this when the user asks about wire gauge, cable size, or voltage drop.',
    inputSchema: SuggestWireSizeInputSchema,
    outputSchema: SuggestWireSizeOutputSchema,
  },
  async input => suggestWireSize(input)
);

const ChatHistorySchema = z.array(
  z.object({
    role: z.enum(['user', 'model', 'tool']),
    content: z.array(
      z.object({
        text: z.string().optional(),
        toolRequest: z.any().optional(),
        toolResponse: z.any().optional(),
      })
    ),
  })
);

export const conversationalAgent = ai.defineFlow(
  {
    name: 'conversationalAgent',
    inputSchema: z.object({
      history: ChatHistorySchema,
      prompt: z.string(),
    }),
    outputSchema: z.string(),
  },
  async ({history, prompt}) => {
    const llm = ai.model('googleai/gemini-2.5-flash');

    const result = await ai.generate({
      model: llm,
      tools: [suggestStringConfigurationTool, suggestWireSizeTool],
      prompt: prompt,
      history: history as any, // Cast to any to handle the wider type from the API
      config: {
        systemPrompt: `You are a helpful AI assistant for solar panel installers in Jordan. Your responses should be in Arabic.
        When a user asks a question, use the available tools to provide a precise and helpful answer.
        Do not make up answers. If you don't have a tool for a specific question, or if you don't have enough information to use a tool, politely ask the user for the missing information. Do not invent missing parameters.`,
      },
    });

    const choice = result.choices[0];
    
    // Check if the model decided to use a tool
    if (choice.finishReason === 'toolCode') {
        const toolRequest = choice.toolRequest;
        if (!toolRequest) {
            // This should not happen if finishReason is toolCode
            return "حدث خطأ أثناء محاولة استخدام الأداة.";
        }

        console.log('Executing tool:', toolRequest.name, 'with input:', toolRequest.input);
        const tool = ai.lookupTool(toolRequest.name);
        if (!tool) {
            throw new Error(`Tool ${toolRequest.name} not found.`);
        }
        const toolResult = await tool(toolRequest.input);

        const toolResponsePart: Part = {
          toolResponse: {
            name: toolRequest.name,
            output: toolResult,
          },
        };

        // We need to add the original model response (with tool_code) and the tool response to history
        const newHistory = [
            ...history,
            { role: 'user' as const, content: [{text: prompt}] },
            { role: 'model' as const, content: choice.message.content },
            { role: 'tool' as const, content: [toolResponsePart] }
        ];

        // Let the model generate a final response based on the tool's output
        const finalResult = await ai.generate({
            model: llm,
            history: newHistory as any, // Cast to any to handle the wider type
        });
        
        return finalResult.text;
    } else {
        // If no tool was used, just return the text response
        return choice.text;
    }
  }
);
