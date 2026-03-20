"use client";

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/glass-card';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
    ShieldCheck, 
    Lock, 
    Cpu, 
    Check, 
    Database, 
    QrCode, 
    Activity,
    ExternalLink,
    Search,
    Globe,
    Zap,
    Camera,
    RefreshCw,
    Printer,
    Share2,
    ArrowRight,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { performQualityAudit, captureGuidance, QualityAuditResult } from '@/services/visionAudit';
import { generateProvenanceHash, commitProvenanceToBlockchain, ProvenanceRecord } from '@/utils/provenance';
import { MandiPass } from '@/components/dashboard/MandiPass';
import { CameraFeed } from '@/components/dashboard/CameraFeed';
import { fetchProfile } from '@/services/user';

export default function TransparencyLedgerPage() {
    const { t, n, language } = useLanguage();
    
    // UI States
    const [isAuditing, setIsAuditing] = useState(false);
    const [auditStep, setAuditStep] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [auditResult, setAuditResult] = useState<QualityAuditResult | null>(null);
    const [provenanceHash, setProvenanceHash] = useState<string | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    
    // Real Data States
    const [activeCrop, setActiveCrop] = useState<string>('Tomato');
    const [realMandiPrice, setRealMandiPrice] = useState<number>(1719.1);
    const [activeLocation, setActiveLocation] = useState<{lat: number, lng: number}>({ lat: 18.5204, lng: 73.8567 });
    const [liveBlocks, setLiveBlocks] = useState<any[]>([]);

    // Fetch Real Profile and Market Data
    useEffect(() => {
        const syncData = async () => {
            const profile = await fetchProfile();
            if (profile?.crop) {
                const cropName = profile.crop;
                setActiveCrop(cropName);
                const loc = { lat: profile.latitude || 18.5204, lng: profile.longitude || 73.8567 };
                setActiveLocation(loc);
                
                // Fetch current market price for this crop
                try {
                    const res = await fetch('/api/recommendation', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            crop: cropName,
                            location: loc,
                            language: language
                        })
                    });
                    if (res.ok) {
                        const rec = await res.json();
                        if (rec.mandi_stats?.current_price) {
                            setRealMandiPrice(rec.mandi_stats.current_price);
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch market price for ledger:", err);
                }
            }
        };
        syncData();
    }, [language]);

    // Simulate live block updates
    useEffect(() => {
        const initialBlocks = [
            { id: '0x82fb...812a', event: t('npkSourced'), msg: t('npkLogMsg'), time: '2 mins ago', icon: <Database className="w-4 h-4" /> },
            { id: '0x3a12...9ef0', event: t('soilSignature'), msg: t('soilLogMsg'), time: '1 hour ago', icon: <Activity className="w-4 h-4" /> },
            { id: '0x77bc...112d', event: t('yieldCalibration'), msg: 'Yield potential locked at 55 quintals.', time: '3 hours ago', icon: <Zap className="w-4 h-4" /> }
        ];
        setLiveBlocks(initialBlocks);
    }, [t]);

    // Handle the 360 Audit Flow
    const handleStartAudit = async () => {
        setIsAuditing(true);
        setAuditStep(0);
        setIsComplete(false);
        setAuditResult(null);
        
        // Simulate Camera Guidance Steps
        for (let i = 0; i < captureGuidance.length; i++) {
            setAuditStep(i);
            await new Promise(resolve => setTimeout(resolve, 2500));
        }

        setIsProcessing(true);
        setIsAuditing(false);

        try {
            // 1. Run Vision Audit
            const result = await performQualityAudit();
            setAuditResult(result);

            // 2. Prepare Record for Hashing (Match real data for Tomato)
            // 2. Prepare Record for Hashing (Dynamic Real Data)
            const premiumMultiplier = result.grade === 'A' ? 1.1 : 1.0;
            const shadowPrice = Math.round(realMandiPrice * premiumMultiplier);

            const record: ProvenanceRecord = {
                userId: "USER_7721", 
                timestamp: new Date().toISOString(),
                location: activeLocation,
                qualityScore: result.quality_score,
                decayStatus: 4.2, 
                crop: t(activeCrop.toLowerCase() as any),
                shadowPrice: shadowPrice
            };

            // 3. Generate SHA-256 Hash
            const hash = await generateProvenanceHash(record);
            setProvenanceHash(hash);

            // 4. Commit to "Blockchain" (Supabase)
            await commitProvenanceToBlockchain(hash, record);

            // 5. Update Live Feed
            const newBlock = {
                id: `0x${hash.slice(0, 4)}...${hash.slice(-4)}`,
                event: t('yieldAudit'),
                msg: `${t('auditSuccess')} - ${result.grade} Grade`,
                time: t('justNow'),
                icon: <ShieldCheck className="w-4 h-4" />
            };
            setLiveBlocks(prev => [newBlock, ...prev.slice(0, 3)]);

            setIsComplete(true);
        } catch (error) {
            console.error("Audit failed:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8">
                <div>
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-mint/20 flex items-center justify-center border border-mint/30 shadow-[0_0_20px_rgba(32,255,189,0.1)]">
                            <ShieldCheck className="w-6 h-6 text-mint" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase text-white">
                            {t('transparencyLedger')}
                        </h1>
                    </div>
                    <p className="text-gray-400 font-medium max-w-lg">{t('blockchainProvenance')}</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 bg-black/40 px-4 py-2 rounded-2xl border border-white/10">
                        <div className="w-2 h-2 rounded-full bg-mint animate-pulse" />
                        <span className="text-[10px] text-mint font-black uppercase tracking-[0.2em]">{t('immutableLogActive')}</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Action Area */}
                <div className="lg:col-span-8 space-y-8">
                    <AnimatePresence mode="wait">
                        {!isAuditing && !isProcessing && !isComplete && (
                            <motion.div
                                key="start"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <GlassCard className="p-12 text-center relative overflow-hidden group border-mint/20">
                                    <div className="absolute inset-0 bg-gradient-to-b from-mint/5 to-transparent pointer-events-none"></div>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-20 h-20 rounded-[2rem] bg-mint/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-mint/20">
                                            <Camera className="w-8 h-8 text-mint" />
                                        </div>
                                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">{t('auditYourYield')}</h2>
                                        <p className="text-gray-400 max-w-sm mx-auto mb-8 font-medium italic">
                                            {t('auditYieldDesc')}
                                        </p>
                                        <button 
                                            onClick={handleStartAudit}
                                            className="group flex items-center space-x-3 px-8 py-4 bg-mint text-forest rounded-2xl font-black uppercase tracking-widest text-xs shadow-[0_0_40px_rgba(32,255,189,0.3)] hover:scale-105 active:scale-95 transition-all"
                                        >
                                            <span>{t('startQualityAudit')}</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="mt-12 flex justify-center space-x-12 opacity-30 grayscale group-hover:grayscale-0 transition-all duration-700">
                                        <div className="flex flex-col items-center space-y-2">
                                            <Cpu className="w-5 h-5" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">TF.js AI</span>
                                        </div>
                                        <div className="flex flex-col items-center space-y-2">
                                            <Lock className="w-5 h-5" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">SHA-256</span>
                                        </div>
                                        <div className="flex flex-col items-center space-y-2">
                                            <Globe className="w-5 h-5" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">Supabase DB</span>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        )}

                        {isAuditing && (
                            <motion.div
                                key="auditing"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                            >
                                <GlassCard className="p-4 md:p-8 flex flex-col items-center border-mint/40 shadow-[0_0_50px_rgba(32,255,189,0.1)] relative">
                                    <button 
                                        onClick={() => setIsAuditing(false)}
                                        className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-500 transition-colors z-30"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                    <div className="w-full aspect-video md:w-[500px] md:h-[300px] mb-8">
                                        <CameraFeed 
                                            onError={(err) => setCameraError(err)}
                                        />
                                    </div>
                                    
                                    <div className="text-center space-y-4 max-w-sm">
                                        <div className="px-4 py-1 rounded-full bg-mint/10 border border-mint/20 inline-block mb-2">
                                            <span className="text-[10px] text-mint font-black uppercase tracking-widest animate-pulse">STEP {auditStep + 1}/4</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-white italic tracking-tight min-h-[3rem]">
                                            {t(activeCrop.toLowerCase() as any)} - {t(captureGuidance[auditStep] as any)}
                                        </h3>
                                        <div className="w-48 h-1 bg-white/5 rounded-full mx-auto overflow-hidden">
                                            <motion.div 
                                                className="h-full bg-mint"
                                                initial={{ width: "0%" }}
                                                animate={{ width: `${((auditStep + 1) / 4) * 100}%` }}
                                                transition={{ duration: 0.5 }}
                                            />
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        )}

                        {isProcessing && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center p-20 space-y-6"
                            >
                                <RefreshCw className="w-12 h-12 text-mint animate-spin" />
                                <div className="text-center">
                                    <p className="text-xl font-black text-white uppercase tracking-tighter mb-1">{t('analyzingQuality')}</p>
                                    <p className="text-xs text-mint/60 font-bold uppercase tracking-widest">{t('securingBatch')}</p>
                                </div>
                            </motion.div>
                        )}

                        {isComplete && auditResult && provenanceHash && (
                            <motion.div
                                key="complete"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-8"
                            >
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-black text-white uppercase tracking-[0.4em] mb-4">{t('digitalMandiPass')}</h2>
                                    <div className="flex space-x-2">
                                        <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10 transition-colors">
                                            <Share2 className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10 transition-colors">
                                            <Printer className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <MandiPass 
                                    hash={provenanceHash}
                                    record={{
                                        userId: "USER_7721",
                                        timestamp: new Date().toISOString(),
                                        qualityScore: auditResult.quality_score,
                                        grade: auditResult.grade,
                                        shadowPrice: Math.round(realMandiPrice * (auditResult.grade === 'A' ? 1.1 : 1.0)),
                                        mandiPrice: realMandiPrice,
                                        crop: t(activeCrop.toLowerCase() as any)
                                    }}
                                />

                                <div className="flex justify-center pt-4">
                                    <button 
                                        onClick={() => setIsComplete(false)}
                                        className="text-[10px] font-black text-gray-500 hover:text-mint uppercase tracking-widest transition-colors flex items-center space-x-2"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        <span>{t('reAuditBatch')}</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Immutable Audit Log Feed (Always visible at bottom or context) */}
                    <div className="pt-8 space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">{t('immutableLogs')}</h3>
                            <div className="flex items-center space-x-2 text-[10px] text-gray-500 font-bold uppercase">
                                <Activity className="w-3 h-3 text-mint" />
                                <span>Real-time Syncing</span>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <AnimatePresence mode="popLayout">
                                {liveBlocks.map((block) => (
                                    <motion.div
                                        key={block.id}
                                        layout
                                        className="group p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-mint/30 hover:bg-white/[0.04] transition-all"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-5">
                                                <div className="w-12 h-12 rounded-2xl bg-mint/10 border border-mint/20 flex items-center justify-center text-mint">
                                                    {block.icon}
                                                </div>
                                                <div>
                                                    <div className="flex items-center space-x-3 mb-1">
                                                        <h4 className="text-sm font-black text-white uppercase tracking-wider">{block.event}</h4>
                                                        <span className="text-[8px] font-mono text-mint/60 px-2 py-0.5 rounded-full bg-mint/5 border border-mint/10">{block.id}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-400 font-medium">{block.msg}</p>
                                                    <div className="flex items-center space-x-4 mt-3">
                                                        <span className="text-[9px] text-gray-500 flex items-center space-x-1.5 font-black uppercase">
                                                            <Lock className="w-2.5 h-2.5" />
                                                            <span>{t('verified')}</span>
                                                        </span>
                                                        <span className="text-[9px] text-gray-600 font-bold uppercase">{block.time}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Batch Certificate Info */}
                    <GlassCard className="p-8 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="space-y-6">
                                <div>
                                    <span className="text-[10px] font-black text-mint uppercase tracking-widest mb-1 block">Active Batch ID</span>
                                    <h2 className="text-2xl font-black text-white font-mono tracking-tighter">MITTI-2026-QX92</h2>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">{t('genesisDate')}</span>
                                        <p className="text-white font-bold">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Network Status</span>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <div className="w-1.5 h-1.5 bg-mint rounded-full animate-pulse" />
                                            <span className="text-xs text-mint font-black uppercase">Mainnet Live</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Digital Asset Card */}
                    <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-mint/20 via-transparent to-transparent border border-mint/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 blur-sm group-hover:blur-none transition-all duration-700">
                            <QrCode className="w-24 h-24 text-mint" />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-4">{t('digitalAssetReady')}</h3>
                        <p className="text-xs text-mint/80 font-medium leading-relaxed mb-6">
                            {t('mittiIdAdvice')}
                        </p>
                        <button className="w-full py-4 bg-mint text-forest rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-[0_0_30px_rgba(32,255,189,0.2)] hover:scale-[1.02] active:scale-95 transition-all">
                            List as Collateral
                        </button>
                    </div>

                    {/* Network Details */}
                    <GlassCard className="p-8 space-y-6">
                        <div className="flex items-center space-x-2 mb-2">
                            <Cpu className="w-4 h-4 text-gray-500" />
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Network Specs</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-xs text-gray-400">Consensus</span>
                                <span className="text-xs text-white font-bold font-mono">MITTI-PoS v2</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-xs text-gray-400">Block Time</span>
                                <span className="text-xs text-white font-bold font-mono">1.2s avg</span>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
