'use server';

import {conversationalAgent} from '@/ai/flows/chat';
import {z} from 'zod';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(
    z.object({
      text: z.string(),
    })
  ),
});

const ChatRequestSchema = z.object({
  history: z.array(ChatMessageSchema),
  prompt: z.string(),
});

export async function sendMessage(
  request: z.infer<typeof ChatRequestSchema>
): Promise<{text: string}> {
  const {history, prompt} = ChatRequestSchema.parse(request);
  const result = await conversationalAgent({history, prompt});
  return {text: result};
}
