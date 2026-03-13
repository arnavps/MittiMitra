'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { GlassCard } from '@/components/glass-card';
import { useOfflineCache } from '@/hooks/useOfflineCache';
import { StatusPill } from '@/components/status-pill';
import { useState } from 'react';
import { VoiceAssistant } from '@/components/voice-assistant';
import { LogisticsCalculator } from '@/components/dashboard/LogisticsCalculator';

export default function LogisticsPage() {
    const { t, n } = useLanguage();
    const { cachedData } = useOfflineCache('dashboard_recommendation');

    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    const [isHired, setIsHired] = useState(true);

    // Fallback data
    const logisticsData = cachedData?.logistics_recommendations || [];
    const sharedLogistics = cachedData?.shared_logistics || null;
    const yieldQtl = cachedData?.yield_quintals || 50;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24">
            <header className="relative z-50 flex flex-col mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-2">{t('logistics')}</h1>
                    <p className="text-sm text-gray-400">Transport Orchestration & Loading Intelligence</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: Logistics Calculator (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    {logisticsData.length > 0 ? (
                        <LogisticsCalculator 
                            recommendations={logisticsData}
                            sharedLogistics={sharedLogistics as any}
                            yieldQtl={yieldQtl}
                            onVehicleSelect={setSelectedVehicleId}
                            onTransportTypeToggle={setIsHired}
                        />
                    ) : (
                        <GlassCard className="p-12 text-center border-white/5">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">No Logistics Data Found</h3>
                            <p className="text-sm text-gray-400 max-w-md mx-auto">
                                Please ensure you have a valid recommendation from the main Decision Hub to see transport orchestration advice.
                            </p>
                        </GlassCard>
                    )}

                    {/* Loading Best Practices */}
                    <GlassCard className="p-6 border-white/5 bg-white/[0.02]">
                        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Loading Best Practices</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-forest/40 border border-white/5">
                                <h4 className="text-sm font-bold text-mint mb-2">Temperature Control</h4>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    Always stack with airflow gaps. Heat traps in the center of the load can cause 15-20% higher spoilage during transit.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-forest/40 border border-white/5">
                                <h4 className="text-sm font-bold text-mint mb-2">Physical Protection</h4>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    Use straw or foam padding on the vehicle floor. Bottom-layer bruising is a "silent profit leak" that is only seen at the Mandi.
                                </p>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Right Side: Shared Logistics & Context */}
                <div className="lg:col-span-1 space-y-6">
                    <GlassCard className="p-6 border-white/5 bg-white/[0.02]">
                        <h2 className="text-lg font-bold text-white mb-4">Logistics Summary</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                <span className="text-gray-400 text-xs uppercase font-black">Active Crop</span>
                                <span className="text-white font-bold">{cachedData?.crop || 'Tomato'}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                <span className="text-gray-400 text-xs uppercase font-black">Yield</span>
                                <span className="text-white font-bold">{yieldQtl} Qtl</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                <span className="text-gray-400 text-xs uppercase font-black">Transport Type</span>
                                <span className="text-mint font-bold">{isHired ? 'Hired' : 'Self'}</span>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6 border-white/5 bg-white/[0.02]">
                        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Optimization Intelligence</h2>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            MittiMitra calculates your Net Realization by simulating heat decay and fuel consumption for each trip. 
                            Choosing the "Optimal" vehicle can save you up to <span className="text-mint font-bold">₹2.5/Qtl</span> in hidden spoilage losses.
                        </p>
                    </GlassCard>
                </div>
            </div>

            <VoiceAssistant dashboardData={cachedData} />
        </div>
    );
}
