"use client";

import { useState } from 'react';
import { GlassCard } from '@/components/glass-card';

interface VehicleOption {
    id: string;
    name: string;
    total_cost: number;
    cost_per_q: number;
    spoilage_risk_pct: number;
    net_realization_per_q: number;
    total_net_profit: number;
    description: string;
    is_viable: boolean;
}

interface SharedLogistics {
    count: number;
    total_savings: number;
    savings_per_person: number;
    mandi: string;
    neighbors: any[];
}

interface LogisticsCalculatorProps {
    recommendations: VehicleOption[];
    sharedLogistics: SharedLogistics;
    onVehicleSelect: (vehicleId: string) => void;
    onTransportTypeToggle: (isHired: boolean) => void;
    yieldQtl: number;
}

export function LogisticsCalculator({ 
    recommendations, 
    sharedLogistics, 
    onVehicleSelect, 
    onTransportTypeToggle,
    yieldQtl 
}: LogisticsCalculatorProps) {
    const [selectedId, setSelectedId] = useState(recommendations[0]?.id || '');
    const [isHired, setIsHired] = useState(true);

    const handleSelect = (id: string) => {
        setSelectedId(id);
        onVehicleSelect(id);
    };

    const handleToggle = (hired: boolean) => {
        setIsHired(hired);
        onTransportTypeToggle(hired);
    };

    return (
        <GlassCard className="p-6 border-mint/20 relative overflow-hidden group">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-mint/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-mint/10 transition-colors"></div>

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center">
                        <svg className="w-4 h-4 text-mint mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        Logistics Orchestration
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">Select vehicle to optimize ROI</p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                    <button 
                        onClick={() => handleToggle(false)}
                        className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${!isHired ? 'bg-mint text-forest shadow-[0_0_10px_rgba(32,255,189,0.3)]' : 'text-gray-500 hover:text-white'}`}
                    >
                        Self
                    </button>
                    <button 
                        onClick={() => handleToggle(true)}
                        className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${isHired ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                        Hired
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {recommendations.map((v) => (
                    <button
                        key={v.id}
                        disabled={!v.is_viable}
                        onClick={() => handleSelect(v.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden group/item ${
                            selectedId === v.id 
                            ? 'bg-mint/10 border-mint/50 shadow-[0_0_15px_rgba(32,255,189,0.1)]' 
                            : v.is_viable ? 'bg-white/5 border-white/10 hover:border-white/30' : 'opacity-40 grayscale cursor-not-allowed border-white/5'
                        }`}
                    >
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <h4 className={`text-sm font-bold ${selectedId === v.id ? 'text-mint' : 'text-white'}`}>{v.name}</h4>
                                <p className="text-[10px] text-gray-400 mt-0.5 max-w-[180px] leading-tight">{v.description}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-500 uppercase font-black">Est. Cost</p>
                                <p className={`text-sm font-mono font-bold ${selectedId === v.id ? 'text-mint' : 'text-white'}`}>
                                    ₹{isHired ? v.total_cost.toLocaleString() : Math.round(v.total_cost * 0.4).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between relative z-10">
                            <div className="flex items-center space-x-4">
                                <div>
                                    <p className="text-[8px] text-gray-500 uppercase font-black">Spoilage</p>
                                    <p className={`text-[10px] font-mono font-bold ${v.spoilage_risk_pct > 5 ? 'text-amber-400' : 'text-mint'}`}>{v.spoilage_risk_pct}%</p>
                                </div>
                                <div className="border-l border-white/10 pl-4">
                                    <p className="text-[8px] text-gray-500 uppercase font-black">ROI/Qtl</p>
                                    <p className="text-[10px] text-white font-mono font-bold">₹{v.net_realization_per_q.toLocaleString()}</p>
                                </div>
                            </div>
                            {selectedId === v.id && (
                                <span className="bg-mint/20 text-mint text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-mint/30 animate-pulse">Optimal</span>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {/* Loading Intelligence (New) */}
            {selectedId && (
                <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Loading Recommendation</h4>
                        <span className="text-[10px] text-mint font-bold px-2 py-0.5 bg-mint/10 rounded-md border border-mint/20">Optimal Cooling</span>
                    </div>
                    
                    <div className="flex gap-4 items-start">
                        {/* CSS-based Chimney Pattern Diagram */}
                        <div className="w-24 h-24 bg-forest/80 rounded-lg border border-white/10 p-2 flex flex-col gap-1 shrink-0 shadow-inner">
                            <div className="grid grid-cols-3 gap-1 flex-1">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                                    <div 
                                        key={i} 
                                        className={`rounded-sm border ${i === 5 ? 'bg-transparent border-dashed border-mint/50' : 'bg-mint/30 border-mint/50 animate-pulse'}`}
                                        style={{ animationDelay: `${i * 0.1}s` }}
                                    ></div>
                                ))}
                            </div>
                            <p className="text-[7px] text-mint font-bold text-center uppercase tracking-tighter">Chimney Pattern</p>
                        </div>

                        <div className="flex-1">
                            <p className="text-xs text-gray-300 leading-relaxed font-medium italic">
                                "{recommendations.find(v => v.id === selectedId)?.id === 'Open Trolley' 
                                    ? `Stack bags in 3x3 rows with the center column empty. This creates a vertical 'chimney' that pulls heat away from the core.` 
                                    : `Apply 4-inch padding layer of straw. Do not exceed 5 levels of stacking to prevent bottom-layer compression.`}"
                            </p>
                            <button className="mt-2 text-[10px] text-mint font-black uppercase tracking-widest flex items-center hover:underline focus:outline-none">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                View Detailed Diagram
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Shared Logistics Prompt */}
            {sharedLogistics && sharedLogistics.count > 0 && (
                <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-400/30 animate-in slide-in-from-bottom-4 group/share cursor-pointer hover:border-blue-400/50 transition-all">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3 border border-blue-400/40">
                                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            </div>
                            <div>
                                <p className="text-[10px] text-blue-400 uppercase font-black tracking-widest">Shared Logistics Available</p>
                                <p className="text-white text-xs font-bold leading-tight">Combine transport to {sharedLogistics.mandi} with {sharedLogistics.count} neighbors.</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Save</p>
                            <p className="text-blue-400 font-mono font-black text-lg">₹{sharedLogistics.savings_per_person.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            )}
        </GlassCard>
    );
}
