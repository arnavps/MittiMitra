import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface VerdictCardProps {
    data: any;
    userCrop?: string;
    onExplain?: (query: string) => void;
    oracleData?: any;
    clusterData?: any;
}

import { MaturityClock } from '@/components/dashboard/MaturityClock';

export function VerdictCard({ data, userCrop, onExplain, oracleData, clusterData }: VerdictCardProps) {
    const { t, n } = useLanguage();
    const [isExpanded, setIsExpanded] = useState(false);

    if (!data) return null;

    // Approximated Math Breakdown for UI
    const price = data.mandi_stats?.current_price || 0;
    const distanceKm = data.mandi_stats?.distance_km || 0;
    const yieldQtl = data.yield_quintals || 50;

    const grossRevenue = data.breakdown?.gross_revenue ?? (price * yieldQtl);
    const logistics = data.breakdown?.logistics_cost ?? Math.round(distanceKm * 15);
    const spoilagePenalty = data.breakdown?.spoilage_penalty ?? Math.round(grossRevenue * (data.mandi_stats?.quality_loss_pct ?? 0.02));

    // Final source of truth: backend total
    const totalTakeHome = data.total_net_profit ?? (grossRevenue - logistics - spoilagePenalty);
    const perQuintalRealization = data.net_realization_inr_per_quintal || (totalTakeHome / yieldQtl);

    const spoilageRiskPct = data.spoilage_risk_pct || 0;
    const priorityAction = data.preservation?.priority_action;

    // Phase 6: Emergency Logic
    const isPriceCrashing = data.shock_alert?.is_shock || false;
    const showEmergencyStorage = spoilageRiskPct > 30 && isPriceCrashing;

    return (
        <div className="rounded-3xl border border-white/20 bg-black/20 backdrop-blur-xl p-8 lg:p-10 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            {/* Background Glows based on status */}
            {data.status === 'GREEN' && (
                <div className="absolute top-0 right-0 w-64 h-64 bg-mint/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            )}
            {data.status === 'RED' && (
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            )}
            {data.status === 'YELLOW' && (
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            )}

            <h2 className="text-gray-400 uppercase tracking-[0.3em] text-[10px] font-black mb-4 z-10 opacity-60">{t('recommendation')}</h2>

            {userCrop && (
                <div className="z-10 mb-4 flex items-center space-x-3">
                    <span className="text-[10px] text-mint font-black border border-mint/30 px-3 py-1 rounded-full bg-mint/5 uppercase tracking-wide shadow-[0_0_15px_rgba(32,255,189,0.1)]">
                        {userCrop}
                    </span>
                    {clusterData?.cluster?.total_neighbors > 0 && (
                        <div className="flex items-center space-x-1 animate-in fade-in slide-in-from-right-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                             <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">
                                {clusterData.cluster.total_neighbors} Neighbors Nearby
                             </span>
                        </div>
                    )}
                </div>
            )}

            <div className="z-10 w-full mb-6">
                {data.status === 'GREEN' ? (
                    <div className="animate-in fade-in zoom-in duration-500">
                        <h3 className="text-8xl lg:text-9xl font-black text-mint mb-2 drop-shadow-[0_0_35px_rgba(32,255,189,0.6)] tracking-tighter italic">
                            {t('sell') || 'SELL'}
                        </h3>
                        <p className="text-white/80 font-bold text-sm max-w-xs mx-auto">Market peak detected. Best window for maximum realization.</p>
                    </div>
                ) : data.status === 'RED' ? (
                    <div className="animate-in fade-in zoom-in duration-500">
                        <h3 className="text-8xl lg:text-9xl font-black text-amber-500 mb-2 drop-shadow-[0_0_35px_rgba(245,158,11,0.6)] tracking-tighter italic">
                            {t('wait') || 'WAIT'}
                        </h3>
                        <p className="text-white/80 font-bold text-sm max-w-xs mx-auto">{t('waitDesc') || 'Supply overflow. Waiting 48h increases profit probability.'}</p>
                    </div>
                ) : (
                    <div className="animate-in fade-in zoom-in duration-500">
                        <h3 className="text-8xl lg:text-9xl font-black text-yellow-400 mb-2 drop-shadow-[0_0_35px_rgba(250,204,21,0.6)] tracking-tighter italic">
                            {t('hold') || 'HOLD'}
                        </h3>
                        <p className="text-white/80 font-bold text-sm max-w-xs mx-auto">{t('holdDesc') || 'Volatility mapped. Standing by for arbitrage signal.'}</p>
                    </div>
                )}

                {oracleData && data.status !== 'GREEN' && (
                    <div className="mb-8 animate-in zoom-in-95 duration-700">
                        <MaturityClock 
                            maturityPct={oracleData.current_maturity_pct}
                            daysToPeak={oracleData.days_to_peak}
                            windowStart={oracleData.window_start}
                            windowEnd={oracleData.window_end}
                            status={oracleData.status}
                        />
                    </div>
                )}

                {onExplain && (
                    <button
                        onClick={() => onExplain(t('askWhy') || "Explain why you recommended this action.")}
                        className="mt-4 px-6 py-2.5 bg-white/10 hover:bg-mint text-white hover:text-forest border border-white/20 hover:border-mint rounded-full text-xs font-black transition-all flex items-center space-x-2 mx-auto uppercase tracking-widest shadow-xl group"
                    >
                        <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>{t('askVakeelWhy') || 'Ask Vakeel Why'}</span>
                    </button>
                )}
            </div>

            {/* Emergency Cold Storage Gateway */}
            {showEmergencyStorage && (
                <div className="z-10 w-full mb-6 animate-bounce-subtle">
                    <button className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-2xl flex flex-col items-center justify-center space-y-1 shadow-[0_0_30px_rgba(239,68,68,0.4)] border border-red-400 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <div className="flex items-center space-x-2">
                             <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                             <span className="uppercase tracking-widest text-xs">Emergency Cold Storage</span>
                        </div>
                        <p className="text-[10px] opacity-80 font-bold">Secure Yield at ₹15/day vs losing ₹{n(data.shock_alert?.savings_inr || 0)}</p>
                    </button>
                </div>
            )}
            {/* Neon Profit Centerpiece */}
            <div className="z-10 w-full mb-4">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black block mb-1">{t('estimatedTakeHome') || 'Net Take-Home Payout'}</span>
                <div className="text-6xl font-black text-mint font-mono drop-shadow-[0_0_15px_rgba(32,255,189,0.3)] tabular-nums animate-pulse-slow">
                    ₹<AnimatedNumber value={totalTakeHome} />
                </div>
            </div>

            {/* Preservation Priority Action */}
            {priorityAction && priorityAction.is_recommended && (
                <div className="z-10 w-full mt-2 mb-4 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-gradient-to-r from-mint/20 to-emerald-500/10 border border-mint/30 rounded-2xl p-4 flex items-center justify-between shadow-[0_0_20px_rgba(32,255,189,0.15)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center text-left">
                            <div className="w-10 h-10 rounded-full bg-mint/20 flex items-center justify-center mr-3 border border-mint/40">
                                <svg className="w-5 h-5 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <div>
                                <p className="text-[10px] text-mint uppercase tracking-widest font-black opacity-80 mb-0.5">Priority Action</p>
                                <p className="text-white text-sm font-bold">{priorityAction.action}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">Saves You</p>
                            <p className="text-mint font-mono font-black text-lg">₹{n(priorityAction.net_saving_inr)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Harvest Oracle: Ripeness & Tactical Verdict */}
            {oracleData && (
                <div className="z-10 w-full mb-6 mt-4 p-5 bg-white/[0.03] border border-white/10 rounded-2xl relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 flex space-x-2">
                        {oracleData.oracle_verdict?.confidence_score && (
                            <div className="px-2 py-0.5 bg-mint/20 border border-mint/30 rounded text-[8px] font-black text-mint tracking-widest">
                                {oracleData.oracle_verdict.confidence_score}% CONFIDENCE
                            </div>
                        )}
                    </div>
                    
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">Crop Ripeness (GDD)</span>
                        <span className="text-sm font-black text-mint">{oracleData.current_maturity_pct}%</span>
                    </div>

                    {/* Classy Glassy Ripeness Bar */}
                    <div className="h-3 w-full bg-white/5 rounded-full p-0.5 border border-white/10 shadow-inner">
                        <div 
                            className="h-full rounded-full transition-all duration-1500 ease-out bg-gradient-to-r from-mint via-emerald-400 to-mint animate-shimmer"
                            style={{ 
                                width: `${oracleData.current_maturity_pct}%`,
                                backgroundSize: '200% 100%',
                                boxShadow: '0 0 15px rgba(32,255,189,0.3)'
                            }}
                        ></div>
                    </div>

                    {oracleData.oracle_verdict?.explanation && (
                        <div className="mt-4 pt-4 border-t border-white/5 text-left">
                            <p className="text-[10px] text-mint uppercase tracking-widest font-black mb-1 opacity-60">Oracle Tactical Logic</p>
                            <p className="text-xs text-white/90 font-bold leading-relaxed italic">
                                "{oracleData.oracle_verdict.explanation}"
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Dynamic Spoilage Risk Bar */}
            <div className="z-10 w-full mb-4 px-2">
                <div className="flex justify-between items-end mb-1.5">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Transit Spoilage Risk (48h)</span>
                    <span className={`text-xs font-mono font-black ${spoilageRiskPct > 50 ? 'text-red-400' : spoilageRiskPct > 20 ? 'text-yellow-400' : 'text-mint'}`}>
                        {n(spoilageRiskPct)}%
                    </span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ease-out ${spoilageRiskPct > 50 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : spoilageRiskPct > 20 ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'bg-mint shadow-[0_0_10px_rgba(32,255,189,0.5)]'}`}
                        style={{ width: `${Math.min(spoilageRiskPct, 100)}%` }}
                    ></div>
                </div>
            </div>

            {/* Collapsible Detailed Breakdown */}
            <div className="z-10 w-full mt-2">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-center space-x-2 text-[10px] text-gray-500 font-black uppercase tracking-widest py-2 hover:text-white transition-colors"
                >
                    <span>{isExpanded ? (t('hideAuditTrail') || 'Hide Audit Trail') : (t('showAuditTrail') || 'Show Audit Trail')}</span>
                    <svg className={`w-3 h-3 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-4 font-mono text-sm animate-in slide-in-from-top-4 duration-300">
                        {/* Gross */}
                        <div className="flex justify-between items-center text-gray-300">
                            <span className="flex items-center text-xs">
                                <span className="w-1.5 h-1.5 bg-mint rounded-full mr-2"></span>
                                {t('marketValue') || 'MARKET VALUE'}
                            </span>
                            <span className="text-white">+₹{n(grossRevenue)}</span>
                        </div>

                        {/* Logistics */}
                        <div className="flex justify-between items-center text-gray-400">
                            <span className="flex items-center text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2"></span>
                                {t('logistics') || 'LOGISTICS'}
                            </span>
                            <span className="text-red-400">-₹{n(logistics)}</span>
                        </div>

                        {/* Spoilage */}
                        <div className="flex justify-between items-center text-gray-400">
                            <span className="flex items-center text-xs">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                                {t('qualityLoss') || 'QUALITY LOSS'}
                            </span>
                            <span className="text-red-400">-₹{n(spoilagePenalty)}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Real-time Heartbeat */}
            <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center">
                <div className="flex items-center space-x-2 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                    <span className="flex h-1.5 w-1.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-mint"></span>
                    </span>
                    <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest">{t('liveArbitration') || 'Live Arbitration Logic Active'}</span>
                </div>
            </div>
        </div>
    );
}

function AnimatedNumber({ value }: { value: number }) {
    const { n } = useLanguage();
    const [displayValue, setDisplayValue] = useState(value);

    useEffect(() => {
        let startTimestamp: number | null = null;
        const duration = 500;
        const startVal = displayValue;

        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const current = Math.floor(progress * (value - startVal) + startVal);
            setDisplayValue(current);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }, [value]);

    return <>{n(displayValue)}</>;
}
