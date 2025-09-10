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
 * Fetches live weather data for a given location from Open-Meteo.
 * @param location A string representing one of the predefined Jordanian cities.
 * @returns A promise that resolves to the live weather data.
 */
export async function getLiveWeatherData(location: string): Promise<WeatherData> {
    const coords = locations[location.toLowerCase()];
    if (!coords) {
        throw new Error(`Location '${location}' is not supported. Supported locations are: Amman, Zarqa, Irbid, Aqaba.`);
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,cloud_cover,direct_normal_irradiance&timezone=auto`;

    try {
        const response = await axios.get(url);
        const data = response.data;
        
        if (!data.current) {
            throw new Error("Invalid response structure from Open-Meteo API.");
        }

        const current_weather = data.current;

        // Open-Meteo provides Direct Normal Irradiance (DNI), which is great for solar calculations.
        // We will use this directly. If it's null, we fall back to 0.
        const solarIrradiance = current_weather.direct_normal_irradiance ?? 0;
        const temperature = current_weather.temperature_2m ?? 0;
        const cloudCover = current_weather.cloud_cover ?? 0;

        return {
            temperature: parseFloat(temperature.toFixed(1)),
            cloudCover: parseFloat(cloudCover.toFixed(1)),
            solarIrradiance: parseFloat(solarIrradiance.toFixed(1)),
        };
    } catch (error) {
        console.error("Error fetching weather data from Open-Meteo:", error);
        throw new Error("Failed to fetch live weather data. Please check your network connection.");
    }
}
