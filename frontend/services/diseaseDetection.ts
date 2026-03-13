/**
 * diseaseDetection.ts
 * Pathological risk detection using local vision inference (Mocked for Phase 9)
 */

export interface DiseaseAuditResult {
    disease_detected: string | null;
    severity_index: number; // 0.0 to 1.0
    symptoms: string[];
    respiration_multiplier: number;
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
}

const KNOWN_DISEASES = [
    { name: "Late Blight", base_multiplier: 3.0, symptoms: ["Water-soaked spots", "White fuzzy growth", "Dark lesions"] },
    { name: "Anthracnose", base_multiplier: 2.2, symptoms: ["Sunken black spots", "Pinkish spore masses"] },
    { name: "Sour Rot", base_multiplier: 3.5, symptoms: ["Soft watery tissue", "Vinegar-like odor"] }
];

/**
 * Simulates Edge-inference for disease symptoms.
 * In production, this would use a quantized model like MobileNetV3.
 */
export async function detectPathology(imageBlob?: Blob): Promise<DiseaseAuditResult> {
    // Simulate inference delay (Edge devices are slower)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For demo: 40% chance of detecting a disease
    const hasDisease = Math.random() > 0.6;
    
    if (!hasDisease) {
        return {
            disease_detected: null,
            severity_index: 0,
            symptoms: [],
            respiration_multiplier: 1.0,
            risk_level: 'LOW'
        };
    }

    const disease = KNOWN_DISEASES[Math.floor(Math.random() * KNOWN_DISEASES.length)];
    const severity = Math.random() * 0.8 + 0.1; // 0.1 to 0.9

    let risk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (severity > 0.6) risk = 'HIGH';
    else if (severity > 0.3) risk = 'MEDIUM';

    return {
        disease_detected: disease.name,
        severity_index: round(severity, 2),
        symptoms: disease.symptoms,
        respiration_multiplier: severity > 0.3 ? 2.5 : 1.5,
        risk_level: risk
    };
}

function round(val: number, precision: number) {
    const factor = Math.pow(10, precision);
    return Math.round(val * factor) / factor;
}

export const diseaseGuidance = [
    "Place a sample crate in direct sunlight.",
    "Take a clear, high-resolution close-up.",
    "Scanning for necrotic lesions and spore patterns...",
    "Audit complete. Synchronizing biological risk..."
];
