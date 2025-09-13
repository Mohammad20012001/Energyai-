'use server';

/**
 * @fileOverview A conversational agent that can use tools to answer questions about solar panel installation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {Part} from 'genkit';

import { suggestStringConfiguration } from './suggest-string-config';
import { suggestWireSize } from './suggest-wire-size';
import { optimizeDesign } from './optimize-design';

import {
  SuggestStringConfigurationInputSchema,
  SuggestStringConfigurationOutputSchema,
  SuggestWireSizeInputSchema,
  SuggestWireSizeOutputSchema,
  OptimizeDesignInputSchema,
  OptimizeDesignOutputSchema,
} from '@/ai/tool-schemas';


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

const optimizeDesignTool = ai.defineTool(
    {
        name: 'optimizeDesign',
        description: 'Designs an entire solar PV system from scratch based on user constraints like budget, area, and electricity bill. Use this for general, high-level questions about system design or "what system should I get?".',
        inputSchema: OptimizeDesignInputSchema,
        outputSchema: OptimizeDesignOutputSchema,
    },
    async (input) => optimizeDesign(input)
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
      tools: [suggestStringConfigurationTool, suggestWireSizeTool, optimizeDesignTool],
      prompt: prompt,
      history: history as any,
      config: {
        systemPrompt: `You are a helpful AI assistant for solar panel installers in Jordan. Your responses should be in Arabic.
When a user asks a question, use the available tools to provide a precise and helpful answer.
Do not make up answers. If you don't have enough information to use a tool, politely ask the user for the missing information. Do not invent missing parameters.
When you use the 'optimizeDesign' tool, present the key summary results in a friendly, readable way.

You are also an expert on Jordanian regulations for solar energy. Use the following information to answer any legal or regulatory questions.

**ملخص القوانين والتشريعات الأردنية للطاقة الشمسية:**

1.  **نظام صافي القياس (Net-Metering):**
    *   **المبدأ:** يسمح للمستهلكين (منازل، محلات) بتركيب نظام طاقة شمسية لتغطية استهلاكهم الخاص. الكهرباء الفائضة عن الحاجة يتم تصديرها إلى الشبكة العامة وتسجل كرصيد للمستهلك.
    *   **المقاصة:** يتم إجراء مقاصة شهرية. إذا كان الاستهلاك من الشبكة أكبر من الإنتاج، يدفع المستهلك الفرق. إذا كان الإنتاج أكبر، يتم تدوير الرصيد للشهر التالي. تتم تصفية الرصيد سنويًا.
    *   **حجم النظام:** يجب أن لا يتجاوز إنتاج النظام استهلاك السنة السابقة للمستهلك. الهدف هو تغطية الاستهلاك وليس التجارة.
    *   **الجهات المسؤولة:** هيئة تنظيم قطاع الطاقة والمعادن (EMRC) وشركات توزيع الكهرباء (JEPCO, IDECO, EDCO).

2.  **نظام النقل بالعبور (Wheeling):**
    *   **المبدأ:** يسمح بتوليد الكهرباء من نظام طاقة متجددة في موقع معين، واستهلاكها في موقع آخر تابع لنفس الشخص أو الشركة.
    *   **لمن هو؟** يستخدم بشكل أساسي للمصانع والشركات والمؤسسات الكبيرة التي قد لا تملك مساحة كافية للتركيب في موقع الاستهلاك.
    *   **رسوم النقل:** يتم دفع رسوم رمزية لشركة الكهرباء مقابل استخدام شبكتها لنقل الطاقة.
    *   **متطلبات:** يتطلب موافقات خاصة من هيئة تنظيم قطاع الطاقة والمعادن.

3.  **متطلبات الربط على الشبكة (Grid Connection):**
    *   **تقديم الطلب:** يجب تقديم طلب لشركة توزيع الكهرباء المعنية مع كافة الوثائق الفنية (مخططات، مواصفات مكونات).
    *   **المكونات المعتمدة:** يجب أن تكون جميع المكونات (الألواح، العاكسات) معتمدة ومطابقة للمواصفات الأردنية وضمن القوائم المعتمدة من هيئة التنظيم.
    *   **الفحص الفني:** بعد التركيب، تقوم شركة الكهرباء بفحص فني للموقع للتأكد من مطابقته للمواصفات وشروط السلامة العامة.
    *   **تركيب العداد:** يتم استبدال العداد الحالي بعداد "صافي قياس" (Net Meter) قادر على قياس الطاقة المستهلكة والمصدرة.

4.  **نقاط عامة:**
    *   **أنظمة خارج الشبكة (Off-Grid):** مسموحة ولا تتطلب موافقات الربط، لكنها تخضع لمعايير السلامة العامة.
    *   **بيع الكهرباء مباشرة:** بيع الكهرباء مباشرة من المنتج إلى المستهلك غير مسموح به إلا في حالات خاصة جدًا وضمن تشريعات محددة للمشاريع الكبيرة (IPP).`,
      },
    });

    const choice = result.choices[0];
    
    // Check if the model decided to use a tool
    if (choice.finishReason === 'toolCode' && choice.toolRequest) {
        const toolRequest = choice.toolRequest;
        
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
