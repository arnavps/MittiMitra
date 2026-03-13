"use client";

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/glass-card';
import { StatusPill } from '@/components/status-pill';
import { ShockAlertBanner } from '@/components/shock-alert-banner';
import { VoiceAssistant } from '@/components/voice-assistant';
import { MandiTable } from './MandiTable';
import { useGPS } from '@/hooks/useGPS';
import { useOfflineCache } from '@/hooks/useOfflineCache';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { VerdictCard } from './VerdictCard';
import { MetricsGrid } from './MetricsGrid';
import { AuditSummaryCard } from './AuditSummaryCard';
import { ManualOverrideModal } from '@/components/dashboard/ManualOverrideModal';
import { VakeelBrief } from '@/components/dashboard/VakeelBrief';
import { auth } from '@/services/firebase';

export default function DashboardPage() {
    const { t, n, language } = useLanguage();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [lastFetched, setLastFetched] = useState<Date | null>(null);
    const [profileName, setProfileName] = useState('');
    const [userCrop, setUserCrop] = useState('');
    const [yieldEst, setYieldEst] = useState<number | null>(null);
    const [plantingDate, setPlantingDate] = useState('');
    const [profileLoaded, setProfileLoaded] = useState(false);
    const [oracleData, setOracleData] = useState<any>(null);
    const [clusterData, setClusterData] = useState<any>(null);
    const [vakeelQuery, setVakeelQuery] = useState('');
    const [isCropSelectorOpen, setIsCropSelectorOpen] = useState(false);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [manualLocation, setManualLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [profileLocation, setProfileLocation] = useState<{ lat: number, lng: number } | null>(null);

    const availableCrops = ["Tomato", "Potato", "Onion", "Soybean", "Wheat", "Cotton"];
    const hubs = [
        { name: "Nashik, MH", lat: 19.9975, lng: 73.7898 },
        { name: "Pune, MH", lat: 18.5204, lng: 73.8567 },
        { name: "Nagpur, MH", lat: 21.1458, lng: 79.0882 },
        { name: "Indore, MP", lat: 22.7196, lng: 75.8577 },
        { name: "Karnal, HR", lat: 29.6857, lng: 76.9907 }
    ];

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const phone = auth.currentUser?.phoneNumber || localStorage.getItem('demo_phone') || "9999999999";
                const { supabase } = await import('@/utils/supabase/client');
                
                const { data } = await supabase
                    .from('profiles')
                    .select('name, crop, yield_quintals, latitude, longitude, planting_date')
                    .eq('phone', phone)
                    .single();
                if (data?.name) setProfileName(data.name);
                if (data?.crop) setUserCrop(data.crop);
                if (data?.planting_date) setPlantingDate(data.planting_date);
                if (data?.yield_quintals) {
                    setYieldEst(data.yield_quintals);
                } else {
                    setYieldEst(50); // ultimate fallback
                }
                if (data?.latitude && data?.longitude) {
                    setProfileLocation({ lat: data.latitude, lng: data.longitude });
                }
                setProfileLoaded(true);
            } catch (error) {
                console.error("Failed to fetch profile in topbar");
                setYieldEst(50);
                setProfileLoaded(true);
            }
        };
        fetchProfile();
    }, []);

    // Manual Overrides State
    const [overrides, setOverrides] = useState<Record<string, number>>({});
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        metric: string;
        value: number;
        unit: string;
    }>({ isOpen: false, metric: '', value: 0, unit: '' });

    const { location, requestLocation } = useGPS();
    const { isOnline, cachedData, saveToCache, calculateOfflineSpoilage } = useOfflineCache('dashboard_recommendation');

    // Trigger re-calculation when overrides or yield change locally
    const recalculateWithOverrides = (currentData: any, newOverrides: Record<string, number>, newYield?: number) => {
        if (!currentData) return;
        const updated = JSON.parse(JSON.stringify(currentData)); // Deep clone
        const activeYield = newYield ?? (yieldEst || 50);

        // Mocking the backend logic for immediate UI response
        const tempKey = t('temp') || 'Temperature';
        const soilKey = t('soilMoisture') || 'Soil Moisture';

        if (newOverrides[tempKey]) {
            updated.weather.temperature_c = newOverrides[tempKey];
            
            // Offline math fallback
            const offlineSpoilageRisk = calculateOfflineSpoilage(0.005, newOverrides[tempKey], 20.0, 48.0);
            updated.spoilage_risk_pct = offlineSpoilageRisk;

            if (newOverrides[tempKey] > 35) {
                updated.net_realization_inr -= 500;
            }
        }

        if (newOverrides[soilKey]) {
            updated.weather.soil_moisture_percent = newOverrides[soilKey];
            if (newOverrides[soilKey] > 70) {
                updated.status = "YELLOW";
            }
        }

        const priceKey = t('price') || 'Market Price';

        if (newOverrides[priceKey]) {
            updated.mandi_stats.current_price = newOverrides[priceKey];
            const logisticsPerQ = (updated.breakdown?.logistics_cost || 0) / (updated.yield_quintals || activeYield);
            const qualityLossPct = (updated.breakdown?.quality_loss_pct || 2) / 100;
            const spoilagePerQ = newOverrides[priceKey] * qualityLossPct;
            updated.net_realization_inr_per_quintal = newOverrides[priceKey] - logisticsPerQ - spoilagePerQ;
        }

        const perQuintal = updated.net_realization_inr_per_quintal || (updated.total_net_profit / (updated.yield_quintals || activeYield));
        updated.total_net_profit = Math.round(perQuintal * activeYield);
        updated.yield_quintals = activeYield;

        updated.breakdown.gross_revenue = updated.mandi_stats.current_price * activeYield;
        updated.breakdown.logistics_cost = currentData.breakdown?.logistics_cost ?? 0;
        updated.breakdown.spoilage_penalty = ((updated.mandi_stats?.quality_loss_pct ?? 2) / 100) * updated.breakdown.gross_revenue;

        updated.total_net_profit = updated.breakdown.gross_revenue - updated.breakdown.logistics_cost - updated.breakdown.spoilage_penalty;
        updated.net_realization_inr_per_quintal = updated.total_net_profit / activeYield;

        updated.is_manual_override = true;
        updated.manual_override_count = Object.keys(newOverrides).length;
        setData(updated);
    };

    const handleMetricClick = (metric: string, value: number, unit: string) => {
        setModalConfig({ isOpen: true, metric, value, unit });
    };

    const handleSaveOverride = (newValue: number) => {
        const newOverrides = { ...overrides, [modalConfig.metric]: newValue };
        setOverrides(newOverrides);
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        recalculateWithOverrides(data, newOverrides);
    };

    const fetchRecommendation = async (isDemo = false) => {
        setLoading(true);
        try {
            if (!isOnline && cachedData && !isDemo) {
                setData(cachedData);
                setLoading(false);
                return;
            }

            const payload = {
                crop: userCrop || "",
                location: manualLocation || (location ? { lat: location.latitude, lng: location.longitude } : (profileLocation || { lat: 18.5204, lng: 73.8567 })), // Fallback order: Manual -> GPS -> Profile -> Pune
                yield_est_quintals: yieldEst,
                base_spoilage_rate: 0.05,
                language: language
            };

            const backendUrl = `/api/recommendation`;
            const res = await fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const json = await res.json();

                // Demo Mode Override logic
                if (isDemo) {
                    json.mandi_stats.current_price *= 0.6; // 40% drop
                    json.mandi_stats.current_volume_quintals *= 3; // Massive spike
                    json.status = "RED";
                    json.shock_alert = {
                        is_shock: true,
                        message: "CRITICAL: Price crashed by 3.5σ below the 7-day average. Massive volume spike detected!",
                        pivot_advice: "EMERGENCY: Sudden price crash detected. Redirecting you to the nearest cold storage to save your asset."
                    };
                    if (json.regional_options && json.regional_options.length > 1) {
                        const pivot = json.regional_options[1];
                        const savings = Math.max(3000, pivot.total_net_profit - (json.mandi_stats.current_price * (yieldEst || 50)));
                        json.shock_alert.pivot_advice = `Warning: Prices at ${json.mandi_stats.name} just fell. Rerouting to ${pivot.mandi_name} to save ₹${Math.floor(savings)}.`;
                        json.shock_alert.pivot_mandi = pivot;
                        json.shock_alert.savings_inr = savings;
                    }
                }

                setData(json);
                setLastFetched(new Date());

                // Fetch Oracle & Ecosystem Data in parallel
                try {
                    const [oracleRes, clusterRes] = await Promise.all([
                        fetch('/api/oracle/forecast', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                planting_date: plantingDate || data?.planting_date || new Date().toISOString().split('T')[0], 
                                crop: userCrop || data?.crop || "Tomato" 
                            })
                        }),
                        fetch('/api/ecosystem/cluster', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                lat: payload.location.lat,
                                lon: payload.location.lng,
                                target_mandi: json.mandi_stats.name,
                                harvest_date: new Date().toISOString().split('T')[0],
                                user_yield_qtl: yieldEst || 50,
                                market_price: json.mandi_stats.current_price
                            })
                        })
                    ]);
                    
                    if (oracleRes.ok) setOracleData(await oracleRes.json());
                    if (clusterRes.ok) setClusterData(await clusterRes.json());
                } catch (err) {
                    console.error("Secondary data fetch failed", err);
                }
                saveToCache(json);
            }
        } catch (err) {
            console.error("Failed to fetch recommendation", err);
            if (cachedData) setData(cachedData);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!location) {
            requestLocation();
        }
    }, [requestLocation, location]);

    useEffect(() => {
        if (profileLoaded) {
            fetchRecommendation();
        }
    }, [isOnline, userCrop, location, profileLoaded]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint"></div>
            </div>
        );
    }

    const mandiList = data?.regional_options ? data.regional_options.map((option: any, index: number) => ({
        id: index.toString(),
        name: option.mandi_name,
        distanceKm: roundVal(option.distance_km),
        currentPrice: option.market_price,
        netProfit: option.total_net_profit,
        isOptimal: index === 0 // The backend sorts by most profitable first
    })) : [];

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">

            {/* Header */}
            <header className="relative z-50 flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center space-x-3 mb-2">
                        <h1 className="text-2xl font-bold tracking-tight text-white uppercase tracking-tighter">{t('decisionHub') || "Decision Hub"}</h1>
                        <button
                            onClick={() => setIsCropSelectorOpen(true)}
                            className="group flex items-center space-x-2 bg-mint/10 hover:bg-mint/20 border border-mint/30 px-2 py-0.5 rounded-full transition-all"
                        >
                            <span className="text-mint text-[10px] font-black uppercase tracking-widest">
                                {userCrop || t('selectCrop') || "Select Crop"}
                            </span>
                            <svg className="w-3 h-3 text-mint opacity-50 group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                    </div>
                    <div className="flex items-center space-x-3">
                        {!isOnline && (
                            <span className="bg-red-500/20 border border-red-500/50 text-red-400 text-xs px-2 py-0.5 rounded-full flex items-center">
                                <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-1.5 animate-pulse"></span>
                                {t('offlineMode')}
                            </span>
                        )}
                        <p className="text-sm text-gray-400">{t('temporalArbitrageEngine')}</p>
                        <div className="flex items-center space-x-3 ml-4 border-l border-white/10 pl-4 py-0.5">
                            <button
                                onClick={() => setIsLocationModalOpen(true)}
                                className="group flex items-center space-x-1.5 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-md border border-white/10 transition-all"
                            >
                                <svg className="w-3 h-3 text-mint group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                                    {manualLocation ? (t('customFix') || "Custom Fix") : location ? (t('liveGps') || "Live GPS") : (t('puneHub') || "Pune Hub")}
                                </span>
                            </button>

                            <div className="flex items-center space-x-1.5 border-l border-white/10 pl-4">
                                <span className="w-1.5 h-1.5 bg-mint rounded-full animate-pulse"></span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">
                                    {t('lastSync') || 'Last Sync'}: {lastFetched ? lastFetched.toLocaleTimeString(language === 'en' ? 'en-IN' : `${language}-IN`, { hour: '2-digit', minute: '2-digit' }) : (t('justNow') || "Just Now")}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex space-x-3 items-center">
                    <button
                        onClick={() => fetchRecommendation(true)}
                        className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-full transition-colors font-medium border-dashed"
                    >
                        {t('simulateShock')}
                    </button>
                    <div className="w-10 h-10 rounded-full bg-glass-bg border border-glass-border flex items-center justify-center text-mint font-bold shadow-inner">
                        {profileName ? profileName.charAt(0).toUpperCase() : 'U'}
                    </div>
                </div>
            </header>

            {/* Shock Alert Banner */}
            {(data?.shock_alert?.is_shock || data?.shock_analysis?.z_score > 2) && (
                <ShockAlertBanner
                    message={data?.shock_alert?.message || 'High market volatility detected.'}
                    pivotAdvice={data?.shock_alert?.pivot_advice || ''}
                />
            )}

            {/* Main Content Layout - 12 Column Grid for Precision */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Panel: Primary Recommendation & Key Metrics (Span 8) */}
                <div className="lg:col-span-8 space-y-8 flex flex-col">
                    <VerdictCard 
                        data={data} 
                        userCrop={userCrop} 
                        onExplain={(q) => setVakeelQuery(q)} 
                        oracleData={oracleData}
                        clusterData={clusterData}
                    />
                    
                    <MetricsGrid 
                        data={data} 
                        onMetricClick={handleMetricClick} 
                        onExplain={(q: string) => setVakeelQuery(q)}
                    />
                </div>

                {/* Right Column: Analytics & Calibration (Span 4) */}
                <div className="lg:col-span-4 space-y-6 flex flex-col group">
                    {/* Market Orbit - Desktop & Mobile Order Priority */}
                    <div className="order-1 lg:order-1">
                        <GlassCard className="h-full">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-white">{t('marketOrbit')}</h3>
                                <StatusPill status="GREEN" message={t('liveData')} />
                            </div>

                            <p className="text-sm text-gray-400 mb-6">{t('mandiDesc')}</p>
                            <MandiTable mandis={mandiList} />
                        </GlassCard>
                    </div>

                    {/* Yield Calibration Card */}
                    <div className="order-2 lg:order-2">
                        <GlassCard className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">{t('yieldCalibration') || 'Yield Calibration'}</h3>
                                <span className="text-mint font-mono font-bold text-xl">{n(yieldEst || 50)} {t('qtl') || 'Qtl'}</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="500"
                                value={yieldEst || 50}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setYieldEst(val);
                                    recalculateWithOverrides(data, overrides, val);
                                }}
                                onMouseUp={() => fetchRecommendation()}
                                onTouchEnd={() => fetchRecommendation()}
                                className="w-full h-1.5 bg-mint/20 rounded-lg appearance-none cursor-pointer accent-mint mb-2"
                            />
                            <div className="flex justify-between text-[10px] text-gray-500 font-bold">
                                <span>{n(1)} {t('qtl') || 'QTL'}</span>
                                <span>{t('totalFieldEst') || 'TOTAL FIELD ESTIMATE'}</span>
                                <span>{n(500)} {t('qtl') || 'QTL'}</span>
                            </div>
                        </GlassCard>
                    </div>


                    {/* Logistics Audit Card (Phase 1.5) */}
                    {data?.logistics_audit && (
                        <div className="order-3 lg:order-3">
                            <AuditSummaryCard auditData={data.logistics_audit} />
                        </div>
                    )}
                </div>
            </div>

            {/* AI Contextual Summary (Vakeel Brief) */}
            <VakeelBrief brief={data?.vakeel_brief} />

            {/* Floating Voice Assistant */}
            <VoiceAssistant dashboardData={data} initialQuery={vakeelQuery} />

            {/* Manual Override Modal */}
            <ManualOverrideModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                currentValue={modalConfig.value}
                metricLabel={modalConfig.metric}
                unit={modalConfig.unit}
                onSave={handleSaveOverride}
            />
            {/* Crop Selector Modal */}
            {isCropSelectorOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <GlassCard className="max-w-md w-full p-8 shadow-2xl border-mint/20">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                            <svg className="w-6 h-6 text-mint mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            {t('correctionSelectCrop') || 'Correction: Select Active Crop'}
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            {availableCrops.map(crop => (
                                <button
                                    key={crop}
                                    onClick={() => {
                                        setUserCrop(crop);
                                        setIsCropSelectorOpen(false);
                                    }}
                                    className={`p-4 rounded-xl border text-sm font-bold transition-all ${userCrop === crop
                                        ? 'bg-mint text-forest border-mint shadow-[0_0_15px_rgba(32,255,189,0.3)]'
                                        : 'bg-white/5 text-white border-white/10 hover:border-mint/50'}`}
                                >
                                    {t(crop.toLowerCase() as any) || crop}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setIsCropSelectorOpen(false)}
                            className="w-full py-3 text-sm text-gray-500 font-bold uppercase tracking-widest hover:text-white transition-colors"
                        >
                            {t('cancel') || 'Cancel'}
                        </button>
                    </GlassCard>
                </div>
            )}
            {/* Location Correction Modal */}
            {isLocationModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in zoom-in duration-200">
                    <GlassCard className="max-w-md w-full p-8 shadow-2xl border-white/10">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                            <svg className="w-6 h-6 text-mint mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {t('correctionFieldLocation') || 'Correction: Field Location'}
                        </h3>
                        <p className="text-xs text-gray-400 mb-6 leading-relaxed">{t('gpsWeakDesc') || 'If your GPS signal is weak in the field, select a nearby agricultural hub or use your saved coordinates for accurate transit math.'}</p>

                        <div className="space-y-3 mb-8">
                            <button
                                onClick={() => {
                                    setManualLocation(null);
                                    requestLocation();
                                    setIsLocationModalOpen(false);
                                }}
                                className="w-full flex items-center justify-between p-4 rounded-xl border border-mint/30 bg-mint/5 hover:bg-mint/10 transition-all group"
                            >
                                <div className="text-left">
                                    <p className="text-sm font-bold text-mint uppercase tracking-widest">{t('useLiveGps') || 'Use Live GPS'}</p>
                                    <p className="text-[10px] text-mint/60">{t('autoDetectDevice') || 'Auto-detect from device'}</p>
                                </div>
                                <svg className="w-5 h-5 text-mint animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                            </button>

                            <div className="grid grid-cols-2 gap-2">
                                {hubs.map(hub => (
                                    <button
                                        key={hub.name}
                                        onClick={() => {
                                            setManualLocation({ lat: hub.lat, lng: hub.lng });
                                            setIsLocationModalOpen(false);
                                            fetchRecommendation();
                                        }}
                                        className="p-3 rounded-lg border border-white/10 bg-white/5 hover:border-mint/50 hover:bg-white/10 text-[10px] font-black text-gray-400 hover:text-white uppercase tracking-widest transition-all"
                                    >
                                        {hub.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => setIsLocationModalOpen(false)}
                            className="w-full py-3 text-sm text-gray-500 font-bold uppercase tracking-widest hover:text-white transition-colors"
                        >
                            {t('backToHub') || 'Back to Hub'}
                        </button>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}

// helper
function roundVal(num: number) {
    return Math.round(num * 10) / 10;
}
