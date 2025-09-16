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
