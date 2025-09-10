import axios from 'axios';

// Coordinates for major Jordanian cities
const locations: Record<string, { lat: number; lon: number }> = {
    amman: { lat: 31.95, lon: 35.91 },
    zarqa: { lat: 32.09, lon: 36.10 },
    irbid: { lat: 32.56, lon: 35.85 },
    aqaba: { lat: 29.53, lon: 35.01 },
};

interface WeatherData {
    current: {
        temperature: number;
        cloudCover: number;
        solarIrradiance: number;
    },
    forecast: {
        temperature: number;
        cloudCover: number;
        solarIrradiance: number;
    }
}

/**
 * Fetches live and forecast weather data for a given location from WeatherAPI.com.
 * @param location A string representing one of the predefined Jordanian cities.
 * @returns A promise that resolves to the live and forecast weather data.
 */
export async function getLiveAndForecastWeatherData(location: string): Promise<WeatherData> {
    const coords = locations[location.toLowerCase()];
    if (!coords) {
        throw new Error(`Location '${location}' is not supported. Supported locations are: Amman, Zarqa, Irbid, Aqaba.`);
    }

    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
        console.error("WeatherAPI.com API key is missing. Please add WEATHER_API_KEY to your .env file.");
        throw new Error("WeatherAPI.com API key is not configured.");
    }
    
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${coords.lat},${coords.lon}&days=1&aqi=no&alerts=no`;

    try {
        const response = await axios.get(url);
        const data = response.data;
        
        if (!data.current || !data.forecast || !data.forecast.forecastday[0] || !data.forecast.forecastday[0].hour) {
            throw new Error("Invalid response structure from WeatherAPI.com.");
        }

        const current_weather = data.current;
        
        const now = new Date();
        const currentHour = now.getHours();
        const hourly_forecasts = data.forecast.forecastday[0].hour;
        const current_hour_forecast = hourly_forecasts.find((h: any) => new Date(h.time_epoch * 1000).getHours() === currentHour) ?? hourly_forecasts[currentHour];

        if (!current_hour_forecast) {
            throw new Error(`Could not find forecast for the current hour (${currentHour}).`);
        }

        return {
            current: {
                temperature: parseFloat(current_weather.temp_c?.toFixed(1) ?? "0"),
                cloudCover: parseFloat(current_weather.cloud?.toFixed(1) ?? "0"),
                solarIrradiance: parseFloat(current_weather.air_quality?.['gb-defra-index']?.toFixed(1) ?? "0"),
            },
            forecast: {
                temperature: parseFloat(current_hour_forecast.temp_c?.toFixed(1) ?? "0"),
                cloudCover: parseFloat(current_hour_forecast.cloud?.toFixed(1) ?? "0"),
                solarIrradiance: parseFloat(current_hour_forecast.air_quality?.['gb-defra-index']?.toFixed(1) ?? "0"),
            }
        };
    } catch (error) {
        console.error("Error fetching weather data from WeatherAPI.com:", error);
        throw new Error("Failed to fetch live weather data. Please check your network connection or API key.");
    }
}
