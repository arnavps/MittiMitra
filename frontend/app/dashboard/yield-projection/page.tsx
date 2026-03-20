"use client";

import { useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/glass-card';
import { StatusPill } from '@/components/status-pill';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
    Calculator, 
    TrendingUp, 
    ShieldCheck, 
    Lock, 
    Truck, 
    Archive,
    Search,
    Cpu,
    Check,
    ExternalLink
} from 'lucide-react';
import { 
    ComposedChart, 
    Line, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Bar
} from 'recharts';


export default function YieldProjectionPage() {
    const { t, n } = useLanguage();
    const [auditLogVisible, setAuditLogVisible] = useState(false);

    const projectionData = [
        { stage: t('seedling'), min: 40, exp: 45, max: 50 },
        { stage: t('vegetative'), min: 42, exp: 48, max: 55 },
        { stage: t('flowering'), min: 45, exp: 52, max: 60 },
        { stage: t('maturity'), min: 48, exp: 55, max: 65 },
    ];

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white uppercase tracking-tighter">
                        {t('yieldProjection')}
                    </h1>
                    <p className="text-sm text-gray-400">{t('blockchainProvenance')}</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="bg-mint/10 border border-mint/20 px-3 py-1.5 rounded-full flex items-center space-x-2">
                        <Lock className="w-3 h-3 text-mint" />
                        <span className="text-[10px] text-mint font-black uppercase tracking-widest">{t('immutableLogActive')}</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Chart & Summary (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                    <GlassCard className="p-6">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">{t('dynamicHarvestProjection')}</h3>
                            <div className="flex space-x-4">
                                <span className="flex items-center space-x-1.5">
                                    <div className="w-2 h-2 rounded-full bg-mint" />
                                    <span className="text-[8px] text-gray-500 font-bold uppercase">{t('expected')}</span>
                                </span>
                            </div>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={projectionData}>
                                    <XAxis dataKey="stage" hide />
                                    <YAxis hide />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1B3022', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                                    />
                                    <Area type="monotone" dataKey="max" fill="#20FFBD08" stroke="none" />
                                    <Area type="monotone" dataKey="min" fill="#1B3022" stroke="none" />
                                    <Bar dataKey="exp" barSize={40} fill="#20FFBD10" radius={[4, 4, 0, 0]} />
                                    <Line type="monotone" dataKey="exp" stroke="#20FFBD" strokeWidth={3} dot={{ r: 4, fill: '#20FFBD' }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="flex justify-between mt-6 pt-6 border-t border-white/10">
                            <div>
                                <p className="text-[10px] text-gray-500 font-black uppercase">{t('currentEstimate')}</p>
                                <p className="text-3xl font-bold text-white">{n(55)} <span className="text-sm text-gray-400">{t('quintals')}</span></p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-500 font-black uppercase">{t('confidenceScore')}</p>
                                <p className="text-3xl font-bold text-mint">{n(92)}%</p>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-2">
                                <ShieldCheck className="w-4 h-4 text-mint" />
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">{t('immutableLogs')}</h3>
                            </div>
                            <Link 
                                href="/dashboard/transparency-ledger"
                                className="text-[10px] text-mint font-black uppercase tracking-widest hover:underline flex items-center space-x-1"
                            >
                                <span>{t('viewImmutableLogs')}</span>
                                <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 border border-white/5 group">
                                <div className="w-2 h-2 rounded-full bg-mint" />
                                <p className="text-[11px] text-gray-300 flex-1">
                                    <span className="text-white font-bold">{t('npkSourced')}:</span> {t('npkLogMsg')}
                                </p>
                                <Check className="w-3 h-3 text-mint opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 border border-white/5 group">
                                <div className="w-2 h-2 rounded-full bg-mint" />
                                <p className="text-[11px] text-gray-300 flex-1">
                                    <span className="text-white font-bold">{t('soilSignature')}:</span> {t('soilLogMsg')}
                                </p>
                                <Check className="w-3 h-3 text-mint opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Logistics Prep (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                    <GlassCard className="p-6 relative overflow-hidden bg-gradient-to-br from-mint/5 to-transparent">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Truck className="w-16 h-16 text-mint" />
                        </div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">{t('planning30Day')}</h3>
                        
                        <div className="space-y-6">
                            <div className="flex items-start space-x-4">
                                <div className="p-3 rounded-xl bg-white/5 text-mint">
                                    <Archive className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{t('reserveColdStorage')}</p>
                                    <p className="text-[10px] text-gray-500 leading-relaxed mt-1">
                                        {t('coldStorageAdvice')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="p-3 rounded-xl bg-white/5 text-mint">
                                    <Truck className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{t('preBookLogistics')}</p>
                                    <p className="text-[10px] text-gray-500 leading-relaxed mt-1">
                                        {t('logisticsAdvice')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button className="w-full mt-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                            {t('exportPdfBuyer')}
                        </button>
                    </GlassCard>

                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('digitalAssetReady')}</h4>
                            <Cpu className="w-4 h-4 text-mint opacity-50" />
                        </div>
                        <p className="text-xs text-gray-300 mb-4">
                            {t('mittiIdAdvice')}
                        </p>
                        <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full bg-mint/40 border border-forest" />
                            <div className="w-6 h-6 rounded-full bg-teal-500/40 border border-forest" />
                            <div className="w-6 h-6 rounded-full bg-sky-500/40 border border-forest font-bold text-[8px] flex items-center justify-center text-white">+5</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
