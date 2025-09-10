'use server';

import {conversationalAgent} from '@/ai/flows/chat';
import {z} from 'zod';

const ContentPartSchema = z.object({
  text: z.string().optional(),
  toolRequest: z.any().optional(),
  toolResponse: z.any().optional(),
});


const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model', 'tool']),
  content: z.array(ContentPartSchema),
});

const ChatRequestSchema = z.object({
  history: z.array(ChatMessageSchema),
  prompt: z.string(),
});

export async function sendMessage(
  request: z.infer<typeof ChatRequestSchema>
): Promise<string> {
  const {history, prompt} = ChatRequestSchema.parse(request);
  const result = await conversationalAgent({history, prompt});
  return result;
}
