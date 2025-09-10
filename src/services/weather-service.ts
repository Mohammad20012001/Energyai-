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
        solarIrradiance: number; // in W/m^2
        uv: number;
    },
    forecast: {
        temperature: number;
        cloudCover: number;
        solarIrradiance: number; // in W/m^2
        uv: number;
    }
}

// Function to approximate Solar Irradiance from UV index
const getIrradianceFromUv = (uv: number): number => {
    // This is a simplified approximation.
    // A UV index of 10-11+ is roughly equivalent to 1000-1100 W/m^2 in clear sky conditions.
    // We'll use a factor of 100 as a simple approximation.
    return uv * 100;
};


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
    
    // We fetch a 1-day forecast which includes the current hour's forecast data.
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${coords.lat},${coords.lon}&days=1&aqi=no&alerts=no`;

    try {
        const response = await axios.get(url);
        const data = response.data;
        
        if (!data.current || !data.forecast || !data.forecast.forecastday[0] || !data.forecast.forecastday[0].hour) {
            throw new Error("Invalid response structure from WeatherAPI.com.");
        }

        const current_weather = data.current;
        
        // Find the forecast for the current hour
        const now = new Date();
        const currentHour = now.getHours();
        const hourly_forecasts = data.forecast.forecastday[0].hour;
        const current_hour_forecast = hourly_forecasts.find((h: any) => new Date(h.time_epoch * 1000).getHours() === currentHour) ?? hourly_forecasts[currentHour];


        const liveData = {
            temperature: current_weather.temp_c ?? 0,
            cloudCover: current_weather.cloud ?? 0,
            uv: current_weather.uv ?? 0,
            solarIrradiance: getIrradianceFromUv(current_weather.uv ?? 0),
        };

        const forecastData = {
            temperature: current_hour_forecast.temp_c ?? 0,
            cloudCover: current_hour_forecast.cloud ?? 0,
            uv: current_hour_forecast.uv ?? 0,
            solarIrradiance: getIrradianceFromUv(current_hour_forecast.uv ?? 0),
        };

        return {
            current: {
                temperature: parseFloat(liveData.temperature.toFixed(1)),
                cloudCover: parseFloat(liveData.cloudCover.toFixed(1)),
                solarIrradiance: parseFloat(liveData.solarIrradiance.toFixed(1)),
                uv: liveData.uv
            },
            forecast: {
                temperature: parseFloat(forecastData.temperature.toFixed(1)),
                cloudCover: parseFloat(forecastData.cloudCover.toFixed(1)),
                solarIrradiance: parseFloat(forecastData.solarIrradiance.toFixed(1)),
                uv: forecastData.uv
            }
        };
    } catch (error) {
        console.error("Error fetching weather data from WeatherAPI.com:", error);
        throw new Error("Failed to fetch live weather data. Please check your network connection or API key.");
    }
}
