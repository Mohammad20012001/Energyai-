import {z} from 'zod';

// #region String Configuration Schemas
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
// #endregion

// #region Wire Size Schemas
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
// #endregion

// #region Design Optimizer Schemas
export const OptimizeDesignInputSchema = z.object({
  monthlyConsumption: z.coerce.number().positive('يجب أن يكون الاستهلاك رقماً موجباً'),
  surfaceArea: z.coerce.number().positive('يجب أن تكون المساحة رقماً موجباً'),
  location: z.enum(['amman', 'zarqa', 'irbid', 'aqaba'], {required_error: 'الرجاء اختيار الموقع'}),
  systemLoss: z.coerce.number().min(0).max(99, 'نسبة الفقد يجب أن تكون بين 0 و 99'),
  panelWattage: z.coerce.number().positive('قدرة اللوح يجب أن تكون رقماً موجباً'),
});
export type OptimizeDesignInput = z.infer<typeof OptimizeDesignInputSchema>;

export const OptimizeDesignOutputSchema = z.object({
  panelConfig: z.object({
    panelCount: z.number().describe('The total number of solar panels.'),
    panelWattage: z.number().describe('The wattage of each individual panel.'),
    totalDcPower: z.number().describe('The total DC power of the panel array in kWp.'),
    requiredArea: z.number().describe('The total area required for the panels in m².'),
    tilt: z.number().describe('The recommended tilt angle for the panels in degrees.'),
    azimuth: z.number().describe('The recommended azimuth angle for the panels in degrees (e.g., 180 for South).'),
  }),
  inverterConfig: z.object({
    recommendedSize: z.string().describe('The recommended AC size of the inverter (e.g., "8 kW").'),
    phase: z.enum(['Single-Phase', 'Three-Phase']).describe('The recommended inverter phase type.'),
    mpptVoltage: z.string().describe('The recommended MPPT voltage range of the inverter (e.g., "300-800V").'),
  }),
  wiringConfig: z.object({
    panelsPerString: z.number().describe('Number of panels to be connected in each series string.'),
    parallelStrings: z.number().describe('Number of parallel strings.'),
    wireSize: z.number().describe('The recommended main DC wire size in mm².')
  }),
  reasoning: z.string().describe('A step-by-step explanation in Arabic of how the AI reached this design, explaining the trade-offs and why this design is optimal for the user\'s constraints.'),
});
export type OptimizeDesignOutput = z.infer<typeof OptimizeDesignOutputSchema>;
// #endregion

// #region Performance Simulation Schemas
export const SimulatePerformanceInputSchema = z.object({
  systemSize: z.coerce.number().positive(),
  location: z.enum(['amman', 'zarqa', 'irbid', 'aqaba']),
  panelTilt: z.coerce.number().min(0).max(90),
  panelAzimuth: z.coerce.number().min(0).max(360),
});
export type SimulatePerformanceInput = z.infer<typeof SimulatePerformanceInputSchema>;

const WeatherPointSchema = z.object({
    temperature: z.number(),
    cloudCover: z.number(),
    uvIndex: z.number(),
});

export const SimulatePerformanceOutputSchema = z.object({
  liveOutputPower: z.number().describe('The calculated output power of the system in Watts at this instant based on LIVE weather.'),
  forecastOutputPower: z.number().describe('The calculated output power of the system in Watts for the same instant based on FORECASTED weather.'),
  clearSkyOutputPower: z.number().describe('The calculated output power of the system in Watts for the same instant assuming ideal, clear sky conditions (1000 W/m^2 irradiance, 25°C).'),
  performanceAnalysis: z.string().describe('A concise, one-sentence analysis of the system\'s current performance.'),
  weather: z.object({
      current: WeatherPointSchema,
      forecast: WeatherPointSchema,
  }).describe('The full weather data object used for the simulation.'),
});
export type SimulatePerformanceOutput = z.infer<typeof SimulatePerformanceOutputSchema>;
// #endregion
