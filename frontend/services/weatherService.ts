/**
 * Harvest Oracle: Weather Service
 * Provides mock forecast data for maturity and risk calculations.
 */

export interface WeatherDay {
    date: string;
    max_temp: number;
    min_temp: number;
    rain_mm: number;
    condition: string;
}

/**
 * Fetches a 7-day weather forecast.
 * In production, this would call the IMD or OpenWeather API.
 */
export async function getWeatherForecast(lat: number, lon: number): Promise<WeatherDay[]> {
    const today = new Date();
    const forecast: WeatherDay[] = [];

    const conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Heavy Rain"];

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        forecast.push({
            date: dateStr,
            max_temp: 30 + Math.floor(Math.random() * 12), // 30-42C
            min_temp: 20 + Math.floor(Math.random() * 5),
            rain_mm: Math.random() < 0.2 ? Math.floor(Math.random() * 50) : 0, // 20% chance of rain
            condition: conditions[Math.floor(Math.random() * conditions.length)]
        });
    }

    return forecast;
}
