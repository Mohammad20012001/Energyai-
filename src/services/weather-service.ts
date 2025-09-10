import axios from 'axios';

// Coordinates for major Jordanian cities
const locations: Record<string, { lat: number; lon: number }> = {
    amman: { lat: 31.9539, lon: 35.9106 },
    zarqa: { lat: 32.087, lon: 36.0962 },
    irbid: { lat: 32.556, lon: 35.85 },
    aqaba: { lat: 29.532, lon: 35.0069 },
};

interface WeatherData {
    temperature: number;
    cloudCover: number;
    solarIrradiance: number; // in W/m^2
}

/**
 * Fetches live weather data for a given location.
 * @param location A string representing one of the predefined Jordanian cities.
 * @returns A promise that resolves to the live weather data.
 */
export async function getLiveWeatherData(location: string): Promise<WeatherData> {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey || apiKey === "") {
        console.error("OpenWeatherMap API key is missing. Please add OPENWEATHER_API_KEY to your .env file.");
        throw new Error("OpenWeatherMap API key is not configured. Please add it to the .env file to run the live simulation.");
    }

    const coords = locations[location.toLowerCase()];
    if (!coords) {
        throw new Error(`Location '${location}' is not supported. Supported locations are: Amman, Zarqa, Irbid, Aqaba.`);
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric`;

    try {
        const response = await axios.get(url);
        const data = response.data;

        const temperature = data.main.temp;
        const cloudCover = data.clouds.all; // Percentage

        // Estimate Solar Irradiance (GHI)
        // This is a simplified estimation. A more accurate model would use DNI/DHI if the API provided it.
        // Formula: GHI = G_clear * (1 - 0.75 * (cloudCover/100)^3)
        // G_clear is the clear-sky irradiance, which depends on the sun's angle.
        
        const sunAngle = calculateSunAngle(coords.lat, coords.lon);
        const clearSkyIrradiance = 990 * Math.sin(sunAngle * (Math.PI / 180)); // Max irradiance is ~990 W/m^2 at the equator
        
        let solarIrradiance = 0;
        if (clearSkyIrradiance > 0) {
            solarIrradiance = clearSkyIrradiance * (1 - 0.75 * Math.pow(cloudCover / 100, 3));
        }

        return {
            temperature: parseFloat(temperature.toFixed(1)),
            cloudCover: parseFloat(cloudCover.toFixed(1)),
            solarIrradiance: parseFloat(solarIrradiance.toFixed(1)),
        };
    } catch (error) {
        console.error("Error fetching weather data from OpenWeatherMap:", error);
        throw new Error("Failed to fetch live weather data. Please check your API key and network connection.");
    }
}

/**
 * Calculates the approximate angle of the sun in the sky.
 * This is a simplified calculation for demonstration purposes.
 * @returns Sun elevation angle in degrees.
 */
function calculateSunAngle(latitude: number, longitude: number): number {
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    
    // Simplified declination angle calculation
    const declination = -23.45 * Math.cos((2 * Math.PI / 365) * (dayOfYear + 10));

    const lst = (now.getUTCHours() + longitude / 15) * 15;
    const hourAngle = lst - 180;

    const latRad = latitude * (Math.PI / 180);
    const declRad = declination * (Math.PI / 180);
    const haRad = hourAngle * (Math.PI / 180);

    const elevationRad = Math.asin(
        Math.sin(latRad) * Math.sin(declRad) +
        Math.cos(latRad) * Math.cos(declRad) * Math.cos(haRad)
    );

    const elevation = elevationRad * (180 / Math.PI);
    
    return Math.max(0, elevation); // Sun angle cannot be negative
}
