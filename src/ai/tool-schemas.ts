import {z} from 'genkit';

export const SuggestStringConfigurationInputSchema = z.object({
  panelVoltage: z.number().describe('جهد اللوح الشمسي الواحد (فولت).'),
  panelCurrent: z.number().describe('تيار اللوح الشمسي الواحد (أمبير).'),
  desiredVoltage: z.number().describe('الجهد الإجمالي المطلوب للنظام (فولت).'),
  desiredCurrent: z.number().describe('التيار الإجمالي المطلوب للنظام (أمبير).'),
});
export type SuggestStringConfigurationInput = z.infer<
  typeof SuggestStringConfigurationInputSchema
>;

export const SuggestStringConfigurationOutputSchema = z.object({
  panelsPerString: z
    .number()
    .describe('العدد الموصى به من الألواح لتوصيلها على التوالي لكل سلسلة.'),
  parallelStrings: z
    .number()
    .describe('العدد الموصى به من السلاسل المتوازية للتوصيل.'),
  commonWiringErrors: z
    .string()
    .describe(
      'أخطاء التوصيل الشائعة التي يجب تجنبها، بناءً على التهيئة المقترحة.'
    ),
});
export type SuggestStringConfigurationOutput = z.infer<
  typeof SuggestStringConfigurationOutputSchema
>;

export const SuggestWireSizeInputSchema = z.object({
  current: z.number().describe('تيار النظام (أمبير).'),
  voltage: z.number().describe('جهد النظام (فولت).'),
  distance: z.number().describe('طول السلك بالمتر (اتجاه واحد).'),
  voltageDropPercentage: z
    .number()
    .describe('النسبة المئوية لهبوط الجهد المسموح به (%).'),
});
export type SuggestWireSizeInput = z.infer<typeof SuggestWireSizeInputSchema>;

export const SuggestWireSizeOutputSchema = z.object({
  recommendedWireSizeMM2: z
    .number()
    .describe('مقطع السلك الموصى به بوحدة mm²'),
  voltageDrop: z.number().describe('قيمة هبوط الجهد الفعلية بالفولت.'),
  powerLoss: z.number().describe('قيمة الطاقة المفقودة بالواط.'),
  reasoning: z
    .string()
    .describe(
      'شرح مفصل باللغة العربية عن سبب اختيار هذا المقطع، وأهمية اختيار الحجم الصحيح، والمخاطر المترتبة على استخدام مقطع أصغر.'
    ),
});
export type SuggestWireSizeOutput = z.infer<typeof SuggestWireSizeOutputSchema>;
