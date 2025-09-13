"use server";

/**
 * @fileOverview An AI agent that acts as a mathematical auditor for solar system calculations.
 */

import { ai } from '@/ai/genkit';
import { AuditInputSchema, AuditOutputSchema, type AuditInput, type AuditOutput } from '@/ai/tool-schemas';

export async function auditCalculations(input: AuditInput): Promise<AuditOutput> {
    return auditCalculationsFlow(input);
}

const auditorPrompt = ai.definePrompt({
    name: 'calculationAuditorPrompt',
    input: { schema: AuditInputSchema },
    output: { schema: AuditOutputSchema },
    prompt: `أنت مدقق رياضي خبير متخصص في تصميم أنظمة الطاقة الشمسية المنزلية.
مهمتك هي مراجعة النص التالي الذي يحتوي على سلسلة من الحسابات المتعلقة بتصميم نظام شمسي.

**النص للمراجعة:**
---
{{{text}}}
---

**مهمتك بالتفصيل:**
1.  **مراجعة كل عملية حسابية خطوة بخطوة:** اقرأ كل سطر بعناية فائقة.
2.  **التأكد من صحة النتائج:** تحقق من صحة كل نتيجة حسابية (مثل: الاستهلاك، حجم النظام، عدد الألواح، المساحة، التكلفة، مدة الاسترداد).
3.  **تحديد وتصحيح الأخطاء:** إذا وجدت أي خطأ في الحسابات، قم بإنشاء "تصحيح" له. وضح ما هو الخطأ، وقدم الحساب الصحيح مع شرح مبسط. إذا كانت الحسابات كلها صحيحة، يجب أن تكون قائمة \`corrections\` فارغة.
4.  **تقييم شامل:** قدم تقييمًا عامًا موجزًا حول دقة الحسابات في حقل \`overallAssessment\`.
5.  **جدول النتائج الصحيحة:** قم بتجميع كل النتائج النهائية الصحيحة في جدول \`finalCorrectValues\`.

يجب أن يكون ردك باللغة العربية وأن تملأ جميع حقول كائن الإخراج بدقة.`,
});

const auditCalculationsFlow = ai.defineFlow(
    {
        name: 'auditCalculationsFlow',
        inputSchema: AuditInputSchema,
        outputSchema: AuditOutputSchema,
    },
    async (input) => {
        const { output } = await auditorPrompt(input);
        if (!output) {
            throw new Error("AI failed to generate an audit.");
        }
        return output;
    }
);
