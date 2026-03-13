// Hashing Engine for Phase 8

export interface ProvenanceRecord {
    userId: string;
    timestamp: string;
    location: {
        lat: number;
        lng: number;
    };
    qualityScore: number;
    decayStatus: number; // Q10 status
    crop: string;
}

/**
 * Generates a SHA-256 hash for a provenance record to ensure data integrity.
 */
export async function generateProvenanceHash(record: ProvenanceRecord): Promise<string> {
    const dataString = JSON.stringify({
        u: record.userId,
        t: record.timestamp,
        l: record.location,
        q: record.qualityScore,
        d: record.decayStatus,
        c: record.crop
    });

    // Using the SubtleCrypto API (Browser & Edge Runtime compatible)
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert buffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
}

/**
 * Stores the hash in the local cache for offline accessibility.
 */
export function cacheProvenanceHash(hash: string, record: ProvenanceRecord) {
    if (typeof window !== 'undefined') {
        const key = `provenance_${hash}`;
        localStorage.setItem(key, JSON.stringify({
            hash,
            record,
            created_at: new Date().toISOString()
        }));
    }
}
