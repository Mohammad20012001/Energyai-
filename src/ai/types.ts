import { z } from 'genkit';
import { SimulatePerformanceInputSchema, SimulatePerformanceOutputSchema } from '@/ai/tool-schemas';


// Input schema for the simulation
// Note: The main schema is now in tool-schemas.ts, this is just for type inference.
export type SimulatePerformanceInput = z.infer<typeof SimulatePerformanceInputSchema>;


// Output schema for a single data point in the simulation
// Note: The main schema is now in tool-schemas.ts, this is for type inference and extending it for the UI.
export const SimulationDataPointSchema = SimulatePerformanceOutputSchema.extend({
  // Live Data
  liveTemperature: z.number().describe('Live ambient temperature in degrees Celsius.'),
  liveCloudCover: z.number().describe('Live cloud cover percentage (0-100).'),
  
  // Forecast Data
  forecastUvIndex: z.number().describe('Forecasted UV index from the weather service.'),
  forecastTemperature: z.number().describe('Forecasted ambient temperature in degrees Celsius for the same instant.'),
  forecastCloudCover: z.number().describe('Forecasted cloud cover percentage (0-100) for the same instant.'),
});
export type SimulationDataPoint = z.infer<typeof SimulationDataPointSchema>;
