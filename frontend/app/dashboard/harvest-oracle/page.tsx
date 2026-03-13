"use client";

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/glass-card';
import { StatusPill } from '@/components/status-pill';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchProfile } from '@/services/user';
import { getWeatherForecast } from '@/services/weatherService';
import { getClusterMaturityHeatmap } from '@/services/supplyOrchestrator';
import { HarvestScorecard } from '@/components/dashboard/HarvestScorecard';
import { MaturityClock } from '@/components/dashboard/MaturityClock';
import Link from 'next/link';

export default function HarvestOraclePage() {
    const { t, n } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [oracleData, setOracleData] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const userProfile = await fetchProfile();
                setProfile(userProfile);

                if (userProfile) {
                    const lat = userProfile.latitude || 18.5204;
                    const lon = userProfile.longitude || 73.8567;
                    const crop = userProfile.crop || "Tomato";
                    const plantingDate = userProfile.planting_date || new Date().toISOString().split('T')[0];

                    const [forecast, heatmap] = await Promise.all([
                        getWeatherForecast(lat, lon),
                        getClusterMaturityHeatmap("422201")
                    ]);

                    const res = await fetch('/api/oracle/forecast', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            planting_date: plantingDate,
                            crop: crop,
                            sync_panic_days: heatmap,
                            weather_forecast: forecast
                        })
                    });

                    if (res.ok) {
                        setOracleData(await res.json());
                    }
                }
            } catch (err) {
                console.error("Failed to load oracle data", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#1B3022]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-24">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <Link href="/dashboard" className="text-mint text-xs font-black uppercase tracking-widest hover:underline flex items-center mb-2">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-black text-white tracking-tight">Harvest Oracle <span className="text-mint">Tactics</span></h1>
                    <p className="text-gray-400 text-sm mt-1">Deep analysis of maturity, market pressure, and weather risks.</p>
                </div>
                {oracleData?.oracle_verdict && (
                    <StatusPill 
                        status={oracleData.oracle_verdict.verdict === 'SELL' ? 'RED' : 'GREEN'} 
                        message={oracleData.oracle_verdict.verdict}
                        className="scale-110"
                    />
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Maturity Status */}
                <GlassCard className="lg:col-span-1 flex flex-col items-center justify-center p-8">
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-8">Biological Maturity</h3>
                    <MaturityClock 
                        maturityPct={oracleData?.current_maturity_pct || 0}
                        daysToPeak={oracleData?.days_to_peak || 0}
                        windowStart={oracleData?.ideal_window_start || ""}
                        windowEnd={oracleData?.ideal_window_end || ""}
                        status={oracleData?.current_maturity_pct >= 95 ? 'IDEAL' : 'WAIT'}
                    />
                </GlassCard>

                {/* Tactical Scorecard & Audit */}
                <div className="lg:col-span-2 space-y-6">
                    <GlassCard className="p-6">
                        <h3 className="text-xs font-black text-mint uppercase tracking-[0.2em] mb-6">Decision Matrix Scorecard</h3>
                        <HarvestScorecard 
                            maturityPct={oracleData?.current_maturity_pct || 0}
                            syncPanicDays={oracleData?.tactical_context?.sync_panic_days || []}
                            weatherForecast={oracleData?.tactical_context?.weather_forecast || []}
                            verdict={oracleData?.oracle_verdict}
                        />

                        <div className="mt-8 p-6 bg-black/40 rounded-3xl border border-white/10 relative overflow-hidden group">
                           <div className="absolute top-0 left-0 w-1 h-full bg-mint group-hover:w-2 transition-all"></div>
                           <h4 className="text-[10px] text-mint font-black uppercase tracking-widest mb-4 flex items-center">
                               <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                               </svg>
                               Oracle Logic Audit Log
                           </h4>
                           <p className="text-lg text-white font-bold leading-relaxed italic pr-4">
                               "{oracleData?.oracle_verdict?.explanation}"
                           </p>
                           <div className="mt-6 flex items-center space-x-4">
                               <div className="text-[10px] text-gray-500 font-mono">
                                   CONFIDENCE: <span className="text-mint font-black">{oracleData?.oracle_verdict?.confidence_score}%</span>
                               </div>
                               <div className="text-[10px] text-gray-500 font-mono">
                                   PRIORITY: <span className="text-mint font-black">{oracleData?.oracle_verdict?.action_priority}</span>
                               </div>
                           </div>
                        </div>
                    </GlassCard>

                    {/* Educational Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GlassCard className="p-5 border-white/5 bg-white/[0.02]">
                            <h4 className="text-[10px] text-gray-400 font-black uppercase mb-3 tracking-widest">What is GDD?</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Growing Degree Days (GDD) track the accumulated heat your crop has absorbed. Unlike calendar days, GDD accurately reflects biological maturity based on real local weather, ensuring you don't harvest too early or late.
                            </p>
                        </GlassCard>
                        <GlassCard className="p-5 border-white/5 bg-white/[0.02]">
                            <h4 className="text-[10px] text-gray-400 font-black uppercase mb-3 tracking-widest">Market Sync-Panic</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                We analyze regional sowing patterns to predict when neighbors will harvest. A "Sync-Panic" occurs when {'>'}20% harvest simultaneously, causing local gluts. We help you exit early to beat the price crash.
                            </p>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </div>
    );
}
