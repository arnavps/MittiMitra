"use client";

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/glass-card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { CropDistributionChart, RegionalPanicChart } from '@/components/dashboard/FPOCharts';

export default function FPOAdminDashboard() {
    const { t, n } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [fpoData, setFpoData] = useState<any>(null);

    useEffect(() => {
        const fetchFPOData = async () => {
            try {
                const res = await fetch('/api/ecosystem/fpo/stats');
                if (res.ok) {
                    setFpoData(await res.json());
                }
                setLoading(false);
            } catch (err) {
                console.error("FPO data fetch failed", err);
                setLoading(false);
            }
        };
        fetchFPOData();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-forest flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-t-2 border-mint rounded-full animate-spin"></div>
            <p className="mt-4 text-mint font-black tracking-widest uppercase text-xs">Syncing Control Tower...</p>
        </div>
    );

    if (!fpoData) return null;

    return (
        <div className="min-h-screen bg-[#051109] text-white p-4 lg:p-10 relative overflow-hidden">
             {/* Depth Layers & Background Effects */}
             <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-mint/10 rounded-full blur-[150px] opacity-20"></div>
             <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] opacity-20"></div>
             <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none"></div>

             <div className="max-w-7xl mx-auto relative z-10 space-y-10">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-4">
                        <button onClick={() => router.back()} className="group text-mint/60 text-[10px] font-black uppercase tracking-widest flex items-center hover:text-mint transition-all">
                             <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                             Global Interface
                        </button>
                        <div>
                            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter italic leading-none">
                                FPO <span className="text-mint block md:inline underline decoration-mint/20 underline-offset-8">CONTROL TOWER</span>
                            </h1>
                            <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-4 ml-1">Regimented Yield Management System v6.2</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
                             <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Regional Nodes</p>
                             <div className="flex items-center space-x-2">
                                <span className="w-2 h-2 rounded-full bg-mint animate-pulse"></span>
                                <span className="text-2xl font-black text-white">48 Active</span>
                             </div>
                        </div>
                    </div>
                </header>

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* LEFT PANEL: High-Level Aggregation (Span 4) */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Primary Metric: Aggregated Realization */}
                        <GlassCard className="p-8 border-mint/20 bg-mint/[0.02]">
                             <p className="text-[11px] text-mint font-black uppercase tracking-[0.2em] mb-4">Total Aggregated Yield</p>
                             <div className="flex items-baseline space-x-2">
                                <span className="text-6xl font-black text-white">{n(fpoData.total_yield_qtl)}</span>
                                <span className="text-xl font-bold text-mint/60 uppercase">Quintals</span>
                             </div>
                             <div className="mt-8 flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                                <span>Across {fpoData.total_farmers} Farmers</span>
                                <span className="text-mint">↑ 12% vs last week</span>
                             </div>
                        </GlassCard>

                        {/* Crop Distribution Box */}
                        <GlassCard className="p-8">
                             <h3 className="text-xs font-black text-white uppercase tracking-widest mb-8 flex items-center">
                                <span className="w-1.5 h-6 bg-mint mr-3 rounded-full"></span>
                                Crop Mix Portfolio
                             </h3>
                             <CropDistributionChart data={fpoData.crop_distribution} />
                             <button className="w-full mt-8 py-3 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                                Download Distribution CSV
                             </button>
                        </GlassCard>
                    </div>

                    {/* CENTER PANEL: Heatmaps & Arrivals (Span 5) */}
                    <div className="lg:col-span-5 space-y-8">
                        <GlassCard className="p-8 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-4">
                                <div className="p-2 bg-red-500/20 rounded-lg border border-red-500/30 text-red-500 animate-pulse">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                             </div>
                             
                             <div className="mb-8">
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Regional Sync-Panic Score</h3>
                                <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase">Load Balancing Analysis for APMC Markets</p>
                             </div>
                             
                             <RegionalPanicChart data={fpoData.regional_clusters} />

                             <div className="mt-8 pt-8 border-t border-white/10">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-[10px] text-gray-400 font-bold mb-2 uppercase">Vakeel Control Action:</p>
                                    <p className="text-xs font-bold text-mint leading-relaxed italic">"Heavy arrival sync detected at Pimpalgaon. Diverting 15 farmers to Vashi Outer to protect pricing floor."</p>
                                </div>
                             </div>
                        </GlassCard>

                        {/* DPDP Compliance Audit Trail */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-2">
                                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Data Audit (DPDP-2023)</h3>
                                <span className="text-[9px] text-emerald-400 font-black">ENCRYPTED</span>
                            </div>
                            <div className="space-y-2">
                                {[1,2,3].map(i => (
                                    <div key={i} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center text-[10px]">
                                        <div className="flex items-center space-x-4">
                                            <span className="font-mono text-gray-500">18:32:0{i}</span>
                                            <span className="font-black text-white/80">Batch Aggregate Request</span>
                                        </div>
                                        <span className="text-emerald-500 font-black">LOGGED</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: B2B Logistics Queue (Span 3) */}
                    <div className="lg:col-span-3 space-y-6">
                        <header className="px-2">
                             <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">B2B Logistics Queue</h3>
                        </header>
                        
                        {fpoData.logistics_queue.map((item: any) => (
                            <GlassCard key={item.id} className="p-6 hover:border-white/20 transition-all border-white/5">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-xs font-black text-white">{item.id}</span>
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${item.status === 'EN-ROUTE' ? 'bg-mint text-forest' : 'bg-white/10 text-white/60'}`}>
                                        {item.status}
                                    </span>
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-4">{item.type}</p>
                                
                                <div className="flex justify-between items-end">
                                    <div className="flex -space-x-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-500 border border-forest flex items-center justify-center text-[8px] font-bold">F1</div>
                                        <div className="w-6 h-6 rounded-full bg-mint border border-forest flex items-center justify-center text-[8px] font-bold text-forest">F2</div>
                                    </div>
                                    {item.savings > 0 && (
                                        <div className="text-right">
                                            <p className="text-xs font-black text-mint">₹{item.savings}</p>
                                            <p className="text-[8px] text-mint/40 font-black uppercase">SAVED</p>
                                        </div>
                                    )}
                                </div>
                            </GlassCard>
                        ))}

                        <button className="w-full py-6 bg-mint text-forest font-black uppercase tracking-[0.2em] text-xs hov:bg-mint/90 transition-all shadow-[0_15px_30px_rgba(32,255,189,0.2)] rounded-2xl flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                            <span>Deploy New Multi-Truck</span>
                        </button>
                    </div>
                </div>
             </div>
        </div>
    );
}
