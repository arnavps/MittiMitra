"use client";

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/glass-card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';

export default function FPOAdminDashboard() {
    const { t } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [aggregatedData, setAggregatedData] = useState<any>(null);

    useEffect(() => {
        // Mocking FPO aggregation data
        setTimeout(() => {
            setAggregatedData({
                total_farmers: 1250,
                total_acres: 4800,
                active_yield_qtl: 15400,
                clusters: [
                    { region: "Nashik West", yield: 4500, arrivals: 12, panic: false },
                    { region: "Pimpalgaon", yield: 5800, arrivals: 45, panic: true },
                    { region: "Vashi Hub", yield: 3100, arrivals: 8, panic: false },
                    { region: "Indore Alpha", yield: 2000, arrivals: 5, panic: false },
                ],
                logs: [
                    { time: "10:45 AM", user: "Farmer_9821", action: "Logistics Quote", status: "DPDP Logged" },
                    { time: "10:42 AM", user: "Farmer_1102", action: "Cold Storage Opt-in", status: "DPDP Logged" },
                    { time: "10:35 AM", user: "Farmer_5543", action: "Cluster Match", status: "DPDP Logged" },
                ]
            });
            setLoading(false);
        }, 1000);
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-forest flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-t-2 border-mint rounded-full animate-spin"></div>
            <p className="mt-4 text-mint font-black tracking-widest uppercase text-xs">Loading FPO Gateway...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-forest text-white p-6 lg:p-12 relative overflow-hidden">
             {/* Classy Glassy Background */}
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-mint/5 rounded-full blur-[120px] -mr-64 -mt-64"></div>
             <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -ml-64 -mb-64"></div>

             <div className="max-w-7xl mx-auto relative z-10">
                <header className="flex justify-between items-end mb-12">
                    <div>
                        <button onClick={() => router.back()} className="text-mint text-[10px] font-black uppercase tracking-widest mb-4 flex items-center hover:translate-x-[-4px] transition-transform">
                             <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                             Return to Global
                        </button>
                        <h1 className="text-4xl lg:text-6xl font-black tracking-tighter italic">FPO <span className="text-mint">Control Tower</span></h1>
                    </div>
                    <div className="text-right">
                         <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Active Farmers</p>
                         <p className="text-3xl font-black text-mint">{aggregatedData.total_farmers}</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    {/* Aggregation Metrics */}
                    <div className="lg:col-span-1 space-y-6">
                        <GlassCard className="p-6 border-white/5">
                             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Live Aggregate Yield</p>
                             <p className="text-4xl font-black text-white">{aggregatedData.active_yield_qtl}q</p>
                             <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                 <div className="h-full w-3/4 bg-mint"></div>
                             </div>
                        </GlassCard>

                        <GlassCard className="p-6 border-white/5 bg-blue-500/10">
                             <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">Managed Land</p>
                             <p className="text-4xl font-black text-white font-mono">{aggregatedData.total_acres}</p>
                             <p className="text-[10px] text-blue-400/60 font-bold mt-1 uppercase">Acres across 4 hubs</p>
                        </GlassCard>
                    </div>

                    {/* Regional Yield Heat Map */}
                    <div className="lg:col-span-3">
                        <h2 className="text-xs text-gray-500 font-black uppercase tracking-widest mb-6">Regional Yield Heat Map</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {aggregatedData.clusters.map((c: any) => (
                                <GlassCard key={c.region} className={`p-6 border-white/5 relative group transition-all duration-500 ${c.panic ? 'border-red-500/30 bg-red-500/10' : 'hover:border-mint/30'}`}>
                                    <h3 className="text-sm font-bold text-white mb-4">{c.region}</h3>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">Volume</p>
                                            <p className="text-2xl font-black text-white">{c.yield}q</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">Arrivals</p>
                                            <p className={`text-2xl font-black ${c.panic ? 'text-red-500' : 'text-mint'}`}>{c.arrivals}</p>
                                        </div>
                                    </div>

                                    {c.panic && (
                                        <div className="mt-6 p-3 bg-red-500/20 rounded-xl border border-red-500/50 animate-pulse">
                                            <p className="text-[10px] text-red-400 font-black uppercase tracking-widest leading-none mb-1 text-center">Sync-Panic Alert</p>
                                            <p className="text-[9px] text-white/80 font-bold text-center">Simultaneous market surge detected.</p>
                                        </div>
                                    )}

                                    {/* Visual Bar */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-1000 ${c.panic ? 'bg-red-500' : 'bg-mint'}`}
                                            style={{ width: `${(c.yield / 6000) * 100}%` }}
                                        ></div>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                        
                        {/* Compliance & DPDP Logs */}
                        <div className="mt-12">
                             <header className="flex justify-between items-center mb-6">
                                <h2 className="text-xs text-gray-500 font-black uppercase tracking-widest">Digital Personal Data Protection (DPDP) Audit Trail</h2>
                                <span className="bg-emerald-500/20 text-emerald-400 text-[8px] font-black px-2 py-0.5 rounded border border-emerald-500/30 uppercase tracking-widest">Compliant</span>
                             </header>
                             <div className="space-y-3">
                                {aggregatedData.logs.map((l: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex items-center space-x-4">
                                            <span className="text-[10px] text-gray-500 font-mono">{l.time}</span>
                                            <span className="text-xs font-bold text-white">{l.action}</span>
                                            <span className="text-[10px] text-gray-400 italic">via {l.user}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-1 h-1 rounded-full bg-emerald-400"></div>
                                            <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest font-mono">{l.status}</span>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                </div>
             </div>
        </div>
    );
}
