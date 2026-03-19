"use client";

import { useState } from 'react';
import { GlassCard } from '@/components/glass-card';
import { StatusPill } from '@/components/status-pill';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { Droplets, Thermometer, Wind, Sprout, Activity, Database } from 'lucide-react';

const mockData = [
    { day: 'Mon', moisture: 65, ndvi: 0.72, npk: 45 },
    { day: 'Tue', moisture: 62, ndvi: 0.73, npk: 44 },
    { day: 'Wed', moisture: 58, ndvi: 0.75, npk: 46 },
    { day: 'Thu', moisture: 75, ndvi: 0.76, npk: 48 },
    { day: 'Fri', moisture: 70, ndvi: 0.78, npk: 47 },
    { day: 'Sat', moisture: 68, ndvi: 0.80, npk: 45 },
    { day: 'Sun', moisture: 65, ndvi: 0.82, npk: 44 },
];

export default function SoilHealthPage() {
    const { t, n } = useLanguage();

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white uppercase tracking-tighter">
                        {t('soilHealth')}
                    </h1>
                    <p className="text-sm text-gray-400">{t('observabilityLayer')}</p>
                </div>
                <div className="flex items-center space-x-3">
                    <StatusPill status="GREEN" message={t('sensorActive')} />
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">
                        {t('nodeId')}: #MM-782
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Droplets className="w-12 h-12 text-mint" />
                    </div>
                    <div className="flex items-center space-x-2 mb-4">
                        <Droplets className="w-4 h-4 text-mint" />
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">{t('soilMoisture')}</h3>
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold text-white">{n(68)}%</span>
                        <span className="text-xs text-mint font-medium">+{n(2)}% {t('optimal')}</span>
                    </div>
                    <div className="mt-4 w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-mint w-[68%]" />
                    </div>
                </GlassCard>

                <GlassCard className="p-6 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity className="w-12 h-12 text-teal-400" />
                    </div>
                    <div className="flex items-center space-x-2 mb-4">
                        <Activity className="w-4 h-4 text-teal-400" />
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">{t('npkLevels')}</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">{t('nitrogen')}</p>
                            <p className="text-lg font-bold text-white">{n(45)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">{t('phosphorus')}</p>
                            <p className="text-lg font-bold text-white">{n(12)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">{t('potassium')}</p>
                            <p className="text-lg font-bold text-white">{n(32)}</p>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Sprout className="w-12 h-12 text-green-400" />
                    </div>
                    <div className="flex items-center space-x-2 mb-4">
                        <Sprout className="w-4 h-4 text-green-400" />
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">{t('growthStage')}</h3>
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-xl font-bold text-white">{t('vegetative')}</span>
                        <span className="text-xs text-gray-400">{t('phase')} {n(3)}/{n(5)}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">{t('nextStage')}: {t('flowering')} ({t('estDays', { days: n(8) })})</p>
                </GlassCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">{t('fieldHealthCorrelation')}</h3>
                            <p className="text-xs text-gray-400">{t('ndviScoreMoisture')}</p>
                        </div>
                        <div className="flex space-x-4">
                            <div className="flex items-center space-x-1">
                                <span className="w-2 h-2 rounded-full bg-mint"></span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase">NDVI</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase">{t('soilMoisture')}</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockData}>
                                <defs>
                                    <linearGradient id="colorNdvi" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#20FFBD" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#20FFBD" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#0D9488" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis 
                                    dataKey="day" 
                                    stroke="#ffffff40" 
                                    fontSize={10} 
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis 
                                    stroke="#ffffff40" 
                                    fontSize={10} 
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#1B3022', 
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        fontSize: '10px'
                                    }}
                                    itemStyle={{ color: '#20FFBD' }}
                                />
                                <Area type="monotone" dataKey="ndvi" stroke="#20FFBD" fillOpacity={1} fill="url(#colorNdvi)" strokeWidth={2} />
                                <Area type="monotone" dataKey="moisture" stroke="#0D9488" fillOpacity={1} fill="url(#colorMoisture)" strokeWidth={2} strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 p-3 bg-mint/5 border border-mint/10 rounded-lg">
                        <p className="text-[10px] text-mint leading-relaxed">
                            <span className="font-bold uppercase mr-2">{t('analysis')}:</span>
                            {t('soilHealthAnalysisPrompt')}
                        </p>
                    </div>
                </GlassCard>

                <GlassCard className="p-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">{t('historicalComparison')}</h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                    <Database className="w-4 h-4 text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white uppercase">{t('lastSeasonAvg')}</p>
                                    <p className="text-[10px] text-gray-500">{t('sameGrowthStage')}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-white">{n(0.68)} NDVI</p>
                                <p className="text-[10px] text-mint font-bold">+{n(20)}% {t('improved')}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                    <Activity className="w-4 h-4 text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white uppercase">{t('regionalBenchmark')}</p>
                                    <p className="text-[10px] text-gray-500">{t('nearbyFarms')}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-white">{n(0.74)} NDVI</p>
                                <p className="text-[10px] text-mint font-bold">+{n(10)}% {t('aboveAvg')}</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/10">
                            <div className="flex items-center space-x-2 mb-2">
                                <Wind className="w-3 h-3 text-gray-400" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{t('evapotranspiration')}</span>
                            </div>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-2xl font-bold text-white">{n(5.2)} mm/day</span>
                                <span className="text-[10px] text-red-400 font-bold uppercase">{t('highLoss')}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">{t('windSpeedAdvice')}</p>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
