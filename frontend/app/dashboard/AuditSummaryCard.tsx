import { useLanguage } from '@/contexts/LanguageContext';
import { speak } from '@/services/ttsService';
import { Volume2 } from 'lucide-react';

interface AuditSummaryCardProps {
    auditData: any;
}

export function AuditSummaryCard({ auditData }: AuditSummaryCardProps) {
    const { t, n, language } = useLanguage();

    if (!auditData) return null;

    const {
        current_setup,
        ideal_setup,
        leak_inr_24h,
        leak_inr_per_hour,
        is_high_risk,
        current_spoilage_24h_pct,
        ideal_spoilage_24h_pct
    } = auditData;

    return (
        <div className="rounded-3xl border border-white/20 bg-black/20 backdrop-blur-xl p-6 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            {/* Background Risk Indicator */}
            {is_high_risk && (
                <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 rounded-full blur-2xl -mr-16 -mt-16 animate-pulse"></div>
            )}
            
            <div className="flex justify-between items-center mb-4 z-10 relative">
                <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${is_high_risk ? 'bg-red-500/20 text-red-500 border-red-500/50' : 'bg-mint/20 text-mint border-mint/50'} border`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="flex items-center space-x-2">
                        <h3 className="text-white font-bold tracking-widest uppercase text-xs">{t('logisticsAudit')}</h3>
                        <div className="flex items-center space-x-1">
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    const reasonText = auditData.reasons ? ` ${t('dueTo')} ${auditData.reasons.join(' ')}` : '';
                                    const audioText = `${t('logisticsAudit')}: ${t('yourSetupIs')} ${current_setup} ${t('with')} ${n(current_spoilage_24h_pct)}% ${t('spoilageLoss')}.${reasonText} ${t('idealSetupIs')} ${ideal_setup}. ${leak_inr_24h > 0 ? `${t('losing')} ${n(leak_inr_per_hour)} ${t('rupees')} ${t('perHour')}.` : ''}`;
                                    speak(audioText, language);
                                }}
                                className="p-1 hover:bg-mint/20 rounded-full transition-colors group/audio"
                                title="Listen to Logistics Audit"
                            >
                                <Volume2 className="w-3 h-3 text-mint/60 group-hover/audio:text-mint transition-colors" />
                            </button>
                            <button 
                                onClick={() => {
                                    const event = new CustomEvent('agriVakeelAsk', { 
                                        detail: { 
                                            query: `Explain the profit leak in my ${current_setup}. Why am I losing ₹${n(leak_inr_per_hour)} every hour?` 
                                        } 
                                    });
                                    window.dispatchEvent(event);
                                }}
                                className="text-[10px] text-mint/80 font-black uppercase tracking-widest flex items-center hover:text-white focus:outline-none bg-mint/5 px-2 py-0.5 rounded border border-mint/10 hover:border-mint/30 transition-all font-mono"
                            >
                                {t('askWhy') || 'Ask Why?'}
                            </button>
                        </div>
                    </div>
                </div>
                {is_high_risk ? (
                    <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-widest border border-red-500/30 flex items-center animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
                        {t('highRisk')}
                    </span>
                ) : (
                    <span className="bg-mint/10 text-mint text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-widest border border-mint/20">
                        {t('optimized')}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5 z-10 relative">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{t('yourSetup')}</p>
                    <p className="text-white font-bold text-sm truncate">{current_setup}</p>
                    <p className="text-red-400 text-xs font-mono mt-1 font-bold">{n(current_spoilage_24h_pct)}% {t('spoilage24h')}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">{t('idealSetup')}</p>
                    <p className="text-white font-bold text-sm truncate">{ideal_setup}</p>
                    <p className="text-mint text-xs font-mono mt-1 font-bold">{n(ideal_spoilage_24h_pct)}% {t('spoilage24h')}</p>
                </div>
            </div>

            {leak_inr_24h > 0 && (
                <div className={`rounded-xl p-4 flex justify-between items-center z-10 relative border ${is_high_risk ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-400/5 border-yellow-400/20'}`}>
                    <div>
                        <p className={`text-[10px] uppercase tracking-widest font-black mb-1 ${is_high_risk ? 'text-red-400' : 'text-yellow-400'}`}>
                            {t('identifiedProfitLeak')}
                        </p>
                        <p className="text-white/80 text-xs font-medium">{t('costingYouPerHour').replace('{{val}}', n(leak_inr_per_hour))}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">{t('loss24h')}</p>
                        <p className={`text-xl font-mono font-black ${is_high_risk ? 'text-red-400' : 'text-yellow-400'}`}>
                            -₹{n(leak_inr_24h)}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
