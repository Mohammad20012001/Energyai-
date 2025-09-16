

      
import {z} from 'zod';

// #region String Configuration Schemas
export const SuggestStringConfigurationInputSchema = z.object({
  // Panel Specs
  vmp: z.number().describe("الجهد عند أقصى قدرة (Vmp) للوح الواحد."),
  imp: z.number().describe("التيار عند أقصى قدرة (Imp) للوح الواحد."),
  voc: z.number().describe("جهد الدائرة المفتوحة (Voc) للوح الواحد."),
  isc: z.number().describe("تيار الدائرة القصيرة (Isc) للوح الواحد."),
  tempCoefficient: z.number().describe("معامل الحرارة للجهد، كنسبة مئوية لكل درجة مئوية (e.g., -0.32)."),
  panelWattage: z.number().describe("قدرة اللوح الواحد بالواط."),

  // Inverter Specs
  mpptMin: z.number().describe("الحد الأدنى لجهد تشغيل MPPT للعاكس."),
  mpptMax: z.number().describe("الحد الأقصى لجهد تشغيل MPPT للعاكس."),
  inverterMaxVolt: z.number().describe("الحد الأقصى لجهد الدخل الذي يتحمله العاكس."),
  inverterMaxCurrent: z.number().describe("الحد الأقصى لتيار الدخل الذي يتحمله العاكس."),
  
  // Environmental & System Specs
  minTemp: z.number().describe("أدنى درجة حرارة متوقعة في الموقع (شتاءً)."),
  maxTemp: z.number().describe("أقصى درجة حرارة متوقعة على سطح الألواح (صيفًا)."),
  targetSystemSize: z.number().describe("حجم النظام الإجمالي المستهدف بالكيلوواط (kWp)."),
});
export type SuggestStringConfigurationInput = z.infer<
  typeof SuggestStringConfigurationInputSchema
>;

export const SuggestStringConfigurationOutputSchema = z.object({
  minPanels: z.number().describe("الحد الأدنى لعدد الألواح في السلسلة لضمان بقاء الجهد ضمن نطاق MPPT في أقصى درجات الحرارة."),
  maxPanels: z.number().describe("الحد الأقصى لعدد الألواح في السلسلة لضمان عدم تجاوز أقصى جهد يتحمله العاكس في أدنى درجات الحرارة."),
  optimalPanels: z.number().describe("العدد الموصى به من الألواح في السلسلة لتحقيق أفضل أداء."),
  reasoning: z.string().describe("شرح باللغة العربية يوضح سبب هذا النطاق، مع الأخذ بعين الاعتبار تأثيرات درجة الحرارة على الجهد."),
  maxStringVocAtMinTemp: z.number().describe("الجهد المحسوب للسلسلة ذات العدد الأقصى من الألواح عند أدنى درجة حرارة."),
  minStringVmpAtMaxTemp: z.number().describe("الجهد المحسوب للسلسلة ذات العدد الأدنى من الألواح عند أقصى درجة حرارة."),
  arrayConfig: z.object({
    totalPanels: z.number().describe("العدد الإجمالي للألواح المطلوبة لتحقيق حجم النظام المستهدف."),
    parallelStrings: z.number().describe("عدد السلاسل المتوازية اللازمة."),
    totalCurrent: z.number().describe("التيار الإجمالي للمصفوفة (معامل أمان 1.25 مطبق)."),
    isCurrentSafe: z.boolean().describe("ما إذا كان التيار الإجمالي للمصفوفة ضمن الحد الآمن للعاكس."),
  }).describe("تكوين المصفوفة الكاملة بناءً على حجم النظام المستهدف."),
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
  costPerWatt: z.coerce.number().positive("التكلفة يجب أن تكون رقماً موجباً"),
  kwhPrice: z.coerce.number().positive("السعر يجب أن يكون رقماً موجباً"),
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
  financialAnalysis: z.object({
    totalInvestment: z.number().describe('The total estimated cost of the system in JOD.'),
    annualRevenue: z.number().describe('The estimated annual savings or revenue in JOD.'),
    paybackPeriodYears: z.number().describe('The estimated time to recoup the investment in years.'),
    netProfit25Years: z.number().describe('The estimated net profit over a 25-year lifespan in JOD.'),
  }),
  reasoning: z.string().describe('A step-by-step explanation in Arabic of how the AI reached this design, explaining the trade-offs and why this design is optimal for the user\'s constraints.'),
  limitingFactor: z.enum(['consumption', 'area']).describe('The primary constraint that determined the final system size.'),
});
export type OptimizeDesignOutput = z.infer<typeof OptimizeDesignOutputSchema>;
// #endregion

// #region Performance Simulation Schemas
export const SimulatePerformanceInputSchema = z.object({
  systemSize: z.coerce.number().positive(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  panelTilt: z.coerce.number().min(0).max(90),
  panelAzimuth: z.coerce.number().min(0).max(360),
  kwhPrice: z.coerce.number().positive("يجب أن يكون السعر إيجابياً"),
});
export type SimulatePerformanceInput = z.infer<typeof SimulatePerformanceInputSchema>;

const WeatherPointSchema = z.object({
    time: z.string().optional(),
    temperature: z.number(),
    cloudCover: z.number(),
    uvIndex: z.number(),
});

const DailyForecastSchema = z.object({
    totalProductionKwh: z.number(),
    totalRevenue: z.number(),
    chartData: z.array(z.object({
        time: z.string(),
        power: z.number(),
    })),
});


export const SimulatePerformanceOutputSchema = z.object({
  liveOutputPower: z.number().describe('The calculated output power of the system in Watts at this instant based on LIVE weather.'),
  forecastOutputPower: z.number().describe('The calculated output power of the system in Watts for the same instant based on FORECASTED weather.'),
  clearSkyOutputPower: z.number().describe('The calculated output power of the system in Watts for the same instant assuming ideal, clear sky conditions (1000 W/m^2 irradiance, 25°C).'),
  performanceAnalysis: z.string().describe('A concise, one-sentence analysis of the system\'s current performance.'),
  weather: z.object({
      current: WeatherPointSchema,
      forecast: z.array(WeatherPointSchema),
  }).describe('The full weather data object used for the simulation.'),
  dailyForecast: DailyForecastSchema.optional().describe('The calculated forecast for the entire day, including total production, revenue, and data for the forecast chart.'),
});
export type SimulatePerformanceOutput = z.infer<typeof SimulatePerformanceOutputSchema>;
// #endregion

// #region Panel Inspection Schemas
export const InspectionInputSchema = z.object({
  photoDataUris: z.array(z.string())
    .describe(
      "An array of photos of a solar panel array, as data URIs. Each must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type InspectionInput = z.infer<typeof InspectionInputSchema>;

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

// Define the return type for the server action
export type InspectionResponse = 
    | { success: true; data: InspectionResult }
    | { success: false; error: string };
// #endregion

    

    


