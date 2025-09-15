import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export interface WeatherPoint {
    time?: string; // Optional time for forecast points
    temperature: number;
    cloudCover: number;
    uvIndex: number;
}

export interface WeatherData {
    current: WeatherPoint,
    forecast: WeatherPoint[], // Changed to an array of hourly forecast points
}

export interface HistoricalDataPoint {
    month: number;
    total_irrad_Wh_m2: number; // This value is actually in kWh/m²/day
}


/**
 * Fetches live and 24-hour forecast weather data for a given location from WeatherAPI.com.
 * @param lat The latitude of the location.
 * @param lon The longitude of the location.
 * @returns A promise that resolves to the live and forecast weather data.
 */
export async function getLiveAndForecastWeatherData(lat: number, lon: number): Promise<WeatherData> {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
        console.error("WeatherAPI.com API key is missing. Please add WEATHER_API_KEY to your .env file.");
        throw new Error("WeatherAPI.com API key is not configured.");
    }
    
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=1&aqi=no&alerts=no`;

    try {
        const response = await axios.get(url);
        const data = response.data;
        
        if (!data.current || !data.forecast || !data.forecast.forecastday[0] || !data.forecast.forecastday[0].hour) {
            throw new Error("Invalid response structure from WeatherAPI.com.");
        }

        const current_weather = data.current;
        const hourly_forecasts = data.forecast.forecastday[0].hour;

        return {
            current: {
                temperature: parseFloat(current_weather.temp_c?.toFixed(1) ?? "0"),
                cloudCover: parseFloat(current_weather.cloud?.toFixed(1) ?? "0"),
                uvIndex: parseFloat(current_weather.uv?.toFixed(1) ?? "0"),
            },
            forecast: hourly_forecasts.map((h: any) => ({
                time: h.time,
                temperature: parseFloat(h.temp_c?.toFixed(1) ?? "0"),
                cloudCover: parseFloat(h.cloud?.toFixed(1) ?? "0"),
                uvIndex: parseFloat(h.uv?.toFixed(1) ?? "0"),
            }))
        };
    } catch (error) {
        console.error("Error fetching weather data from WeatherAPI.com:", error);
        throw new Error("Failed to fetch live weather data. Please check your network connection or API key.");
    }
}


/**
 * Fetches historical daily solar irradiation data for each month of the past year from WeatherAPI.com.
 * This function makes 12 API calls to get a representative day for each month.
 * 
 * @param lat The latitude of the location.
 * @param lon The longitude of the location.
 * @returns A promise that resolves to an array of historical data points for each month.
 */
export async function getHistoricalWeatherForYear(lat: number, lon: number): Promise<HistoricalDataPoint[]> {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
        throw new Error("WeatherAPI.com API key is not configured.");
    }
    
    const today = new Date();
    const promises: Promise<any>[] = [];

    // Create a promise for each of the last 12 months, fetching data for the 15th of each month.
    for (let i = 0; i < 12; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 15);
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const url = `https://api.weatherapi.com/v1/history.json?key=${apiKey}&q=${lat},${lon}&dt=${dateString}`;
        promises.push(axios.get(url));
    }

    try {
        const responses = await Promise.all(promises);
        
        const monthlyData: HistoricalDataPoint[] = [];

        responses.forEach(response => {
            const forecastDay = response.data.forecast?.forecastday?.[0];
            if (forecastDay && forecastDay.day) {
                // The API provides total_irrad_Wh_m2. To get kWh/m²/day (PSSH), we divide by 1000.
                const dailyIrradiationKWh = (forecastDay.day.total_irrad_Wh_m2 ?? 0) / 1000;
                const date = new Date(forecastDay.date);
                const month = date.getMonth(); // 0 for January, 11 for December

                monthlyData.push({
                    month: month,
                    total_irrad_Wh_m2: parseFloat(dailyIrradiationKWh.toFixed(2)),
                });
            }
        });
        
        // Ensure we have data for all 12 months, even if some API calls failed, to prevent crashes.
        const completeData: HistoricalDataPoint[] = [];
        for (let i = 0; i < 12; i++) {
            const monthEntry = monthlyData.find(d => d.month === i);
            if (monthEntry) {
                completeData.push(monthEntry);
            } else {
                // Push a zero value if a month's data is missing
                completeData.push({ month: i, total_irrad_Wh_m2: 0 });
            }
        }
        
        // Sort data by month (January = 0, December = 11) to ensure correct order
        completeData.sort((a, b) => a.month - b.month);
        
        return completeData;

    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
             console.error(`Error fetching historical weather data: ${error.response.status} ${error.response.data?.error?.message}`);
             throw new Error(`Failed to fetch historical weather data: ${error.response.data?.error?.message || 'Check API Key or network.'}`);
        } else {
            console.error("Unknown error fetching historical weather data:", error);
            throw new Error("An unknown error occurred while fetching historical weather data.");
        }
    }
}
