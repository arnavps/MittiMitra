"use client";

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/glass-card';
import { StatusPill } from '@/components/status-pill';
import { useLanguage } from '@/contexts/LanguageContext';
import { getWeatherForecast, WeatherDay } from '@/services/weatherService';
import { 
    CloudRain, 
    Sun, 
    Wind, 
    Droplets, 
    Thermometer, 
    AlertTriangle, 
    Navigation,
    ChevronRight,
    ArrowUpRight,
    TrendingDown
} from 'lucide-react';
import { 
    LineChart, 
    Line, 
    ResponsiveContainer, 
    YAxis, 
    XAxis, 
    Tooltip 
} from 'recharts';

const sparklineData = [
    { time: '00:00', pressure: 1012, humidity: 65, wind: 12 },
    { time: '04:00', pressure: 1010, humidity: 70, wind: 15 },
    { time: '08:00', pressure: 1008, humidity: 75, wind: 22 },
    { time: '12:00', pressure: 1007, humidity: 80, wind: 35 },
    { time: '16:00', pressure: 1005, humidity: 85, wind: 45 },
    { time: '20:00', pressure: 1006, humidity: 82, wind: 30 },
];

export default function WeatherHubPage() {
    const { t, n, language } = useLanguage();
    const [forecast, setForecast] = useState<WeatherDay[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async () => {
            const data = await getWeatherForecast(18.5204, 73.8567); // Mock Pune
            setForecast(data);
            setLoading(false);
        };
        fetchWeather();
    }, []);

    const advice = [
        { type: t('urgent'), message: t('rainAdvice'), style: 'border-red-500/30 bg-red-500/5 text-red-400' },
        { type: t('tipping'), message: t('humidityAdvice'), style: 'border-mint/30 bg-mint/5 text-mint' },
    ];

    if (loading) return null;

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
             <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white uppercase tracking-tighter">
                        {t('weatherHub')}
                    </h1>
                    <p className="text-sm text-gray-400">{t('hyperLocalAdvice')}</p>
                </div>
                <div className="flex items-center space-x-3">
                    <StatusPill status="YELLOW" message={t('stormWatch')} />
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Forecast (8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                        {forecast.map((day, idx) => (
                            <GlassCard key={idx} className={`p-4 flex flex-col items-center justify-center transition-all ${idx === 0 ? 'border-mint/40 bg-white/10 ring-1 ring-mint/20' : 'hover:bg-white/5'}`}>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                                    {idx === 0 ? t('today') : new Date(day.date).toLocaleDateString(language === 'en' ? 'en-US' : language, { weekday: 'short' })}
                                </p>
                                {day.condition.includes('Rain') ? <CloudRain className="w-8 h-8 text-mint mb-3" /> : <Sun className="w-8 h-8 text-amber-400 mb-3" />}
                                <div className="text-center">
                                    <p className="text-sm font-bold text-white">{n(day.max_temp)}°</p>
                                    <p className="text-[10px] text-gray-500 font-medium">{n(day.min_temp)}°</p>
                                </div>
                                {day.rain_mm > 0 && (
                                    <p className="mt-2 text-[8px] font-black text-mint uppercase">{n(day.rain_mm)}mm</p>
                                )}
                            </GlassCard>
                        ))}
                    </div>

                    <GlassCard className="p-6">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">{t('meteorologicalSparklines')}</h3>
                            <div className="flex space-x-6">
                                <span className="flex items-center space-x-2 text-[10px] font-bold text-gray-500 uppercase">
                                    <div className="w-2 h-0.5 bg-mint" />
                                    <span>{t('windKmh')}</span>
                                </span>
                                <span className="flex items-center space-x-2 text-[10px] font-bold text-gray-500 uppercase">
                                    <div className="w-2 h-0.5 bg-sky-400" />
                                    <span>{t('humidityPercentage')}</span>
                                </span>
                            </div>
                        </div>

                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={sparklineData}>
                                    <XAxis dataKey="time" hide />
                                    <YAxis hide />
                                    <Tooltip 
                                         contentStyle={{ 
                                            backgroundColor: '#1B3022', 
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            fontSize: '10px'
                                        }}
                                    />
                                    <Line type="monotone" dataKey="wind" stroke="#20FFBD" strokeWidth={3} dot={false} animationDuration={2000} />
                                    <Line type="monotone" dataKey="humidity" stroke="#38bdf8" strokeWidth={3} dot={false} animationDuration={2000} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/10">
                            <div>
                                <p className="text-[10px] text-gray-500 font-black uppercase mb-1">{t('barometer')}</p>
                                <div className="flex items-center space-x-2">
                                    <Thermometer className="w-4 h-4 text-white/40" />
                                    <p className="text-sm font-bold text-white">{n(1005)} hPa</p>
                                </div>
                                <span className="text-[8px] text-red-400 font-bold uppercase flex items-center mt-1">
                                    {t('fallingFast')}
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-black uppercase mb-1">{t('uvIndex')}</p>
                                <div className="flex items-center space-x-2">
                                    <Sun className="w-4 h-4 text-white/40" />
                                    <p className="text-sm font-bold text-white">{n(8.2)} {t('high')}</p>
                                </div>
                                <span className="text-[8px] text-amber-400 font-bold uppercase flex items-center mt-1">
                                    {t('shadeRequired')}
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-black uppercase mb-1">{t('windGusts')}</p>
                                <div className="flex items-center space-x-2">
                                    <Wind className="w-4 h-4 text-white/40" />
                                    <p className="text-sm font-bold text-white">{n(52)} km/h</p>
                                </div>
                                <span className="text-[8px] text-sky-400 font-bold uppercase flex items-center mt-1">
                                    {t('northWest')}
                                </span>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Sidebar Advice (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest pl-2">{t('actionableAdvice')}</h3>
                    {advice.map((item, idx) => (
                        <GlassCard key={idx} className={`p-6 border ${item.style}`}>
                            <div className="flex items-start space-x-3">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-1">{item.type}</p>
                                    <p className="text-xs font-medium leading-relaxed">{item.message}</p>
                                </div>
                            </div>
                        </GlassCard>
                    ))}

                    <GlassCard className="p-6 bg-mint/5 border-mint/20">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">{t('dewPointOptimizer')}</h3>
                            <StatusPill status="GREEN" message={t('ready')} className="scale-75 origin-right" />
                        </div>
                        <p className="text-[10px] text-gray-400 mb-4">
                            {t('sprayingAdvice')}
                        </p>
                        <button className="flex items-center space-x-2 text-[10px] font-black text-mint uppercase tracking-widest hover:underline">
                            <span>{t('addToPlanner')}</span>
                            <ChevronRight className="w-3 h-3" />
                        </button>
                    </GlassCard>

                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                <TrendingDown className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white uppercase">{t('sourceAwsHubDetailed')}</p>
                                <p className="text-[10px] text-gray-500">{t('sourceImdNowcastDetailed')}</p>
                            </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-gray-600" />
                    </div>
                </div>
            </div>
        </div>
    );
}

