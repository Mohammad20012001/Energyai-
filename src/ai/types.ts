import { z } from 'genkit';

// Input schema for the simulation
export const SimulatePerformanceInputSchema = z.object({
  systemSize: z.coerce.number({invalid_type_error: "يجب أن يكون حجم النظام رقمًا موجبًا"}).positive("يجب أن يكون حجم النظام إيجابياً"),
  location: z.string({ required_error: "يجب اختيار الموقع" }),
  panelTilt: z.coerce.number().min(0, "زاوية الميل لا يمكن أن تكون سالبة").max(90, "زاوية الميل لا يمكن أن تتجاوز 90"),
  panelAzimuth: z.coerce.number().min(0, "زاوية الاتجاه يجب ان تكون بين 0 و 360").max(360, "زاوية الاتجاه يجب ان تكون بين 0 و 360"),
});
export type SimulatePerformanceInput = z.infer<typeof SimulatePerformanceInputSchema>;


// Output schema for a single data point in the simulation
export const SimulationDataPointSchema = z.object({
  time: z.string().describe('The current timestamp for the data point (e.g., "14:32").'),
  liveSolarIrradiance: z.number().describe('Calculated live Global Horizontal Irradiance (GHI) in W/m^2, adjusted for cloud cover.'),
  liveTemperature: z.number().describe('Live ambient temperature in degrees Celsius.'),
  liveCloudCover: z.number().describe('Live cloud cover percentage (0-100).'),
  liveOutputPower: z.number().describe('The calculated output power of the system in Watts at this instant based on LIVE weather.'),
  forecastSolarIrradiance: z.number().describe('Calculated forecasted Global Horizontal Irradiance (GHI) in W/m^2, adjusted for cloud cover.'),
  forecastTemperature: z.number().describe('Forecasted ambient temperature in degrees Celsius for the same instant.'),
  forecastCloudCover: z.number().describe('Forecasted cloud cover percentage (0-100) for the same instant.'),
  forecastOutputPower: z.number().describe('The calculated output power of the system in Watts for the same instant based on FORECASTED weather.'),
  clearSkyOutputPower: z.number().describe('The calculated output power of the system in Watts for the same instant assuming ideal, clear sky conditions (0% cloud cover).'),
});
export type SimulationDataPoint = z.infer<typeof SimulationDataPointSchema>;
