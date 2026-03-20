import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface VerdictCardProps {
    data: any;
    userCrop?: string;
    isHarvested?: boolean;
    onExplain?: (query: string) => void;
    oracleData?: any;
    clusterData?: any;
}

import { MaturityClock } from '@/components/dashboard/MaturityClock';
import { HarvestScorecard } from '@/components/dashboard/HarvestScorecard';
import { getClusterMaturityHeatmap } from '@/services/supplyOrchestrator';
import { getWeatherForecast } from '@/services/weatherService';
import Link from 'next/link';
import { speak } from '@/services/ttsService';
import { Volume2, X, TrendingUp, Zap, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function VerdictCard({ data, userCrop, isHarvested, onExplain, oracleData, clusterData }: VerdictCardProps) {
    const { t, n, language } = useLanguage();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!data) return null;

    // Approximated Math Breakdown for UI
    const price = data.mandi_stats?.current_price || 0;
    const distanceKm = data.mandi_stats?.distance_km || 0;
    const yieldQtl = data.yield_quintals || 50;

    const grossRevenue = data.breakdown?.gross_revenue ?? (price * yieldQtl);
    const logistics = data.breakdown?.logistics_cost ?? Math.round(distanceKm * 15);
    const spoilagePenalty = data.breakdown?.spoilage_penalty ?? Math.round(grossRevenue * ((data.mandi_stats?.quality_loss_pct ?? 2.0) / 100.0));

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
                                {clusterData.cluster.total_neighbors} {t('neighborsNearby')}
                             </span>
                        </div>
                    )}
                </div>
            )}

            {isHarvested ? (
                <div className="z-10 w-full mb-6">
                    {data.status === 'GREEN' ? (
                        <div className="animate-in fade-in zoom-in duration-500">
                            <h3 className="text-8xl lg:text-9xl font-black text-mint mb-2 drop-shadow-[0_0_35px_rgba(32,255,189,0.6)] tracking-tighter italic">
                                {t('sell')}
                            </h3>
                            <p className="text-white/80 font-bold text-sm max-w-xs mx-auto">{t('sellDesc')}</p>
                        </div>
                    ) : data.status === 'RED' ? (
                        <div className="animate-in fade-in zoom-in duration-500">
                            <h3 className="text-8xl lg:text-9xl font-black text-amber-500 mb-2 drop-shadow-[0_0_35px_rgba(245,158,11,0.6)] tracking-tighter italic">
                                {t('wait')}
                            </h3>
                            <p className="text-white/80 font-bold text-sm max-w-xs mx-auto">
                                {data.shock_alert?.status === 'MATURITY_LOCK' 
                                    ? data.shock_alert.message 
                                    : t('waitDesc')}
                            </p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in zoom-in duration-500">
                            <h3 className="text-8xl lg:text-9xl font-black text-yellow-400 mb-2 drop-shadow-[0_0_35px_rgba(250,204,21,0.6)] tracking-tighter italic">
                                {t('hold')}
                            </h3>
                            <p className="text-white/80 font-bold text-sm max-w-xs mx-auto">{t('holdDesc')}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="z-10 w-full mb-6">
                    <h3 className="text-6xl lg:text-7xl font-black text-white/90 mb-2 tracking-tighter italic">
                        {oracleData?.status === 'GROWING' ? t('ready') : oracleData?.status}
                    </h3>
                    <p className="text-white/60 font-bold text-sm max-w-xs mx-auto mb-8">
                        {oracleData?.oracle_verdict?.verdict || t('monitorClosely')}
                    </p>
                    
                    {oracleData && (
                        <div className="mb-4 animate-in zoom-in-95 duration-700">
                            <MaturityClock 
                                maturityPct={oracleData.current_maturity_pct}
                                daysToPeak={oracleData.days_to_peak}
                                windowStart={oracleData.window_start}
                                windowEnd={oracleData.window_end}
                                status={oracleData.status}
                            />
                        </div>
                    )}
                </div>
            )}

            {onExplain && (
                <div className="z-10 mb-8">
                    <button
                        onClick={() => onExplain(t('askWhy'))}
                        className="px-6 py-2.5 bg-white/10 hover:bg-mint text-white hover:text-forest border border-white/20 hover:border-mint rounded-full text-xs font-black transition-all flex items-center space-x-2 mx-auto uppercase tracking-widest shadow-xl group"
                    >
                        <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>{t('askVakeelWhy')}</span>
                    </button>
                </div>
            )}

            {/* Emergency Cold Storage Gateway */}
            {showEmergencyStorage && (
                <div className="z-10 w-full mb-6 animate-bounce-subtle">
                    <button className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-2xl flex flex-col items-center justify-center space-y-1 shadow-[0_0_30px_rgba(239,68,68,0.4)] border border-red-400 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <div className="flex items-center space-x-2">
                             <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                             <span className="uppercase tracking-widest text-xs">{t('emergencyColdStorage')}</span>
                        </div>
                        <p className="text-[10px] opacity-80 font-bold">Secure Yield at ₹15/day vs losing ₹{n(data.shock_alert?.savings_inr || 0)}</p>
                    </button>
                </div>
            )}
            {/* Neon Profit Centerpiece - Post-Harvest Only */}
            {isHarvested && (
                <div className="z-10 w-full mb-4">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black block mb-1">{t('estimatedTakeHome')}</span>
                    <div className="text-6xl font-black text-mint font-mono drop-shadow-[0_0_15_rgb(32,255,189,0.3)] tabular-nums animate-pulse-slow">
                        ₹<AnimatedNumber value={totalTakeHome} />
                    </div>
                </div>
            )}

            {/* Preservation Priority Action */}
            {priorityAction && priorityAction.is_recommended && (
                <div className="z-10 w-full mt-2 mb-4 animate-in slide-in-from-bottom-4 duration-500">
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="w-full bg-gradient-to-r from-mint/20 to-emerald-500/10 border border-mint/30 rounded-2xl p-4 flex items-center justify-between shadow-[0_0_20px_rgba(32,255,189,0.15)] relative overflow-hidden group text-left"
                    >
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-mint/20 flex items-center justify-center mr-3 border border-mint/40">
                                <Zap className="w-5 h-5 text-mint" />
                            </div>
                            <div>
                                <div className="flex items-center space-x-2">
                                    <p className="text-[10px] text-mint uppercase tracking-widest font-black opacity-80 mb-0.5">{t('urgent')}</p>
                                    <ChevronRight className="w-3 h-3 text-mint/40 group-hover:translate-x-1 transition-transform" />
                                </div>
                                <p className="text-white text-sm font-bold">{priorityAction.action_id ? t(priorityAction.action_id as any) : priorityAction.action}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">{t('loss24h')}</p>
                            <p className="text-mint font-mono font-black text-lg">₹{n(priorityAction.net_saving_inr)}</p>
                        </div>
                    </button>
                </div>
            )}

            {/* Preservation Details Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-forest border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <div>
                                    <div className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-[0.3em] text-mint/60 mb-2">
                                        <ShieldCheck className="w-4 h-4" />
                                        <span>{t('preservationStrategies')}</span>
                                    </div>
                                    <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">
                                        Action <span className="text-mint">Intelligence</span>
                                    </h2>
                                </div>
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-6 h-6 text-white/60" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                {/* ROI Summary */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem]">
                                        <TrendingUp className="w-5 h-5 text-mint mb-4" />
                                        <div className="text-[10px] font-black uppercase tracking-widest text-mint/60 mb-1">{t('totalPreservationSavings')}</div>
                                        <div className="text-2xl font-black text-mint font-mono">₹{n(data.preservation?.all_actions?.reduce((acc: number, curr: any) => acc + (curr.is_recommended ? curr.net_saving_inr : 0), 0) || 0)}</div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem]">
                                        <Clock className="w-5 h-5 text-mint mb-4" />
                                        <div className="text-[10px] font-black uppercase tracking-widest text-mint/60 mb-1">Execution Time</div>
                                        <div className="text-2xl font-black text-white font-mono">15-20 {t('mins')}</div>
                                    </div>
                                </div>

                                {/* Actions List */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4">{t('actionDetails')}</h3>
                                    {data.preservation?.all_actions?.filter((a: any) => a.is_recommended).map((action: any, idx: number) => (
                                        <div key={idx} className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 space-y-4 group hover:border-mint/30 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-mint/10 flex items-center justify-center border border-mint/20 text-mint font-bold italic">
                                                        #{idx + 1}
                                                    </div>
                                                    <div>
                                                         <h4 className="text-lg font-black text-white">
                                                            {action.action_id ? t(action.action_id as any) : action.action}
                                                         </h4>
                                                         <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-sm">
                                                            {action.action_id ? t(`${action.action_id}_desc` as any, { crop: t(data.crop.toLowerCase() as any) }) : action.description}
                                                         </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] font-black text-mint uppercase tracking-widest mb-1">{t('netGain')}</div>
                                                    <div className="text-xl font-black text-mint font-mono">+₹{n(action.net_saving_inr)}</div>
                                                </div>
                                            </div>

                                            {/* AI Advice Bubble */}
                                            <div className="bg-forest border border-mint/20 rounded-2xl p-5 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-mint/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                                <div className="flex items-start space-x-4 relative z-10">
                                                    <button 
                                                        onClick={() => {
                                                            const adviceText = action.action_id ? t(`${action.action_id}_advice` as any, { 
                                                                crop: t(data.crop.toLowerCase() as any), 
                                                                temp: data.metrics.temp, 
                                                                saving: action.net_saving_inr 
                                                            }) : action.ai_advice;
                                                            speak(adviceText, language);
                                                        }}
                                                        className="w-10 h-10 rounded-xl bg-mint text-forest flex items-center justify-center shrink-0 hover:scale-110 active:scale-95 transition-all shadow-lg"
                                                    >
                                                        <Volume2 className="w-5 h-5" />
                                                    </button>
                                                    <div>
                                                        <div className="text-[10px] font-black text-mint uppercase tracking-widest mb-1">{t('aiAdvice')}</div>
                                                         <p className="text-sm text-gray-300 italic font-medium leading-relaxed">
                                                            "{action.action_id ? t(`${action.action_id}_advice` as any, { 
                                                                crop: t(data.crop.toLowerCase() as any), 
                                                                temp: data.metrics.temp, 
                                                                saving: action.net_saving_inr 
                                                            }) : action.ai_advice}"
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-8 border-t border-white/5 bg-white/[0.02] flex justify-center">
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-10 h-14 bg-mint text-forest rounded-2xl font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(32,255,189,0.2)] hover:scale-[1.03] active:scale-95 transition-all text-xs"
                                >
                                    {t('close')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Harvest Oracle: Simplified Dashboard View */}
            {oracleData && !isHarvested && (
                <div className="z-10 w-full mb-6 mt-4 p-5 bg-white/[0.03] border border-white/10 rounded-2xl relative group overflow-hidden">
                    <div className="flex justify-between items-end mb-3">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black mb-1">{t('harvestOracle')}</span>
                            <span className="text-xl font-black text-white">{oracleData.current_maturity_pct}% <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest tracking-tighter">{t('ripeness')}</span></span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-mint uppercase tracking-widest font-black mb-1">{t('tactics')}</span>
                            <span className="text-sm font-black text-mint">
                                 {oracleData.oracle_verdict?.verdict || t('ready')}
                            </span>
                        </div>
                    </div>

                    {/* Classy Glassy Ripeness Bar - Simplified */}
                    <div className="h-2 w-full bg-white/5 rounded-full p-0.5 border border-white/10 shadow-inner mb-4">
                        <div 
                            className="h-full rounded-full transition-all duration-1500 ease-out bg-gradient-to-r from-mint via-emerald-400 to-mint animate-shimmer"
                            style={{ 
                                width: `${oracleData.current_maturity_pct}%`,
                                backgroundSize: '200% 100%',
                                boxShadow: '0 0 10px rgba(32,255,189,0.2)'
                            }}
                        ></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Link 
                            href="/dashboard/harvest-oracle" 
                            className="flex items-center justify-center py-2 bg-mint/10 border border-mint/20 rounded-xl text-[10px] text-mint font-black uppercase tracking-widest hover:bg-mint hover:text-forest transition-all"
                        >
                            {t('learnMore')}
                            <svg className="w-3 h-3 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                        <Link 
                            href="/dashboard/transparency-ledger" 
                            className="flex items-center justify-center py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] text-gray-400 font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                        >
                            <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            {t('certifyYield')}
                        </Link>
                    </div>
                </div>
            )}

            {/* Transit Spoilage Risk Bar - Post-Harvest Only */}
            {isHarvested && (
                <div className="z-10 w-full mb-4 px-2">
                    <div className="flex justify-between items-end mb-1.5">
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{t('transitSpoilageRisk')}</span>
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
            )}

            {/* Collapsible Detailed Breakdown - Post-Harvest Only */}
            {isHarvested && (
                <div className="z-10 w-full mt-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full flex items-center justify-center space-x-2 text-[10px] text-gray-500 font-black uppercase tracking-widest py-2 hover:text-white transition-colors"
                    >
                        <span>{isExpanded ? t('cancel') : t('learnMore')}</span>
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
                                    {t('marketValue')}
                                </span>
                                <span className="text-white">+₹{n(grossRevenue)}</span>
                            </div>

                            {/* Logistics */}
                            <div className="flex justify-between items-center text-gray-400">
                                <span className="flex items-center text-xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2"></span>
                                    {t('logistics')}
                                </span>
                                <span className="text-red-400">-₹{n(logistics)}</span>
                            </div>

                            {/* Spoilage */}
                            <div className="flex justify-between items-center text-gray-400">
                                <span className="flex items-center text-xs">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                                    {t('qualityLoss')}
                                </span>
                                <span className="text-red-400">-₹{n(spoilagePenalty)}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Real-time Heartbeat */}
            <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center">
                <div className="flex items-center space-x-2 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                    <span className="flex h-1.5 w-1.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-mint"></span>
                    </span>
                    <span className="text-[8px] text-gray-400 uppercase font-black tracking-widest">{t('liveArbitration')}</span>
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
