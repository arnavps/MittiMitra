/**
 * Harvest Oracle: Supply-Gap Analysis Module
 * Aggregates regional maturity dates to identify market gluts.
 */

export interface ClusterMaturityPoint {
    date: string;
    farmerCount: number;
    projectedYield: number;
    isSyncPanic: boolean;
}

/**
 * Mocks querying the database for all users in the same cluster.
 * Identifies 'Sync-Panic' zones: Days where >20% of the cluster harvests.
 */
export async function getClusterMaturityHeatmap(
    pinCode: string,
    totalClusterSize: number = 200
): Promise<ClusterMaturityPoint[]> {
    // In production, this would be a Supabase query with aggregation
    // SELECT harvest_date, count(*), sum(yield) FROM farm_sessions WHERE pin = ? GROUP BY harvest_date
    
    const today = new Date();
    const heatmap: ClusterMaturityPoint[] = [];

    for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        // Randomly generate some cluster data for the mock
        const farmerCount = Math.floor(Math.random() * 50);
        const projectedYield = farmerCount * 40; // avg 40qtl per farmer
        
        // Panic Threshold: >20% of totalClusterSize
        const isSyncPanic = farmerCount > (totalClusterSize * 0.2);

        heatmap.push({
            date: dateStr,
            farmerCount,
            projectedYield,
            isSyncPanic
        });
    }

    return heatmap;
}

/**
 * Identifies the first "Sync-Panic" date in the forecast.
 */
export function detectFirstPanicZone(heatmap: ClusterMaturityPoint[]): ClusterMaturityPoint | null {
    return heatmap.find(point => point.isSyncPanic) || null;
}
