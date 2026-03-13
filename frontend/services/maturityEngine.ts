/**
 * Harvest Oracle: Maturity Tracking Module
 * Calculates crop ripeness using Growing Degree Days (GDD).
 */

export interface CropGDDThresholds {
    baseTemp: number; // T_base in Celsius
    totalGDD: number; // Required GDD for 100% maturity
}

const CROP_THRESHOLDS: Record<string, CropGDDThresholds> = {
    "Tomato": { baseTemp: 10, totalGDD: 1600 },
    "Onion": { baseTemp: 5, totalGDD: 1100 },
    "Wheat": { baseTemp: 4.5, totalGDD: 1550 },
    "Potato": { baseTemp: 7, totalGDD: 1300 }
};

/**
 * Calculates maturity percentage based on sowing date and temperature history.
 * In a real app, this would fetch daily max/min temps from the IMD API.
 */
export function calculateMaturityPercentage(
    sowingDate: string, 
    crop: string, 
    dailyTemps: { max: number, min: number }[]
): { percentage: number, accumulatedGDD: number } {
    const thresholds = CROP_THRESHOLDS[crop] || CROP_THRESHOLDS["Tomato"];
    let accumulatedGDD = 0;

    dailyTemps.forEach(temp => {
        const avgTemp = (temp.max + temp.min) / 2;
        const dailyGDD = Math.max(0, avgTemp - thresholds.baseTemp);
        accumulatedGDD += dailyGDD;
    });

    const percentage = Math.min(100, (accumulatedGDD / thresholds.totalGDD) * 100);
    return { percentage: Math.round(percentage), accumulatedGDD: Math.round(accumulatedGDD) };
}

/**
 * Forecasts the 100% maturity date based on 7-day weather forecast.
 */
export function predictMaturityDate(
    currentGDD: number,
    crop: string,
    forecastTemps: { max: number, min: number }[]
): string {
    const thresholds = CROP_THRESHOLDS[crop] || CROP_THRESHOLDS["Tomato"];
    const remainingGDD = thresholds.totalGDD - currentGDD;
    
    if (remainingGDD <= 0) return "Ready to Harvest";

    // Estimate daily GDD from forecast average
    const avgDailyGDD = forecastTemps.reduce((acc, curr) => {
        const avg = (curr.max + curr.min) / 2;
        return acc + Math.max(0, avg - thresholds.baseTemp);
    }, 0) / forecastTemps.length;

    const daysRemaining = Math.ceil(remainingGDD / avgDailyGDD);
    
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysRemaining);
    
    return targetDate.toISOString().split('T')[0];
}
