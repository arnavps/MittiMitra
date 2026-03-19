"use client";

import { useState, useRef, useEffect } from 'react';
import { GlassCard } from '@/components/glass-card';
import { StatusPill } from '@/components/status-pill';
import { performQualityAudit, captureGuidance, QualityAuditResult } from '@/services/visionAudit';
import { generateProvenanceHash, cacheProvenanceHash } from '@/utils/provenance';
import { MandiPass } from '@/components/dashboard/MandiPass';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TransparencyLedgerPage() {
    const router = useRouter();
    const { t, n } = useLanguage();
    const [isAuditing, setIsAuditing] = useState(false);
    const [auditStep, setAuditStep] = useState(0);
    const [auditResult, setAuditResult] = useState<QualityAuditResult | null>(null);
    const [shadowPriceData, setShadowPriceData] = useState<any>(null);
    const [provenanceHash, setProvenanceHash] = useState<string | null>(null);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Mock data from dashboard context
    const mockContext = {
        userId: "FARMER_77",
        crop: t('tomato'),
        basePrice: 2850,
        location: { lat: 18.5204, lng: 73.8567 },
        spoilageRisk: 4.2
    };

    const startAudit = async () => {
        setIsAuditing(true);
        setAuditStep(0);
        setAuditResult(null);
        setProvenanceHash(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            // Guidance sequence
            for (let i = 0; i < captureGuidance.length; i++) {
                setAuditStep(i);
                await new Promise(r => setTimeout(r, 2000));
            }

            // Perform Audit
            const result = await performQualityAudit();
            setAuditResult(result);

            // Fetch Shadow Price from Backend
            const spRes = await fetch('/api/shadow-price', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    base_price: mockContext.basePrice,
                    grade: result.grade,
                    spoilage_risk: mockContext.spoilageRisk
                })
            });
            if (spRes.ok) setShadowPriceData(await spRes.json());

            // Generate Hash
            const hash = await generateProvenanceHash({
                userId: mockContext.userId,
                timestamp: new Date().toISOString(),
                location: mockContext.location,
                qualityScore: result.quality_score,
                decayStatus: 1.05, // Mock Q10
                crop: mockContext.crop
            });
            setProvenanceHash(hash);
            
            // Cache for offline
            cacheProvenanceHash(hash, {
                 userId: mockContext.userId,
                 timestamp: new Date().toISOString(),
                 location: mockContext.location,
                 qualityScore: result.quality_score,
                 decayStatus: 1.05,
                 crop: mockContext.crop
            });

            // Stop Camera
            stream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
            setIsAuditing(false);

        } catch (err) {
            console.error("Camera access failed", err);
            setIsAuditing(false);
        }
    };

    const shadowPrice = auditResult ? Math.round(mockContext.basePrice * (auditResult.grade === 'A' ? 1.15 : auditResult.grade === 'B' ? 1.0 : 0.85)) : 0;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
            <header className="flex items-center justify-between mb-8">
                <div>
                   <button onClick={() => router.back()} className="text-mint text-xs font-bold flex items-center mb-2 hover:opacity-70 transition-all uppercase">
                       <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                       {t('backToDashboard')}
                   </button>
                   <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">{t('transparencyLedger')}</h1>
                   <p className="text-gray-400 text-sm">{t('securePremiumYield')}</p>
                </div>
                <StatusPill status="GREEN" message={t('encryptedSession')} />
            </header>

            {!auditResult && !isAuditing ? (
                <GlassCard className="p-12 text-center border-mint/20 flex flex-col items-center">
                    <div className="w-24 h-24 bg-mint/10 rounded-full flex items-center justify-center mb-6 border border-mint/30 shadow-[0_0_30px_rgba(32,255,189,0.2)]">
                        <svg className="w-12 h-12 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">{t('auditYourYield')}</h2>
                    <p className="text-gray-400 max-w-sm mb-8">{t('auditYieldDesc')}</p>
                    <button 
                        onClick={startAudit}
                        className="bg-mint text-forest font-black px-8 py-4 rounded-2xl shadow-[0_0_20px_rgba(32,255,189,0.4)] hover:scale-105 transition-all text-lg uppercase italic"
                    >
                        {t('startQualityAudit')}
                    </button>
                </GlassCard>
            ) : isAuditing ? (
                <GlassCard className="p-0 overflow-hidden border-mint/50 border-2">
                    <div className="relative aspect-video bg-black">
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className="w-full h-full object-cover opacity-70"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-end p-12 bg-gradient-to-t from-forest/90 to-transparent">
                             <div className="bg-mint/20 border border-mint/50 backdrop-blur-md px-6 py-3 rounded-2xl mb-4">
                                 <p className="text-mint font-black text-lg animate-pulse uppercase">{t(captureGuidance[auditStep] as any)}</p>
                             </div>
                             <div className="flex space-x-2">
                                {captureGuidance.map((_, i) => (
                                    <div key={i} className={`h-1.5 w-12 rounded-full transition-all duration-500 ${i <= auditStep ? 'bg-mint' : 'bg-white/10'}`}></div>
                                ))}
                             </div>
                        </div>
                        {/* Scanning Overlay */}
                        <div className="absolute inset-0 border-[40px] border-forest/40 pointer-events-none">
                            <div className="w-full h-full border-2 border-mint/30 rounded-2xl relative">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-mint"></div>
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-mint"></div>
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-mint"></div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-mint"></div>
                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-mint/50 animate-[scan_2s_ease-in-out_infinite] blur-sm"></div>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            ) : auditResult && provenanceHash && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <MandiPass 
                        hash={provenanceHash} 
                        record={{
                            userId: mockContext.userId,
                            timestamp: new Date().toISOString(),
                            qualityScore: auditResult.quality_score,
                            grade: auditResult.grade,
                            shadowPrice: shadowPriceData?.shadow_price || mockContext.basePrice,
                            mandiPrice: mockContext.basePrice,
                            crop: mockContext.crop
                        }}
                    />
                    <div className="mt-8 flex justify-center space-x-4">
                         <button 
                            onClick={() => window.print()} 
                            className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/20 px-6 py-3 rounded-2xl text-white font-bold transition-all uppercase"
                         >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            <span>{t('printCertificate')}</span>
                         </button>
                         <button 
                            onClick={() => startAudit()} 
                            className="flex items-center space-x-2 bg-mint/10 hover:bg-mint/20 border border-mint/30 px-6 py-3 rounded-2xl text-mint font-bold transition-all uppercase"
                         >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            <span>{t('reAuditBatch')}</span>
                         </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes scan {
                    0%, 100% { top: 0%; opacity: 0; }
                    50% { top: 100%; opacity: 1; }
                }
            `}</style>
        </div>
    );
}
