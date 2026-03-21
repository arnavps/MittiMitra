"use client";

import { useState } from 'react';
import { GlassCard } from '@/components/glass-card';
import { useLanguage } from '@/contexts/LanguageContext';
import { speak } from '@/services/ttsService';
import { Volume2 } from 'lucide-react';

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
    crop: string;
}

export function LogisticsCalculator({ 
    recommendations, 
    sharedLogistics, 
    onVehicleSelect, 
    onTransportTypeToggle,
    yieldQtl,
    crop
}: LogisticsCalculatorProps) {
    const { language } = useLanguage();
    const [selectedId, setSelectedId] = useState(recommendations[0]?.id || '');
    const [isHired, setIsHired] = useState(true);
    const [showDiagram, setShowDiagram] = useState(false);

    const getLoadingInfo = (vehicleId: string, currentCrop: string) => {
        const cropLower = currentCrop.toLowerCase();
        const vIdLower = vehicleId.toLowerCase();
        console.log(`[Logistics] selectedId: ${vehicleId}, crop: ${currentCrop}`);

        // Define image as per user mapping:
        // bike_loading for two wheeler
        // loading_guide for open trolley
        // stacking_padding for truck
        const vImage = vIdLower.includes('trolley') ? "/loading_guide.png" : 
                       vIdLower.includes('truck') ? "/stacking_padding.png" : "/bike_loading.png";
        
        if (cropLower.includes('potato') || cropLower.includes('onion')) {
            if (vIdLower.includes('trolley')) {
                return {
                    title: "Chimney Pattern Stacking",
                    description: "Stack in 3x3 rows with a hollow center column for maximum core cooling.",
                    img: vImage,
                    goal: "Prevents internal rot by 22% on long trips.",
                    layout: 'grid'
                };
            }
            if (vIdLower.includes('truck')) {
                return {
                    title: "Layered Stacking",
                    description: "Use 4-inch straw padding and limit to 4 layers to prevent bottom-layer bruising.",
                    img: vImage,
                    goal: "Reduces 'silent profit leaks' from Mandis.",
                    layout: 'stack'
                };
            }
            return {
                title: "Secure Single Load",
                description: "Ensure load is centered behind the rider. Use high-tension ropes and avoid rear-heavy placement.",
                img: vImage,
                goal: "Ensures rider safety and zero transit spill.",
                layout: 'bike'
            };
        }

        if (cropLower.includes('tomato')) {
            if (vIdLower.includes('trolley')) {
                return {
                    title: "Trolley Crate Distribution",
                    description: "Spread crates across the trolley floor. Do not stack more than 3 high.",
                    img: vImage,
                    goal: "Minimize bruising of delicate tomatoes.",
                    layout: 'grid'
                };
            }
            if (vIdLower.includes('truck')) {
                return {
                    title: "Interlocking Crate Stacking",
                    description: "Use plastic crates with interlocking lids. Do not exceed vehicle sideboard height.",
                    img: vImage,
                    goal: "Prevents sun-scald and crushing during transit.",
                    layout: 'stack'
                };
            }
            return {
                title: "Compact Crate Stacking",
                description: "Secure crates in a stable column. Ensure load does not disrupt balance.",
                img: vImage,
                goal: "Safe transport for high-value small loads.",
                layout: 'bike'
            };
        }

        return {
            title: "Balanced Distribution",
            description: "Distribute load evenly across the vehicle floor to maintain balance and airflow.",
            img: vImage,
            goal: "Ensures vehicle stability and basic heat dissipation.",
            layout: vIdLower.includes('trolley') ? 'grid' : 
                    vIdLower.includes('truck') ? 'stack' : 'bike'
        };
    };

    const loadingInfo = getLoadingInfo(selectedId, crop);

    const handleSelect = (id: string) => {
        setSelectedId(id);
        onVehicleSelect(id);
    };

    const handleToggle = (hired: boolean) => {
        setIsHired(hired);
        onTransportTypeToggle(hired);
    };

    const selectedVehicle = recommendations.find(v => v.id === selectedId);

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

            {/* Loading Intelligence */}
            {selectedId && (
                <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Loading Recommendation</h4>
                        <span className="text-[10px] text-mint font-bold px-2 py-0.5 bg-mint/10 rounded-md border border-mint/20">Optimal Cooling</span>
                    </div>
                    
                    <div className="flex gap-4 items-start">
                        {/* CSS-based Chimney Pattern Diagram */}
                        <div className="w-24 h-24 bg-forest/80 rounded-lg border border-white/10 p-2 flex flex-col gap-1 shrink-0 shadow-inner">
                            {loadingInfo.layout === 'grid' ? (
                                <div className="grid grid-cols-3 gap-1 flex-1">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                                        <div 
                                            key={i} 
                                            className={`rounded-sm border ${loadingInfo.title.includes('Chimney') && i === 5 ? 'bg-transparent border-dashed border-mint/50' : 'bg-mint/30 border-mint/50 animate-pulse'}`}
                                            style={{ animationDelay: `${i * 0.1}s` }}
                                        ></div>
                                    ))}
                                </div>
                            ) : loadingInfo.layout === 'stack' ? (
                                <div className="flex flex-col-reverse gap-1.5 flex-1 justify-center items-center px-4">
                                    {[1, 2, 3].map((i) => (
                                        <div 
                                            key={i} 
                                            className="w-full h-4 rounded-sm border bg-mint/30 border-mint/50 animate-bounce"
                                            style={{ animationDelay: `${i * 0.2}s` }}
                                        ></div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center pt-2">
                                    {/* Simplified Bike Silhouette */}
                                    <div className="relative w-16 h-8 bg-white/5 rounded-t-lg mb-1 flex items-end justify-center">
                                        <div className="w-12 h-6 bg-mint/20 border-t border-x border-mint/40 rounded-t-md relative z-10 animate-pulse">
                                            {/* Single Load */}
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-3 bg-mint/60 rounded-sm border border-mint shadow-[0_0_10px_rgba(32,255,189,0.3)]"></div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-4">
                                        <div className="w-4 h-4 rounded-full border-2 border-mint/40 animate-spin-slow"></div>
                                        <div className="w-4 h-4 rounded-full border-2 border-mint/40 animate-spin-slow"></div>
                                    </div>
                                </div>
                            )}
                            <p className="text-[7px] text-mint font-bold text-center uppercase tracking-tighter">
                                {loadingInfo.layout === 'grid' ? 'Chimney Pattern' : 
                                 loadingInfo.layout === 'stack' ? 'Layered Stack' : 'Bike/Pickup Load'}
                            </p>
                        </div>

                        <div className="flex-1">
                            <p className="text-xs text-gray-300 leading-relaxed font-medium italic mb-3">
                                "{loadingInfo.description}"
                            </p>
                            <div className="flex items-center space-x-4">
                                <button 
                                    onClick={() => setShowDiagram(true)}
                                    className="text-[10px] text-mint font-black uppercase tracking-widest flex items-center hover:underline focus:outline-none bg-mint/5 px-2 py-1 rounded"
                                >
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    View Full Guide
                                </button>
                                <button 
                                    onClick={() => {
                                        const event = new CustomEvent('agriVakeelAsk', { 
                                            detail: { 
                                                query: `Why is the ${selectedVehicle?.name} recommended as the most profitable vehicle for my ${yieldQtl} Qtl harvest?` 
                                            } 
                                        });
                                        window.dispatchEvent(event);
                                    }}
                                    className="text-[10px] text-white/70 font-black uppercase tracking-widest flex items-center hover:text-white focus:outline-none bg-white/5 px-2 py-1 rounded border border-white/10 hover:border-white/30 transition-all font-mono"
                                >
                                    <svg className="w-3 h-3 mr-1 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                    Ask Why?
                                </button>
                                <button 
                                    onClick={() => {
                                        // Standard speak info
                                        speak(`${selectedVehicle?.name}. ${loadingInfo.description}`, language);
                                    }}
                                    className="p-1.5 hover:bg-mint/20 rounded-full transition-all group/audio border border-white/5 hover:border-mint/30 bg-white/5 shadow-lg"
                                    title="Listen to Loading Guide"
                                >
                                    <Volume2 className="w-4 h-4 text-mint/60 group-hover/audio:text-mint transition-colors" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Diagram Modal */}
            {showDiagram && (
                <div className="fixed inset-0 z-[100] flex justify-center items-start md:items-center p-4 overflow-y-auto">
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDiagram(false)}></div>
                    <GlassCard className="max-w-xl w-full p-6 md:p-8 border-mint/30 relative z-10 animate-in zoom-in-95 my-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white uppercase tracking-tight italic">{loadingInfo.title}</h3>
                            <button onClick={() => setShowDiagram(false)} className="text-gray-400 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-white p-2 md:p-4 shadow-2xl">
                                <img 
                                    src={loadingInfo.img} 
                                    alt={loadingInfo.title}
                                    className="w-full h-auto max-h-[40vh] md:max-h-[500px] object-contain mx-auto"
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-mint/5 border border-mint/20">
                                    <h4 className="text-xs font-black text-mint uppercase mb-2">The Goal</h4>
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                        {loadingInfo.goal}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <h4 className="text-xs font-black text-gray-400 uppercase mb-2">Instructions</h4>
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                        {loadingInfo.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Shared Logistics Prompt */}
            {sharedLogistics && sharedLogistics.count > 0 && (
                <div 
                    onClick={() => {
                        const event = new CustomEvent('agriVakeelAsk', { 
                            detail: { 
                                query: `Tell me more about the shared logistics option. Who are the ${sharedLogistics.count} neighbors going to ${sharedLogistics.mandi}?` 
                            } 
                        });
                        window.dispatchEvent(event);
                    }}
                    className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-400/30 animate-in slide-in-from-bottom-4 group/share cursor-pointer hover:border-blue-400/50 transition-all shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3 border border-blue-400/40">
                                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            </div>
                            <div>
                                <p className="text-[10px] text-blue-400 uppercase font-black tracking-widest">Shared Logistics Available</p>
                                <p className="text-white text-xs font-bold leading-tight group-hover:text-blue-300 transition-colors">Combine transport to {sharedLogistics.mandi} with {sharedLogistics.count} neighbors.</p>
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
