'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { GlassCard } from '@/components/glass-card';
import { VoiceAssistant } from '@/components/voice-assistant';
import { useGPS } from '@/hooks/useGPS';
import { useOfflineCache } from '@/hooks/useOfflineCache';
import { fetchProfile } from '@/services/user';

export default function AgriVakeelPage() {
    const { t, language } = useLanguage();
    const { location, requestLocation } = useGPS();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [initialQuery, setInitialQuery] = useState("");
    const { isOnline, cachedData: lastRecommendationCachedData, saveToCache } = useOfflineCache('last_recommendation', null);
    const { cachedData: dashboardCachedData } = useOfflineCache('dashboard_recommendation');


    const [isHarvested, setIsHarvested] = useState(false);

    const fetchRecommendation = async (coords: { latitude: number, longitude: number }) => {
        try {
            // Fetch profile first to get harvest status if not already known
            const profile = await fetchProfile();
            if (profile?.harvest_status !== undefined) {
                setIsHarvested(profile.harvest_status);
            }

            const payload = {
                crop: profile?.crop || "Tomato",
                location: { lat: coords.latitude, lng: coords.longitude },
                yield_est_quintals: profile?.yield_quintals || 50.0,
                base_spoilage_rate: 0.05,
                is_harvested: profile?.harvest_status || false
            };
            // Use the Next.js API proxy to avoid Mixed Content on mobile HTTPS
            const backendUrl = `/api/recommendation`;
            const res = await fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const json = await res.json();
                setData(json);
                saveToCache(json);
            }
        } catch (err) {
            console.error("Failed to fetch recommendation", err);
            if (lastRecommendationCachedData) setData(lastRecommendationCachedData);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        requestLocation();
    }, []);

    useEffect(() => {
        if (location) {
            fetchRecommendation(location);
        } else {
            // Fallback to mock Pune location if GPS takes too long or is denied
            const timer = setTimeout(() => {
                if (!data && !location) {
                    fetchRecommendation({ latitude: 18.5204, longitude: 73.8567 });
                }
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [location]);

    const handleSuggestionClick = (query: string) => {
        setInitialQuery(query);
    };

    if (!data && !loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="text-red-400 text-lg font-bold">{t('failedToConnect')}</div>
                <p className="text-gray-400 max-w-md">{t('recommendationFetchError')}</p>
                <button
                    onClick={() => { setLoading(true); requestLocation(); }}
                    className="px-6 py-2 bg-mint text-forest rounded-full font-bold hover:bg-white transition-colors"
                >
                    {t('retryConnection')}
                </button>
            </div>
        );
    }

    if (loading && !data) {
        return (
            <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-24">
            <header className="relative z-50 flex flex-col mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-white mb-1">{t('askAgriVakeel')}</h1>
                <p className="text-sm text-gray-400">{t('aiConsultation')}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column - Suggestions */}
                <div className="md:col-span-1 space-y-4">
                    <h2 className="text-white font-bold mb-2">{t('suggestions')}</h2>
                    <div className="grid grid-cols-1 gap-4 w-full">
                        {!isHarvested ? (
                            <>
                                <button
                                    onClick={() => handleSuggestionClick("How is my soil health today?")}
                                    className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-colors w-full group"
                                >
                                    <p className="text-xs text-mint font-bold uppercase mb-1 group-hover:text-white transition-colors">{t('soilHealth')}</p>
                                    <p className="text-sm text-gray-300 italic group-hover:text-gray-100 transition-colors">"How is my soil health today?"</p>
                                </button>
                                <button
                                    onClick={() => handleSuggestionClick("When should I trigger the next irrigation cycle?")}
                                    className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-colors w-full group"
                                >
                                    <p className="text-xs text-mint font-bold uppercase mb-1 group-hover:text-white transition-colors">{t('irrigationPlanner')}</p>
                                    <p className="text-sm text-gray-300 italic group-hover:text-gray-100 transition-colors">"When should I trigger the next irrigation cycle?"</p>
                                </button>
                                <button
                                    onClick={() => handleSuggestionClick("Are there any pest alerts nearby?")}
                                    className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-colors w-full group"
                                >
                                    <p className="text-xs text-mint font-bold uppercase mb-1 group-hover:text-white transition-colors">{t('pestWarning')}</p>
                                    <p className="text-sm text-gray-300 italic group-hover:text-gray-100 transition-colors">"Are there any pest alerts nearby?"</p>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => handleSuggestionClick(t('suggestion1Query'))}
                                    className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-colors w-full group"
                                >
                                    <p className="text-xs text-mint font-bold uppercase mb-1 group-hover:text-white transition-colors">{t('marketInsight')}</p>
                                    <p className="text-sm text-gray-300 italic group-hover:text-gray-100 transition-colors">"{t('suggestion1Query')}"</p>
                                </button>
                                <button
                                    onClick={() => handleSuggestionClick(t('suggestion2Query'))}
                                    className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-colors w-full group"
                                >
                                    <p className="text-xs text-mint font-bold uppercase mb-1 group-hover:text-white transition-colors">{t('strategy')}</p>
                                    <p className="text-sm text-gray-300 italic group-hover:text-gray-100 transition-colors">"{t('suggestion2Query')}"</p>
                                </button>
                                <button
                                    onClick={() => handleSuggestionClick(t('suggestion4Query'))}
                                    className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-colors w-full group"
                                >
                                    <p className="text-xs text-mint font-bold uppercase mb-1 group-hover:text-white transition-colors">{t('arbitrage')}</p>
                                    <p className="text-sm text-gray-300 italic group-hover:text-gray-100 transition-colors">"{t('suggestion4Query')}"</p>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Right/Main Column - AI Assistant */}
                <div className="md:col-span-2">
                    <div className="rounded-3xl border border-white/20 bg-black/20 backdrop-blur-xl p-6 lg:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl">
                        <div className="z-10 w-full">
                            <VoiceAssistant
                                dashboardData={data}
                                isEmbedded={true}
                                initialQuery={initialQuery}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-center mt-12 bg-white/5 border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto">
                <p className="text-gray-300 text-sm leading-relaxed text-center">
                    <span className="text-mint font-bold">{t('proTip')}:</span> {t('proTipDesc')}
                </p>
            </div>
        </div>
    );
}
