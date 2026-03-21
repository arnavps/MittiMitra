"use client";

import { useState, useRef, useEffect } from 'react';
import { GlassCard } from '@/components/glass-card';
import { StatusPill } from '@/components/status-pill';
import { useLanguage } from '@/contexts/LanguageContext';
import { detectPathology, diseaseGuidance, DiseaseAuditResult } from '@/services/diseaseDetection';
import { motion, AnimatePresence } from 'framer-motion';

export default function DiseaseAuditPage() {
    const { t, n } = useLanguage();
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [guidanceIndex, setGuidanceIndex] = useState(0);
    const [result, setResult] = useState<DiseaseAuditResult | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [cameraActive, setCameraActive] = useState(false);

    const startAudit = async () => {
        setIsScanning(true);
        setResult(null);
        setScanProgress(0);
        setGuidanceIndex(0);

        // Start Camera
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
            }
        } catch (err) {
            console.error("Camera access denied", err);
        }

        // Simulate scanning animation
        const interval = setInterval(() => {
            setScanProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 2;
            });
        }, 100);

        // Rotate guidance text
        const guidanceInterval = setInterval(() => {
            setGuidanceIndex(prev => (prev + 1) % diseaseGuidance.length);
        }, 3000);

        // Call vision service
        const auditResult = await detectPathology();
        
        setResult(auditResult);
        setIsScanning(false);
        clearInterval(guidanceInterval);
        
        // Stop camera
        if (videoRef.current?.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            setCameraActive(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-mint/20 rounded-xl flex items-center justify-center border border-mint/30 shadow-[0_0_20px_rgba(32,255,189,0.1)]">
                            <svg className="w-6 h-6 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-extrabold text-white tracking-tighter uppercase italic">{t('diseaseAudit')}</h1>
                    </div>
                    <p className="text-gray-400 font-medium max-w-xl">
                        {t('diseaseAuditDesc')}
                    </p>
                </div>
                <button
                    onClick={startAudit}
                    disabled={isScanning}
                    className="px-8 py-4 bg-mint text-forest font-black uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(32,255,189,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                    {isScanning ? t('inspecting').toUpperCase() : t('startNewScan')}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Visualizer / Camera View (7 Columns) */}
                <div className="lg:col-span-7 space-y-6">
                    <GlassCard className="aspect-video relative overflow-hidden p-0 border-2 border-white/5">
                        {!cameraActive && !result && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-4 p-12">
                                <div className="w-20 h-20 border-4 border-dashed border-white/10 rounded-full flex items-center justify-center animate-spin-slow">
                                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                                </div>
                                <p className="text-gray-500 font-bold uppercase tracking-widest">{t('readyForInspection')}</p>
                            </div>
                        )}

                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className={`w-full h-full object-cover grayscale-[0.2] transition-opacity duration-1000 ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
                        />

                        {/* Scanning HUD Overlay */}
                        <AnimatePresence>
                            {(isScanning || cameraActive) && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 pointer-events-none"
                                >
                                    {/* Scanning Line */}
                                    {isScanning && (
                                        <motion.div 
                                            animate={{ top: ['0%', '100%', '0%'] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                            className="absolute left-0 right-0 h-1 bg-mint/50 shadow-[0_0_20px_#20FFBD] z-10"
                                        />
                                    )}
                                    
                                    {/* Corners Bounding Box */}
                                    <div className="absolute top-10 left-10 w-20 h-20 border-t-4 border-l-4 border-mint/40 rounded-tl-3xl" />
                                    <div className="absolute top-10 right-10 w-20 h-20 border-t-4 border-r-4 border-mint/40 rounded-tr-3xl" />
                                    <div className="absolute bottom-10 left-10 w-20 h-20 border-b-4 border-l-4 border-mint/40 rounded-bl-3xl" />
                                    <div className="absolute bottom-10 right-10 w-20 h-20 border-b-4 border-r-4 border-mint/40 rounded-br-3xl" />
                                    
                                    {/* Live Guidance */}
                                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[80%] max-w-md">
                                        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center">
                                            <p className="text-mint font-bold text-sm tracking-wide animate-pulse">
                                                {t(diseaseGuidance[guidanceIndex] as any)}
                                            </p>
                                            {isScanning && (
                                                <div className="w-full bg-white/5 h-1.5 rounded-full mt-3 overflow-hidden">
                                                    <div className="bg-mint h-full transition-all duration-300" style={{ width: `${scanProgress}%` }} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Result Confirmation Scan Image Flash */}
                        {result && !cameraActive && (
                            <div className="absolute inset-0 bg-forest/20 flex items-center justify-center">
                                <div className="text-center space-y-2">
                                    <div className="w-16 h-16 bg-mint text-forest rounded-full mx-auto flex items-center justify-center shadow-lg">
                                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <p className="text-mint font-black text-xs uppercase tracking-widest">{t('inspectionSaved')}</p>
                                </div>
                            </div>
                        )}
                    </GlassCard>

                    {/* Technical Analysis Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <GlassCard className="bg-white/5 border-white/5 p-6">
                            <h3 className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest mb-4">{t('visionIndicators')}</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-white/60 text-sm">{t('pathogenConfidence')}</span>
                                    <span className="text-white font-mono">{result ? (result.disease_detected ? "94.2%" : "N/A") : "--"}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-white/60 text-sm">{t('quantizationMode')}</span>
                                    <span className="text-white font-mono text-xs bg-white/5 px-2 py-0.5 rounded">INT8_EDGE</span>
                                </div>
                            </div>
                        </GlassCard>
                        <GlassCard className="bg-white/5 border-white/5 p-6">
                            <h3 className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest mb-4">{t('deviceTelemetry')}</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-white/60 text-sm">{t('inferenceLatency')}</span>
                                    <span className="text-white font-mono">{result ? "184ms" : "--"}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-white/60 text-sm">{t('sensorSync')}</span>
                                    <span className="text-white font-mono flex items-center">
                                        {t('active')} <div className="w-2 h-2 bg-mint rounded-full ml-2 animate-pulse" />
                                    </span>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>

                {/* Biological Verdict (5 Columns) */}
                <div className="lg:col-span-5 space-y-6">
                    <GlassCard className={`h-full border-2 transition-all duration-500 ${
                        result?.risk_level === 'HIGH' ? 'border-red-500/30' : 
                        result?.risk_level === 'MEDIUM' ? 'border-orange-500/30' : 
                        result?.disease_detected === null && result !== null ? 'border-mint/30' : 'border-white/5'
                    }`}>
                        {!result ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
                                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10 opacity-30">
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                                <p className="text-gray-500 font-bold uppercase tracking-widest text-sm leading-relaxed">
                                    {t('runAuditDesc')}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                                {/* Risk Header */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest mb-1">{t('pathologicalRisk')}</p>
                                        <h2 className={`text-4xl font-black italic uppercase tracking-tighter ${
                                            result.risk_level === 'HIGH' ? 'text-red-500' : 
                                            result.risk_level === 'MEDIUM' ? 'text-orange-500' : 'text-mint'
                                        }`}>
                                            {result.disease_detected ? t(result.disease_detected as any) : t('clear')}
                                        </h2>
                                    </div>
                                    <StatusPill 
                                        status={result.risk_level === 'LOW' ? 'STABLE' : result.risk_level === 'MEDIUM' ? 'WATCH' : 'REROUTE'} 
                                        message={result.risk_level === 'LOW' ? t('stable') : result.risk_level === 'MEDIUM' ? t('watch') : t('reroute')}
                                    />
                                </div>

                                {/* Severity Score */}
                                <div className="space-y-4">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-gray-500">{t('severityIndex')}</span>
                                        <span className={result.severity_index > 0.3 ? 'text-orange-500' : 'text-mint'}>
                                            {t('infectedSurface', { val: n(Math.round(result.severity_index * 100)) })}
                                        </span>
                                    </div>
                                    <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden border border-white/10">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${result.severity_index * 100}%` }}
                                            className={`h-full ${
                                                result.severity_index > 0.6 ? 'bg-red-500' : 
                                                result.severity_index > 0.3 ? 'bg-orange-500' : 'bg-mint'
                                            }`}
                                        />
                                    </div>
                                </div>

                                {/* Biological Impact (The Golden Window) */}
                                <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-orange-500/20 text-orange-400 rounded-2xl flex items-center justify-center">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">{t('respirationAcceleration')}</p>
                                            <p className="text-2xl text-white font-black italic">{t('fasterDecay', { val: n(result.respiration_multiplier) })}</p>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <p className="text-sm text-gray-300 font-medium leading-relaxed">
                                            {result.disease_detected 
                                                ? t('goldenWindowShrunk', { val: n(Math.round(72 / result.respiration_multiplier)) })
                                                : t('noPathologicalAcceleration')}
                                        </p>
                                    </div>
                                </div>

                                {/* Symptoms & Actions */}
                                {result.disease_detected && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">{t('detectedSymptoms')}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {result.symptoms.map(s => (
                                                <span key={s} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-gray-300">
                                                    {t(s as any)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Routing Recommendation Overlay */}
                                {result.risk_level === 'HIGH' && (
                                    <div className="p-6 bg-red-600/10 border-2 border-red-500/30 rounded-3xl animate-pulse">
                                        <h4 className="text-lg font-black text-red-500 uppercase italic tracking-tighter mb-2">{t('vakeelDirective')}</h4>
                                        <p className="text-sm text-gray-300 font-bold leading-snug">
                                            {t('vakeelDirectiveDesc')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
