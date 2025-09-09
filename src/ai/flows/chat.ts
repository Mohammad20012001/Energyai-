'use server';

/**
 * @fileOverview A conversational agent that can use tools to answer questions about solar panel installation.
 */

import {ai} from '@/ai/genkit';
import {
  suggestStringConfiguration,
  SuggestStringConfigurationInput,
  SuggestStringConfigurationOutputSchema,
} from './suggest-string-config';
import {
  suggestWireSize,
  SuggestWireSizeInput,
  SuggestWireSizeOutputSchema,
} from './suggest-wire-size';
import {z} from 'zod';

// Define tools that the agent can use.
const getStringConfig = ai.defineTool(
  {
    name: 'suggestStringConfiguration',
    description:
      'Suggests the optimal configuration of solar panels in strings and parallel strings based on system requirements. Use this when the user asks about panel configuration, stringing, or how to connect panels.',
    input: {schema: SuggestStringConfigurationInput},
    output: {schema: SuggestStringConfigurationOutputSchema},
  },
  async input => suggestStringConfiguration(input)
);

const getWireSize = ai.defineTool(
  {
    name: 'suggestWireSize',
    description:
      'Suggests the optimal wire size (in mm²) for a solar panel system based on current, voltage, distance, and allowed voltage drop. Use this when the user asks about wire gauge, cable size, or voltage drop.',
    input: {schema: SuggestWireSizeInput},
    output: {schema: SuggestWireSizeOutputSchema},
  },
  async input => suggestWireSize(input)
);

const ChatHistorySchema = z.array(
  z.object({
    role: z.enum(['user', 'model']),
    content: z.array(
      z.object({
        text: z.string(),
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
      tools: [getStringConfig, getWireSize],
      prompt: prompt,
      history: history,
      config: {
        // Instruct the model to use a system prompt.
        // The exact instructions for how to use the system prompt are model-dependent.
        systemPrompt: `You are a helpful AI assistant for solar panel installers in Jordan. Your responses should be in Arabic.
        When a user asks a question, use the available tools to provide a precise and helpful answer.
        Do not make up answers. If you don't have a tool for a specific question, politely state that you cannot answer it.`,
      },
    });

    const output = result.output;
    if (!output) {
      return 'No response from model.';
    }

    if (output.content.every(part => part.toolRequest)) {
      const toolResponseParts = await Promise.all(
        output.content.map(async part => {
          if (!part.toolRequest) {
            return;
          }
          const tool = ai.lookupTool(part.toolRequest.name);
          const toolResult = await tool(part.toolRequest.input);
          return {
            toolResponse: {
              name: part.toolRequest.name,
              output: toolResult,
            },
          };
        })
      );
      const finalResult = await ai.generate({
        model: llm,
        prompt: {
          role: 'user',
          content: [{text: prompt}],
        },
        history: [
          ...history,
          {
            role: 'model',
            content: output.content,
          },
          {
            role: 'tool',
            content: toolResponseParts,
          },
        ],
      });
      return finalResult.text;
    } else {
      return result.text;
    }
  }
);
