'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { GlassCard } from '@/components/glass-card';
import { useOfflineCache } from '@/hooks/useOfflineCache';
import { StatusPill } from '@/components/status-pill';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { VoiceAssistant } from '@/components/voice-assistant';

const TransitMap = dynamic(() => import('@/components/dashboard/TransitMap'), { 
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-forest/50 animate-pulse rounded-2xl border border-white/5" />
});

export default function MarketMapsPage() {
    const { t, n } = useLanguage();

    const { cachedData, saveRouteToIDB } = useOfflineCache('dashboard_recommendation');
    const [routingData, setRoutingData] = useState<any>(null);
    const [isRoutingLoading, setIsRoutingLoading] = useState(false);
    const [selectedMandi, setSelectedMandi] = useState<any>(null);

    // Get current location (from user profile or default)
    const startLoc = cachedData?.user_location || { lat: 18.5204, lng: 73.8567 };
    const activeShock = cachedData?.shock_alert;

    const fetchRouting = async (targetMandi: any) => {
        if (!targetMandi || isRoutingLoading) return;
        
        // Ensure mandi has coords even if stripped in cache
        const mandiLat = targetMandi.lat || 18.5204 + 0.1;
        const mandiLng = targetMandi.lng || 73.8567 + 0.1;
        
        setIsRoutingLoading(true);
        try {
            const res = await fetch('/api/routing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    crop: cachedData?.crop || "Tomato",
                    start_loc: startLoc,
                    end_loc: { lat: mandiLat, lng: mandiLng },
                    yield_qtl: cachedData?.yield_quintals || 50,
                    storage_type: cachedData?.storage_type || "Open Field",
                    transport_type: cachedData?.transport_type || "Open Trolley",
                    market_price: targetMandi.market_price
                })
            });

            if (res.ok) {
                const json = await res.json();
                setRoutingData(json);
                const routeId = `route_${targetMandi.mandi_name.replace(/\s+/g, '_')}_${Date.now()}`;
                saveRouteToIDB(routeId, json);
            }
        } catch (err) {
            console.error("Routing fetch failed", err);
        } finally {
            setIsRoutingLoading(false);
        }
    };

    useEffect(() => {
        if (cachedData?.regional_options?.[0]) {
            const initialMandi = cachedData.regional_options[0];
            setSelectedMandi(initialMandi);
            fetchRouting(initialMandi);
        }
    }, [cachedData?.regional_options]);

    const handleMandiSelect = (mandi: any) => {
        setSelectedMandi(mandi);
        fetchRouting(mandi);
    };

    // Fallback to empty array if data isn't loaded yet
    const data = cachedData || { regional_options: [] };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
            <header className="relative z-50 flex flex-col mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">{t('marketMaps')}</h1>
                        <p className="text-sm text-gray-400">{t('regionalAnalysis')}</p>
                    </div>
                    {activeShock?.pivot_mandi && (
                        <div className="bg-red-500/20 border border-red-500/50 px-4 py-2 rounded-xl text-right">
                            <span className="text-xs text-red-400 font-bold uppercase tracking-wider block">{t('activeReroute')}</span>
                            <span className="text-white text-sm">{t('pivotingTo')}: {activeShock.pivot_mandi.mandi_name}</span>
                        </div>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-24">

                {/* Visual "Map" Alternative - Logistics List */}
                <GlassCard className="col-span-1 lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-mint/10 border border-mint/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L16 4m0 13V4m0 0L9 7" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-white">{t('spatialProfitAnalysis')}</h2>
                        </div>
                        <StatusPill status="GREEN" message={t('liveGPSTransitData')} />
                    </div>

                    <p className="text-gray-400 text-sm mb-6 max-w-2xl">
                        {t('evaluatingDestinations')}
                    </p>

                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white">{t('marketOrbit')}</h3>
                        <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-mint animate-pulse"></span>
                            <span className="text-xs font-mono text-mint tracking-wider">{t('liveData')}</span>
                        </div>
                    </div>

                    {/* Transit Map Integration */}
                    <div className="mb-8 rounded-2xl overflow-hidden border border-white/5 relative h-[400px]">
                        <TransitMap 
                            startLoc={startLoc}
                            endLoc={{ 
                                lat: selectedMandi?.lat || data.regional_options?.[0]?.lat || 18.5204 + 0.1, 
                                lng: selectedMandi?.lng || data.regional_options?.[0]?.lng || 73.8567 + 0.1 
                            }}
                            routes={routingData?.routes || []}
                            optimalRouteId={routingData?.optimal_id}
                        />
                    </div>

                    <div className="space-y-4">
                        {data.regional_options.length === 0 && (
                            <p className="text-gray-400 text-sm text-center py-4">{t('noAlternatives')}</p>
                        )}

                        {data.regional_options.map((option: any, index: number) => {
                            const isOptimal = index === 0;
                            const hasHighSpoilage = option.quality_loss_inr > 300; // Mock threshold

                            return (
                                <div
                                    key={index}
                                    onClick={() => handleMandiSelect(option)}
                                    className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
                                        (selectedMandi?.mandi_name === option.mandi_name)
                                        ? 'bg-mint/10 border-mint/30 shadow-[0_0_15px_rgba(32,255,189,0.1)] ring-1 ring-mint/50'
                                        : isOptimal
                                        ? 'bg-mint/5 border-mint/10'
                                        : hasHighSpoilage
                                            ? 'bg-red-500/5 border-red-500/20'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    {/* Top Row: Name and Status */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-bold text-white text-lg">{t('mandiName')}: {option.mandi_name}</h4>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <span className="text-xs text-gray-400 flex items-center">
                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    {n(roundVal(option.distance_km))} {t('km') || 'km'} {t('distance')}
                                                </span>
                                                <span className="text-gray-600 text-xs">•</span>
                                                <span className="text-xs text-gray-400 flex items-center">
                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {n((option.distance_km * 1.5).toFixed(0))} {t('mins') || 'mins'}
                                                </span>
                                            </div>
                                        </div>
                                        {isOptimal && (
                                            <span className="bg-mint text-forest text-[10px] font-bold px-2 py-1 rounded-full animate-pulse shadow-[0_0_10px_rgba(32,255,189,0.5)]">
                                                {t('optimalRoute')}
                                            </span>
                                        )}
                                        {hasHighSpoilage && !isOptimal && (
                                            <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold px-2 py-1 rounded">
                                                {t('deadZone')}
                                            </span>
                                        )}
                                    </div>

                                    {/* Warning Banner */}
                                    {hasHighSpoilage && (
                                        <div className="mb-3 px-3 py-2 bg-red-500/10 border-l-2 border-red-500 text-xs text-red-300 flex items-center">
                                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            {t('warningSpoilage')} (<span className="text-red-400 ml-1 font-mono">₹{n(option.quality_loss_inr)}</span>)
                                        </div>
                                    )}

                                    {/* Financial Metrics */}
                                    <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/5">
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{t('price')}</p>
                                            <p className="font-mono text-sm text-gray-300">₹{n(option.market_price)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{t('logiSpoilage')}</p>
                                            <p className="font-mono text-sm text-red-400">
                                                -₹{n((option.transport_cost_inr || 0) + (option.quality_loss_inr || 0))}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Net Profit Row */}
                                    <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-end">
                                        <p className="text-xs font-medium text-gray-400">{t('takeHomeProfit')}</p>
                                        <p className="font-mono text-lg font-bold text-white">
                                            ₹{n(option.total_net_profit)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </GlassCard>

                <GlassCard className="h-48 flex flex-col justify-center p-6">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">{t('routeOptimizationLogic')}</h2>
                    <div className="space-y-4 font-mono text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">{t('transportRate') || 'Transport Rate'}</span>
                            <span className="text-white">₹{n(15.0)} / {t('km') || 'km'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">{t('baseTransitSpeed') || 'Base Transit Speed'}</span>
                            <span className="text-white">{n(30)} {t('kmPerHour') || 'km/hr'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">{t('q10SpoilageActive') || 'Q10 Spoilage Active'}</span>
                            <span className="text-mint ml-2">{t('enabled') || 'ENABLED'}</span>
                        </div>
                    </div>
                </GlassCard>
            </div>

            <VoiceAssistant dashboardData={cachedData} />
        </div>
    );
}

// helper
function roundVal(num: number) {
    return Math.round(num * 10) / 10;
}
