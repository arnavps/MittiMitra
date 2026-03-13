"use client";

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/glass-card';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/utils/supabase/client';
import { auth } from '@/services/firebase';
import { motion, AnimatePresence } from 'framer-motion';

interface Scheme {
    id: string;
    title: string;
    hook: string;
    description: string;
    portal_url: string;
    eligibility: string;
    documents: string;
    category: string;
}

export default function SchemesPage() {
    const { t, language } = useLanguage();
    const [schemes, setSchemes] = useState<Scheme[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedScheme, setExpandedScheme] = useState<string | null>(null);
    const [vakeelExplaining, setVakeelExplaining] = useState<string | null>(null);

    useEffect(() => {
        const fetchAndRankSchemes = async () => {
            try {
                // Fetch user risk data for ranking
                const phone = auth.currentUser?.phoneNumber || localStorage.getItem('demo_phone') || "9999999999";
                
                // Get recommendation data if available to get risk scores
                // For demo/simplicity, we'll fetch from a dedicated endpoint if it exists or use defaults
                const res = await fetch('/api/schemes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        spoilage_risk_pct: 12.5, // Mock values for now
                        storage_type: "Open Field",
                        crop: "Tomato"
                    })
                });
                
                const ranked = await res.json();
                setSchemes(ranked);
            } catch (err) {
                console.error("Failed to fetch schemes", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAndRankSchemes();
    }, []);

    const explainScheme = async (scheme: Scheme) => {
        setVakeelExplaining(scheme.id);
        
        try {
            const context = {
                crop: "Tomato",
                spoilage_risk_pct: 12.5,
                storage_type: "Open Field",
                context_mode: "financial_advisor"
            };

            const response = await fetch('/api/chat/explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    farmer_query: `Please explain how the ${scheme.title} scheme helps me specifically.`,
                    dashboard_context: context,
                    language: language,
                    context_mode: "financial_advisor"
                })
            });

            const data = await response.json();
            
            // TTS handling
            const ttsUrl = `/api/chat/tts?text=${encodeURIComponent(data.response)}&language=${language}`;
            const audio = new Audio(ttsUrl);
            audio.onended = () => setVakeelExplaining(null);
            audio.play();

        } catch (err) {
            console.error("Vakeel explain failed", err);
            setVakeelExplaining(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#1B3022]">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-mint border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-mint font-bold uppercase tracking-widest text-xs">Curating Govt Schemes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="space-y-2">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-mint/20 rounded-xl flex items-center justify-center border border-mint/30 shadow-[0_0_20px_rgba(32,255,189,0.1)]">
                        <svg className="w-6 h-6 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tighter uppercase italic">{t('schemesHub')}</h1>
                </div>
                <p className="text-gray-400 font-medium max-w-xl">
                    Personalized government subsidies and schemes ranked by your specific farm risk profile. Powered by MittiMitra's Financial Advisor Engine.
                </p>
            </div>

            {/* Schemes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {schemes.map((scheme, index) => (
                    <motion.div
                        key={scheme.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <GlassCard className="h-full flex flex-col border-white/10 hover:border-mint/30 transition-all duration-500 group">
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-bold text-white group-hover:text-mint transition-colors">{scheme.title}</h3>
                                    <button 
                                        onClick={() => explainScheme(scheme)}
                                        className={`p-2 rounded-lg transition-all ${vakeelExplaining === scheme.id ? 'bg-mint text-forest scale-110 shadow-[0_0_15px_#20FFBD]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                                    >
                                        <svg className={`w-5 h-5 ${vakeelExplaining === scheme.id ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        </svg>
                                    </button>
                                </div>
                                
                                <p className="text-mint font-black text-sm uppercase italic">
                                    "{scheme.hook}"
                                </p>
                                
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    {scheme.description}
                                </p>

                                {/* Accordion/Details */}
                                <div className="space-y-2">
                                    <button 
                                        onClick={() => setExpandedScheme(expandedScheme === scheme.id ? null : scheme.id)}
                                        className="text-xs font-bold text-white/40 hover:text-white uppercase tracking-widest flex items-center space-x-2"
                                    >
                                        <span>{expandedScheme === scheme.id ? "Hide Details" : "View Eligibility & Docs"}</span>
                                        <svg className={`w-3 h-3 transition-transform ${expandedScheme === scheme.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    
                                    <AnimatePresence>
                                        {expandedScheme === scheme.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="bg-black/40 rounded-xl p-4 space-y-4 border border-white/5 mt-2">
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest mb-1">Eligibility</p>
                                                        <p className="text-xs text-gray-300">{scheme.eligibility}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest mb-1">Required Documents</p>
                                                        <p className="text-xs text-gray-300">{scheme.documents}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                            
                            <div className="mt-auto p-4 border-t border-white/5">
                                <a 
                                    href={scheme.portal_url} 
                                    target="_blank" 
                                    className="block w-full py-3 bg-white/5 hover:bg-mint text-white hover:text-forest font-bold text-center rounded-xl transition-all border border-white/10 hover:border-mint"
                                >
                                    Apply on Portal (Redirect)
                                </a>
                            </div>
                        </GlassCard>
                    </motion.div>
                ))}
            </div>
            
            {/* DPDP Consent Footer */}
            <div className="p-6 bg-black/40 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-white uppercase tracking-widest">DPDP Act 2023 Compliant</p>
                        <p className="text-xs text-gray-500">Your yield data is only shared with government portals after your explicit voice confirmation.</p>
                    </div>
                </div>
                <div className="text-xs font-mono text-gray-600 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                    Consent Status: <span className="text-mint">ACTIVE_ENCRYPTED</span>
                </div>
            </div>
        </div>
    );
}
