import axios from 'axios';

// Coordinates for major Jordanian cities
const locations: Record<string, { lat: number; lon: number }> = {
    amman: { lat: 31.95, lon: 35.91 },
    zarqa: { lat: 32.09, lon: 36.10 },
    irbid: { lat: 32.56, lon: 35.85 },
    aqaba: { lat: 29.53, lon: 35.01 },
};

interface WeatherData {
    temperature: number;
    cloudCover: number;
    solarIrradiance: number; // in W/m^2
}

/**
 * Fetches live weather data for a given location from WeatherAPI.com.
 * @param location A string representing one of the predefined Jordanian cities.
 * @returns A promise that resolves to the live weather data.
 */
export async function getLiveWeatherData(location: string): Promise<WeatherData> {
    const coords = locations[location.toLowerCase()];
    if (!coords) {
        throw new Error(`Location '${location}' is not supported. Supported locations are: Amman, Zarqa, Irbid, Aqaba.`);
    }

    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
        console.error("WeatherAPI.com API key is missing. Please add WEATHER_API_KEY to your .env file.");
        throw new Error("WeatherAPI.com API key is not configured.");
    }
    
    const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${coords.lat},${coords.lon}`;

    try {
        const response = await axios.get(url);
        const data = response.data;
        
        if (!data.current) {
            throw new Error("Invalid response structure from WeatherAPI.com.");
        }

        const current_weather = data.current;

        // WeatherAPI.com provides a UV index. We can approximate Solar Irradiance from it.
        // A UV index of 10-11 is roughly equivalent to 1000-1100 W/m^2 in clear sky conditions.
        // We'll use a factor of 100 as a simple approximation.
        const solarIrradiance = current_weather.uv ? current_weather.uv * 100 : 0; 
        const temperature = current_weather.temp_c ?? 0;
        const cloudCover = current_weather.cloud ?? 0;

        return {
            temperature: parseFloat(temperature.toFixed(1)),
            cloudCover: parseFloat(cloudCover.toFixed(1)),
            solarIrradiance: parseFloat(solarIrradiance.toFixed(1)),
        };
    } catch (error) {
        console.error("Error fetching weather data from WeatherAPI.com:", error);
        throw new Error("Failed to fetch live weather data. Please check your network connection or API key.");
    }
}
