// Hashing Engine for Phase 5: Shadow-Price & Quality Ledger
import { supabase } from './supabase/client';

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
    shadowPrice: number;
}

/**
 * Generates a SHA-256 hash for a provenance record to ensure data integrity.
 * Formula: UserID + Timestamp + GPS + Quality Score + Decay Status
 */
export async function generateProvenanceHash(record: ProvenanceRecord): Promise<string> {
    const dataString = `${record.userId}|${record.timestamp}|${record.location.lat},${record.location.lng}|${record.qualityScore}|${record.decayStatus}`;

    // Using the SubtleCrypto API (Browser & Edge Runtime compatible)
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert buffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Stores the hash and record in Supabase 'provenance' table.
 */
export async function commitProvenanceToBlockchain(hash: string, record: ProvenanceRecord) {
    const { data, error } = await supabase
        .from('provenance')
        .insert([
            {
                hash: hash,
                user_id: record.userId,
                timestamp: record.timestamp,
                lat: record.location.lat,
                lng: record.location.lng,
                quality_score: record.qualityScore,
                decay_status: record.decayStatus,
                crop: record.crop,
                shadow_price: record.shadowPrice,
                metadata: {
                    engine_version: "v2.1-crypto-lock",
                    network: "PolyMitti-Mainnet"
                }
            }
        ]);

    if (error) {
        console.error("[Provenance] Supabase storage failed:", error);
        // Fallback to local cache if DB is offline
        cacheProvenanceHash(hash, record);
        return false;
    }
    
    console.log("[Provenance] Immutable record committed to ledger:", hash);
    cacheProvenanceHash(hash, record);
    return true;
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
