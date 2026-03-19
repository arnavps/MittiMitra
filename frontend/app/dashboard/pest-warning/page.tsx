"use client";

import { useState } from 'react';
import { GlassCard } from '@/components/glass-card';
import { StatusPill } from '@/components/status-pill';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShieldAlert, Camera, Map, AlertTriangle, Info, BellRing, Target, ChevronRight } from 'lucide-react';

export default function PestWarningPage() {
    const { t, n } = useLanguage();
    const [isReporting, setIsReporting] = useState(false);

    const alerts = [
        { id: 1, type: t('highRisk'), pest: t('fallArmyworm'), distance: t('distKm', { dist: n(2.5) }), trend: t('spreadingEast') },
        { id: 2, type: t('moderate'), pest: t('fungalBlight'), distance: t('distKm', { dist: n(12) }), trend: t('static') },
    ];

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white uppercase tracking-tighter">
                        {t('pestDiseaseSystem')}
                    </h1>
                    <p className="text-sm text-gray-400">{t('geofencingActive')}</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button 
                        onClick={() => setIsReporting(true)}
                        className="group flex items-center space-x-2 bg-mint hover:bg-white text-forest px-4 py-2 rounded-xl transition-all font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(32,255,189,0.3)]"
                    >
                        <Camera className="w-4 h-4" />
                        <span>{t('aiReportCamera')}</span>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Heatmap Area (8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                    <GlassCard className="p-0 overflow-hidden relative aspect-video md:aspect-auto md:h-[500px]">
                        {/* Mock Map Background */}
                        <div className="absolute inset-0 bg-[#0a0f0b] flex items-center justify-center">
                            <div className="relative w-full h-full opacity-40">
                                {/* Simple geometric shapes to represent a map */}
                                <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-mint/5 border border-mint/20 rounded-lg transform rotate-12" />
                                <div className="absolute top-2/3 left-1/2 w-48 h-24 bg-mint/5 border border-mint/20 rounded-lg transform -rotate-6" />
                                <div className="absolute top-1/2 left-1/4 w-px h-full bg-white/5" />
                                <div className="absolute top-1/3 left-0 w-full h-px bg-white/5" />
                            </div>

                            {/* Heatmap Blobs */}
                            <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
                            <div className="absolute top-1/2 left-2/3 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
                            
                            {/* User Location Marker */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                                <div className="relative">
                                    <div className="w-12 h-12 bg-mint/20 rounded-full animate-ping absolute -translate-x-1/4 -translate-y-1/4" />
                                    <div className="w-6 h-6 bg-forest border-2 border-mint rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(32,255,189,0.5)]">
                                        <div className="w-1.5 h-1.5 bg-mint rounded-full" />
                                    </div>
                                    <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black/80 px-2 py-0.5 rounded text-[8px] text-white font-bold uppercase tracking-widest whitespace-nowrap border border-white/10">
                                        {t('yourField')}
                                    </span>
                                </div>
                            </div>

                            {/* Threat Markers */}
                            <div className="absolute top-[38%] left-[28%] z-10 group cursor-help">
                                <AlertTriangle className="w-6 h-6 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-bounce" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 hidden group-hover:block bg-red-500/90 p-2 rounded-lg text-[10px] text-white font-bold animate-in fade-in slide-in-from-bottom-1">
                                    {t('armywormOutbreak')}
                                </div>
                            </div>
                        </div>

                        {/* Map HUD Controls */}
                        <div className="absolute top-4 left-4 flex flex-col space-y-2">
                             <div className="bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-[10px] text-white font-black uppercase tracking-widest">{t('highThreatZone')}</span>
                             </div>
                             <div className="bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                <span className="text-[10px] text-white font-black uppercase tracking-widest">{t('observationRequired')}</span>
                             </div>
                        </div>

                        <div className="absolute bottom-4 right-4 group">
                             <button className="bg-black/80 hover:bg-mint/20 backdrop-blur-md border border-white/10 p-2 rounded-xl transition-all">
                                <Map className="w-5 h-5 text-mint" />
                             </button>
                        </div>
                    </GlassCard>
                </div>

                {/* Sidebar Alerts (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    <GlassCard className="p-6">
                        <div className="flex items-center space-x-2 mb-6">
                            <BellRing className="w-4 h-4 text-red-500" />
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">{t('activeAlerts')}</h3>
                        </div>

                        <div className="space-y-4">
                            {alerts.map((alert) => (
                                <div key={alert.id} className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${alert.type === t('highRisk') ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                                            {alert.type}
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-bold">{alert.distance}</span>
                                    </div>
                                    <p className="text-sm font-bold text-white mb-1">{alert.pest}</p>
                                    <div className="flex items-center space-x-1.5">
                                        <Target className="w-3 h-3 text-gray-500" />
                                        <p className="text-[10px] text-gray-400">{alert.trend}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 p-4 rounded-xl bg-mint/5 border border-mint/20">
                            <div className="flex items-start space-x-3">
                                <ShieldAlert className="w-5 h-5 text-mint shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-white uppercase mb-1">{t('preventativeAction')}</p>
                                    <p className="text-[10px] text-gray-400 leading-relaxed">
                                        {t('pestAdvice')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6 relative group cursor-pointer border-dashed border-white/20 hover:border-mint/50 transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-1">{t('aiDiagnosticHub')}</h3>
                                <p className="text-[10px] text-gray-500">{t('uploadPhotoPest')}</p>
                            </div>
                            <Camera className="w-6 h-6 text-gray-400 group-hover:text-mint transition-colors" />
                        </div>
                    </GlassCard>

                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                        <div className="flex items-center space-x-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            <Info className="w-3 h-3" />
                            <span>{t('communitySourcedData')}</span>
                        </div>
                        <p className="mt-2 text-[10px] text-gray-400">
                            {t('p2pVerification')}
                        </p>
                    </div>
                </div>
            </div>

            {/* AI Report Modal Mock */}
            {isReporting && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <GlassCard className="max-w-md w-full p-8 shadow-2xl border-mint/20 text-center">
                        <div className="w-20 h-20 bg-mint/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Camera className="w-10 h-10 text-mint" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tighter">{t('initializeAiCamera')}</h3>
                        <p className="text-xs text-gray-400 mb-8 leading-relaxed">{t('cameraInstruction')}</p>
                        
                        <div className="space-y-3">
                            <button className="w-full py-4 bg-mint text-forest font-black uppercase tracking-widest text-xs rounded-xl shadow-lg ring-mint/30 hover:ring-4 transition-all">
                                {t('openCamera')}
                            </button>
                            <button 
                                onClick={() => setIsReporting(false)}
                                className="w-full py-4 text-xs text-gray-500 font-bold uppercase tracking-widest hover:text-white transition-colors"
                            >
                                {t('cancel')}
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
