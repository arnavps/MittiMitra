"use client";

import { useLanguage } from '@/contexts/LanguageContext';

interface HarvestScorecardProps {
    maturityPct: number;
    syncPanicDays: any[];
    weatherForecast: any[];
    verdict: any;
}

export function HarvestScorecard({ maturityPct, syncPanicDays, weatherForecast, verdict }: HarvestScorecardProps) {
    const { t } = useLanguage();

    const isSyncPanicSoon = syncPanicDays?.some((d: any) => d.isSyncPanic);
    const hasWeatherRisk = weatherForecast?.some((d: any) => d.rain_mm > 20 || d.max_temp > 40);

    return (
        <div className="grid grid-cols-3 gap-3 w-full mb-6">
            {/* Maturity Score */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-[8px] text-gray-500 uppercase tracking-widest font-black mb-1">Maturity</p>
                <div className="text-xl font-black text-mint">{maturityPct}%</div>
                <p className="text-[7px] text-gray-400 mt-1 uppercase font-bold">Bio-Peak</p>
            </div>

            {/* Market Pressure */}
            <div className={`bg-white/5 border rounded-2xl p-3 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75 ${
                isSyncPanicSoon ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/10'
            }`}>
                <p className="text-[8px] text-gray-500 uppercase tracking-widest font-black mb-1">Market</p>
                <div className={`text-xl font-black ${isSyncPanicSoon ? 'text-amber-500' : 'text-mint'}`}>
                    {isSyncPanicSoon ? 'LOW' : 'STABLE'}
                </div>
                <p className="text-[7px] text-gray-400 mt-1 uppercase font-bold">Price Odds</p>
            </div>

            {/* Weather Risk */}
            <div className={`bg-white/5 border rounded-2xl p-3 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150 ${
                hasWeatherRisk ? 'border-red-500/30 bg-red-500/5' : 'border-white/10'
            }`}>
                <p className="text-[8px] text-gray-500 uppercase tracking-widest font-black mb-1">Weather</p>
                <div className={`text-xl font-black ${hasWeatherRisk ? 'text-red-500' : 'text-mint'}`}>
                    {hasWeatherRisk ? 'RISK' : 'CLEAR'}
                </div>
                <p className="text-[7px] text-gray-400 mt-1 uppercase font-bold">Field-Loss</p>
            </div>
            
            {/* Detailed Tactical Logic Dropdown Hint */}
            <div className="col-span-3 bg-mint/10 border border-mint/20 rounded-xl px-3 py-2 flex items-center justify-between">
                 <div className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${verdict?.action_priority === 'STRATEGIC' ? 'bg-amber-500 animate-pulse' : 'bg-mint'}`}></div>
                    <span className="text-[9px] text-white font-bold uppercase tracking-tight">
                        Tactical: {verdict?.action_priority || 'Standard'} Path
                    </span>
                 </div>
                 <span className="text-[8px] text-mint font-black">Score: {verdict?.confidence_score || 0}%</span>
            </div>
        </div>
    );
}
