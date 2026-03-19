"use client";

import { useState } from 'react';
import { GlassCard } from '@/components/glass-card';
import { StatusPill } from '@/components/status-pill';
import { useLanguage } from '@/contexts/LanguageContext';
import { LayoutPanelLeft, Droplet, Zap, Calendar, Code, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function IrrigationPlannerPage() {
    const { t, n } = useLanguage();
    const [showSmartLogic, setShowSmartLogic] = useState(false);

    const schedule = [
        { id: 1, time: '06:00 AM', type: t('irrigation') || 'Irrigation', volume: `1200L`, status: 'Completed' },
        { id: 2, time: '08:30 AM', type: t('nutrients') || 'Nutrients (N)', volume: `50kg`, status: 'Pending' },
        { id: 3, time: '04:00 PM', type: t('irrigation') || 'Irrigation', volume: `800L`, status: 'Scheduled' },
        { id: 4, time: '06:30 PM', type: t('mistCooling') || 'Mist Cooling', volume: `200L`, status: 'Scheduled' },
    ];

    const logicParameters = {
        et_rate: "5.2 mm/day",
        soil_type: "Sandy Loam",
        field_capacity: "28%",
        temp_threshold: "32°C",
        source: "IMD API + Local AWS"
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white uppercase tracking-tighter">
                        {t('precisionIrrigation')}
                    </h1>
                    <p className="text-sm text-gray-400">{t('smartLogicActive') || "Automated schedules driven by real-time climate math"}</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button 
                        onClick={() => setShowSmartLogic(!showSmartLogic)}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-all text-[10px] font-black uppercase tracking-widest ${showSmartLogic 
                            ? 'bg-mint text-forest border-mint shadow-[0_0_15px_rgba(32,255,189,0.3)]' 
                            : 'bg-white/5 text-mint border-mint/20 hover:bg-mint/10'}`}
                    >
                        <Code className="w-3 h-3" />
                        <span>{t('smartLogic') || "Smart Logic"}</span>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Schedule (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                    <GlassCard className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-mint" />
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">{t('todayAutomationSchedule')}</h3>
                            </div>
                            <span className="text-[10px] text-gray-500 font-bold uppercase">March 17, 2026</span>
                        </div>

                        <div className="space-y-4">
                            {schedule.map((item) => (
                                <div key={item.id} className="group flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex flex-col items-center justify-center w-12 text-[10px] font-bold text-gray-400">
                                            <span>{item.time.split(' ')[0]}</span>
                                            <span className="text-[8px] text-gray-600">{item.time.split(' ')[1]}</span>
                                        </div>
                                        <div className="w-px h-8 bg-white/10" />
                                        <div>
                                            <p className="text-sm font-bold text-white">{item.type}</p>
                                            <p className="text-[10px] text-gray-500 font-medium">{t('volume') || "Volume"}: {item.volume}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${item.status === 'Completed' ? 'text-mint' : item.status === 'Pending' ? 'text-amber-400' : 'text-gray-500'}`}>
                                            {item.status}
                                        </span>
                                        {item.status === 'Completed' ? <CheckCircle2 className="w-4 h-4 text-mint" /> : <ChevronRight className="w-4 h-4 text-white/20" />}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="w-full mt-6 py-3 rounded-xl border border-dashed border-mint/30 text-mint text-[10px] font-black uppercase tracking-widest hover:bg-mint/5 transition-all">
                            {t('triggerManualOverride')}
                        </button>
                    </GlassCard>

                    {showSmartLogic && (
                        <GlassCard className="p-6 border-mint/20 bg-mint/5 animate-in slide-in-from-top duration-300">
                            <div className="flex items-center space-x-2 mb-4">
                                <Code className="w-4 h-4 text-mint" />
                                <h3 className="text-xs font-black text-mint uppercase tracking-widest">{t('logicEngineParameters')}</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {Object.entries(logicParameters).map(([key, value]) => (
                                    <div key={key} className="p-3 rounded-lg bg-black/20 border border-white/5">
                                        <p className="text-[8px] text-gray-500 font-black uppercase mb-1">{key.replace('_', ' ')}</p>
                                        <p className="text-xs font-bold text-white">{value}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-3 rounded-lg bg-black/40 font-mono text-[10px] text-mint/80 overflow-x-auto">
                                <p>// Calculate Irrigation Volume (L)</p>
                                <p>const calculateVol = (ET, area, Kc) =&gt; {'{'}</p>
                                <p>&nbsp;&nbsp;return (ET * Kc * area) / efficiency;</p>
                                <p>{'}'};</p>
                                <p>const currentKcVal = KcMaps.get("Vegetative");</p>
                                <p>triggerSchedule(calculateVol(5.2, 10000, currentKcVal));</p>
                            </div>
                        </GlassCard>
                    )}
                </div>

                {/* Right: Insights (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                    <GlassCard className="p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Zap className="w-16 h-16 text-amber-400" />
                        </div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">{t('efficiencyReport')}</h3>
                        <div className="space-y-6">
                            <div className="justify-between items-end">
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">{t('waterSaved')}</p>
                                    <p className="text-2xl font-bold text-white">{n(4200)} L</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-mint">{n(18)}%</p>
                                    <p className="text-[8px] text-gray-500 uppercase font-bold">{t('thisMonth')}</p>
                                </div>
                            </div>
                            <div className="justify-between items-end">
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">{t('fertilizerWasteReduced')}</p>
                                    <p className="text-2xl font-bold text-white">{n(12)} kg</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-mint">{n(12)}%</p>
                                    <p className="text-[8px] text-gray-500 uppercase font-bold">{t('thisMonth')}</p>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6 bg-amber-500/5 border-amber-500/20">
                        <div className="flex items-center space-x-2 mb-4">
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                            <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest">{t('inputTrackerAlert')}</h3>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">
                            {t('lowStockUreaAdvice')}
                        </p>
                        <button className="mt-4 text-[10px] font-black text-amber-400 uppercase tracking-widest hover:underline">
                            {t('viewInventory')} &rarr;
                        </button>
                    </GlassCard>

                    <div className="p-6 rounded-2xl bg-gradient-to-br from-mint/20 to-teal-500/20 border border-mint/20">
                         <div className="flex items-center space-x-2 mb-2">
                                <LayoutPanelLeft className="w-3 h-3 text-mint" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{t('roiInsight')}</span>
                            </div>
                        <p className="text-sm font-bold text-white mb-1">{t('savedAmountPerCycle', { amount: n(3420) })}</p>
                        <p className="text-[10px] text-gray-400">{t('roiAdvice')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
