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
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TransparencyLedgerPage() {
    const { t, n } = useLanguage();
    const [liveBlocks, setLiveBlocks] = useState<any[]>([]);
    
    // Simulate live block mining/updates
    useEffect(() => {
        const initialBlocks = [
            { id: '0x82fb...812a', event: t('npkSourced'), msg: t('npkLogMsg'), time: '2 mins ago', icon: <Database className="w-4 h-4" /> },
            { id: '0x3a12...9ef0', event: t('soilSignature'), msg: t('soilLogMsg'), time: '1 hour ago', icon: <Activity className="w-4 h-4" /> },
            { id: '0x77bc...112d', event: t('yieldCalibration'), msg: 'Yield potential locked at 55 quintals.', time: '3 hours ago', icon: <Zap className="w-4 h-4" /> }
        ];
        setLiveBlocks(initialBlocks);

        const interval = setInterval(() => {
            const newBlock = {
                id: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
                event: 'Heartbeat Audit',
                msg: 'System integrity verified via satellite mesh.',
                time: 'Just now',
                icon: <Activity className="w-4 h-4" />
            };
            setLiveBlocks(prev => [newBlock, ...prev.slice(0, 4)]);
        }, 8000);

        return () => clearInterval(interval);
    }, [t]);

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
                {/* Main Stats Area */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Batch Certificate */}
                    <GlassCard className="p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-mint/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-mint/10 transition-colors" />
                        
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <span className="text-[10px] font-black text-mint uppercase tracking-widest mb-1 block">Active Batch ID</span>
                                    <h2 className="text-4xl font-black text-white font-mono tracking-tighter">MITTI-2024-QX92</h2>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Network Status</span>
                                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-mint/10 border border-mint/20 text-[10px] text-mint font-black uppercase">
                                        <Globe className="w-3 h-3" />
                                        <span>Mainnet Live</span>
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">{t('genesisDate')}</span>
                                    <p className="text-white font-bold">12 Oct 2024</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Trust Score</span>
                                    <p className="text-mint font-black text-xl">98/100</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Data Points</span>
                                    <p className="text-white font-bold">142 verified</p>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Immutable Audit Log */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">{t('immutableLogs')}</h3>
                            <div className="flex items-center space-x-2 text-[10px] text-gray-500 font-bold uppercase">
                                <Activity className="w-3 h-3 text-mint" />
                                <span>Real-time Syncing</span>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <AnimatePresence mode="popLayout">
                                {liveBlocks.map((block, idx) => (
                                    <motion.div
                                        key={block.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
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
                                            <button className="p-3 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 text-gray-400">
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="lg:col-span-4 space-y-8">
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
                            <div className="flex justify-between items-center py-2">
                                <span className="text-xs text-gray-400">Encryption</span>
                                <span className="text-xs text-white font-bold font-mono">NIST-Post-Quantum</span>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Verification Action */}
                    <div className="p-6 rounded-3xl bg-black/40 border border-white/10 flex items-center justify-between group cursor-pointer hover:bg-black/60 transition-colors">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-mint transition-colors">
                                <Search className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-white uppercase tracking-wider">Public Explorer</p>
                                <p className="text-[9px] text-gray-500 font-bold uppercase">View on mitti-scan.io</p>
                            </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                    </div>
                </div>
            </div>
        </div>
    );
}
