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

import { LogisticsCalculator } from '@/components/dashboard/LogisticsCalculator';

export default function MarketMapsPage() {
    const { t, n } = useLanguage();

    const { cachedData, saveRouteToIDB } = useOfflineCache('dashboard_recommendation');
    const [routingData, setRoutingData] = useState<any>(null);
    const [isRoutingLoading, setIsRoutingLoading] = useState(false);
    const [selectedMandi, setSelectedMandi] = useState<any>(null);
    const [selectedRouteObject, setSelectedRouteObject] = useState<any>(null);
    const [isVakeelThinking, setIsVakeelThinking] = useState(false);

    // Phase 3 State
    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    const [isHired, setIsHired] = useState(true);

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
                const optimalRoute = json.routes.find((r: any) => r.id === json.optimal_id) || json.routes[0];
                setSelectedRouteObject(optimalRoute);
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

    const handleAskVakeel = async () => {
        if (!selectedRouteObject) return;
        setIsVakeelThinking(true);
        // This is a mock interaction - in production we'd send context to the chatbot
        setTimeout(() => setIsVakeelThinking(false), 2000);
    };

    // Fallback to empty array if data isn't loaded yet
    const data = cachedData || { regional_options: [] };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-24">

                {/* Left Side: Map and Analysis (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    <GlassCard className="p-0 overflow-hidden relative border-white/5">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-lg bg-mint/10 flex items-center justify-center border border-mint/20">
                                    <svg className="w-4 h-4 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L16 4m0 13V4m0 0L9 7" />
                                    </svg>
                                </div>
                                <h2 className="text-lg font-bold text-white uppercase tracking-tight">{t('spatialProfitAnalysis') || 'Logistics Intelligence'}</h2>
                            </div>
                            <StatusPill status="GREEN" message={t('liveGPSTransitData')} />
                        </div>

                        {/* Transit Map Integration */}
                        <div className="border-b border-white/5 relative">
                            <TransitMap 
                                startLoc={startLoc}
                                endLoc={{ 
                                    lat: selectedMandi?.lat || data.regional_options?.[0]?.lat || 18.5204 + 0.1, 
                                    lng: selectedMandi?.lng || data.regional_options?.[0]?.lng || 73.8567 + 0.1 
                                }}
                                routes={routingData?.routes || []}
                                optimalRouteId={routingData?.optimal_id}
                                onRouteSelect={(route) => setSelectedRouteObject(route)}
                            />
                        </div>

                        {/* Route Intelligence Briefing (Inline) */}
                        {selectedRouteObject && (
                            <div className="p-6 bg-mint/[0.03] transition-all duration-500">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-mint mb-1 flex items-center">
                                            <span className="w-1.5 h-1.5 rounded-full bg-mint mr-2 animate-pulse" />
                                            AI Intelligence Briefing
                                        </h3>
                                        <p className="text-white font-bold text-lg">{selectedRouteObject.name} Analysis</p>
                                    </div>
                                    <button 
                                        onClick={handleAskVakeel}
                                        disabled={isVakeelThinking}
                                        className="flex items-center space-x-2 bg-forest border border-mint/30 hover:bg-mint/10 px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(32,255,189,0.1)] group"
                                    >
                                        <svg className={`w-4 h-4 ${isVakeelThinking ? 'animate-spin text-mint' : 'text-mint'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                        </svg>
                                        <span className="text-xs font-bold text-white group-hover:text-mint transition-colors">
                                            {isVakeelThinking ? 'Vakeel is Thinking...' : 'Ask Agri-Vakeel'}
                                        </span>
                                    </button>
                                </div>
                                <div className="p-4 rounded-xl bg-forest/40 border border-white/5 backdrop-blur-sm">
                                    <p className="text-sm text-gray-300 italic leading-relaxed font-medium">
                                        "{selectedRouteObject.justification || selectedRouteObject.description}"
                                    </p>
                                </div>
                            </div>
                        )}
                    </GlassCard>

                </div>

                <div className="lg:col-span-1 space-y-6">
                    <GlassCard className="flex flex-col border-white/5">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                            <h2 className="text-xl font-bold text-white tracking-tight">{t('marketOrbit')}</h2>
                            <span className="text-[10px] font-mono text-mint border border-mint/20 px-2 py-0.5 rounded-full">{t('liveData')}</span>
                        </div>

                        <div className="p-4 space-y-4 max-h-[800px] overflow-y-auto custom-scrollbar">
                            {data.regional_options.length === 0 && (
                                <p className="text-gray-400 text-sm text-center py-8">{t('noAlternatives')}</p>
                            )}

                            {data.regional_options.map((option: any, index: number) => {
                                const isSelected = selectedMandi?.mandi_name === option.mandi_name;
                                
                                // Phase 3: Dynamic Vehicle Logic
                                const currentVehicle = cachedData?.logistics_recommendations?.find((v: any) => v.id === (selectedVehicleId || cachedData?.logistics_recommendations[0]?.id));
                                const activeYield = cachedData?.yield_quintals || 50;
                                
                                let displayProfit = option.total_net_profit;
                                let displaySpoilage = (option.transport_cost_inr || 0) + (option.quality_loss_inr || 0);

                                if (currentVehicle) {
                                    const transportCost = isHired ? currentVehicle.total_cost : currentVehicle.total_cost * 0.4;
                                    const spoilagePct = currentVehicle.spoilage_risk_pct / 100;
                                    const grossRev = option.market_price * activeYield;
                                    const spoilagePenalty = spoilagePct * grossRev;
                                    
                                    displaySpoilage = transportCost + spoilagePenalty;
                                    displayProfit = grossRev - displaySpoilage;
                                }

                                const hasHighSpoilage = (displaySpoilage / (option.market_price * activeYield)) > 0.05;

                                return (
                                    <div
                                        key={index}
                                        onClick={() => handleMandiSelect(option)}
                                        className={`relative p-4 rounded-xl border transition-all cursor-pointer group ${
                                            isSelected
                                            ? 'bg-mint/10 border-mint/40 shadow-[0_0_20px_rgba(32,255,189,0.1)] ring-1 ring-mint/30'
                                            : index === 0
                                            ? 'bg-mint/[0.05] border-mint/10'
                                            : 'bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.05]'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className={`font-bold transition-colors ${isSelected ? 'text-mint' : 'text-white'}`}>
                                                    {option.mandi_name}
                                                </h4>
                                                <p className="text-[10px] text-gray-500 mt-0.5">
                                                    {n(roundVal(option.distance_km))} km • {n((option.distance_km * 1.5).toFixed(0))} mins
                                                </p>
                                            </div>
                                            {index === 0 && (
                                                <span className="bg-mint text-forest text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">OPTIMAL</span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                                            <div>
                                                <span className="text-[9px] text-gray-500 uppercase block">Profit</span>
                                                <span className="text-sm font-bold text-white font-mono">₹{n(Math.round(displayProfit))}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] text-gray-500 uppercase block">Spoilage + Cost</span>
                                                <span className={`text-sm font-bold font-mono ${hasHighSpoilage ? 'text-red-400' : 'text-gray-400'}`}>
                                                    -₹{n(Math.round(displaySpoilage))}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </GlassCard>


                    {/* Phase 3: Logistics Orchestration */}
                    {cachedData?.logistics_recommendations && (
                        <LogisticsCalculator 
                            recommendations={cachedData.logistics_recommendations}
                            sharedLogistics={cachedData.shared_logistics}
                            yieldQtl={cachedData.yield_quintals || 50}
                            onVehicleSelect={(id) => {
                                setSelectedVehicleId(id);
                                // Trigger recalculation or local UI update if needed
                            }}
                            onTransportTypeToggle={(hired) => {
                                setIsHired(hired);
                            }}
                        />
                    )}

                    {/* Logic Detail Card */}
                    <GlassCard className="p-6 border-white/5 bg-white/[0.02]">
                        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">{t('routeOptimizationLogic')}</h2>
                        <div className="space-y-4 font-mono text-sm">
                            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                <span className="text-gray-500 text-[10px] uppercase">{t('transportRate')}</span>
                                <span className="text-white font-bold">₹{n(15.0)} / {t('km')}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                <span className="text-gray-500 text-[10px] uppercase">{t('baseTransitSpeed')}</span>
                                <span className="text-white font-bold">{n(30)} {t('kmPerHour')}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-[10px] uppercase">Analysis Mode</span>
                                <span className="text-mint font-bold uppercase tracking-wider">{t('enabled')}</span>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>

            <VoiceAssistant dashboardData={cachedData} />
        </div>
    );
}

function roundVal(num: number) {
    return Math.round(num * 10) / 10;
}
