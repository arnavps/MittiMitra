'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface MetricsGridProps {
    data: any;
    isHarvested?: boolean;
    onMetricClick: (metric: string, value: number, unit: string) => void;
    onExplain?: (query: string) => void;
}

export function MetricsGrid({ data, isHarvested, onMetricClick, onExplain }: MetricsGridProps) {
    const { t, n } = useLanguage();

    if (!data) return null;

    // Derived metrics for UI
    const temperature = data.weather?.temperature_c || 28;
    const humidity = data.weather?.humidity_percent || 65;
    const soilMoisture = data.weather?.soil_moisture_percent || 40;
    const spoilageRisk = data.weather?.spoilage_risk || 15;
    const isVerified = data.weather?.is_verified_env || false;

    const marketPrice = data.mandi_stats?.current_price || 0;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Market Price - Post-Harvest Only */}
            {isHarvested && (
                <div
                    onClick={() => onMetricClick(t('marketValue'), marketPrice, '₹')}
                    className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md p-4 flex flex-col items-center justify-center text-center shadow-inner hover:bg-white/10 transition-all cursor-pointer group active:scale-95 border-mint/20"
                >
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-3 h-3 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </div>
                    <svg className="w-8 h-8 text-mint mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-2xl font-bold text-white tracking-tight">₹{n(marketPrice)}</p>
                    <div className="flex flex-col items-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">{t('marketValue')}</p>
                        <p className="text-[8px] text-mint/50 uppercase font-bold tracking-tighter mt-1">
                            {t('sourceEnam')}
                        </p>
                    </div>
                </div>
            )}
            {/* Avg Temperature */}
            <div
                onClick={() => onMetricClick(t('temp'), temperature, '°C')}
                className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md p-4 flex flex-col items-center justify-center text-center shadow-inner hover:bg-white/10 transition-all cursor-pointer group active:scale-95"
            >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-3 h-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </div>
                <svg className="w-8 h-8 text-orange-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                <p className="text-2xl font-bold text-white tracking-tight">{n(temperature)}°C</p>
                <div className="flex flex-col items-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">{t('temp')}</p>
                    <p className={`text-[8px] uppercase font-bold tracking-tighter mt-1 ${isVerified ? 'text-mint' : 'text-orange-400/50'}`}>
                        {isVerified ? t('sourceOpenMeteo') : t('sourceImdNowcast')}
                    </p>
                    {onExplain && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onExplain(`Explain how this temperature of ${temperature}°C affects my profit.`); }}
                            className="mt-3 px-3 py-1 bg-mint/10 hover:bg-mint/20 border border-mint/30 rounded-full text-[9px] text-mint font-black transition-all flex items-center space-x-1 uppercase tracking-widest group/btn"
                        >
                            <svg className="w-2.5 h-2.5 group-hover/btn:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                            </svg>
                            <span>{t('explainBtn')}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Humidity */}
            <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md p-4 flex flex-col items-center justify-center text-center shadow-inner hover:bg-white/5 transition-colors">
                <svg className="w-8 h-8 text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                <p className="text-2xl font-bold text-white tracking-tight">{n(humidity)}%</p>
                <div className="flex flex-col items-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">{t('humidity')}</p>
                    <p className={`text-[8px] uppercase font-bold tracking-tighter mt-1 ${isVerified ? 'text-mint' : 'text-blue-400/50'}`}>
                        {isVerified ? t('sourceOpenMeteo') : t('sourceAwsHub')}
                    </p>
                </div>
            </div>

            {/* Soil Moisture */}
            <div
                onClick={() => onMetricClick(t('soilMoisture'), soilMoisture, '%')}
                className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md p-4 flex flex-col items-center justify-center text-center shadow-inner hover:bg-white/10 transition-all cursor-pointer group active:scale-95"
            >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-3 h-3 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </div>
                <svg className="w-8 h-8 text-teal-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                <p className="text-2xl font-bold text-white tracking-tight">{n(soilMoisture)}%</p>
                <div className="flex flex-col items-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">{t('soilMoisture')}</p>
                    <p className={`text-[8px] uppercase font-bold tracking-tighter mt-1 ${isVerified ? 'text-mint' : 'text-teal-400/50'}`}>
                        {isVerified ? t('sourceSatellite') : t('sourceSensor')}
                    </p>
                </div>
            </div>

            {/* Spoilage Risk % */}
            <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md p-4 flex flex-col items-center justify-center text-center shadow-inner hover:bg-white/5 transition-colors relative overflow-hidden group">
                <div className={`absolute bottom-0 left-0 right-0 opacity-20 transition-all duration-500 ease-in-out group-hover:opacity-30 ${spoilageRisk > 30 ? 'bg-red-500' : spoilageRisk > 15 ? 'bg-yellow-400' : 'bg-mint'
                    }`} style={{ height: `${spoilageRisk}%` }}></div>

                <svg className="w-8 h-8 text-red-400 mb-2 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <p className="text-2xl font-bold text-white tracking-tight z-10">{n(spoilageRisk)}%</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 z-10">{t('spoilageRisk')}</p>
                <p className="text-[8px] text-red-400/50 uppercase font-bold tracking-tighter mt-1 z-10">
                    {t('sourceAgriDecay')}
                </p>
                {onExplain && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onExplain(`My spoilage risk is ${spoilageRisk}%, what should I do?`); }}
                        className="z-10 mt-3 px-3 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-full text-[9px] text-red-400 font-black transition-all flex items-center space-x-1 uppercase tracking-widest group/risk animate-pulse-slow shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                    >
                        <svg className="w-2.5 h-2.5 group-hover/risk:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.047a1 1 0 01.974 0l.147.083a1 1 0 01.502.866V17a1 1 0 01-1.502.866l-7.93-4.46a1 1 0 010-1.732l7.93-4.46a1 1 0 011.132 0l7.93 4.46a1 1 0 010 1.732l-7.93 4.46a1 1 0 01-1.132 0l-7.93-4.46a1 1 0 010-1.732l7.93-4.46z" clipRule="evenodd" />
                            <path d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" />
                        </svg>
                        <span>{t('howToSave')}</span>
                    </button>
                )}
            </div>
        </div>
    );
}
