import React from 'react';
import { GlassCard } from '@/components/glass-card';
import { StatusPill } from '@/components/status-pill';

interface MandiPassProps {
    hash: string;
    record: {
        userId: string;
        timestamp: string;
        qualityScore: number;
        grade: string;
        shadowPrice: number;
        mandiPrice: number;
        crop: string;
    };
}

export const MandiPass: React.FC<MandiPassProps> = ({ hash, record }) => {
    // Using standard high-contrast colors (Black on White) for maximum scannability
    const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(hash)}&size=300&dark=000000&light=ffffff&ecLevel=H`;

    return (
        <div className="print-container">
            <style jsx global>{`
                @media print {
                    /* Hide everything except the pass */
                    body * {
                        visibility: hidden !important;
                    }
                    .print-container, .print-container * {
                        visibility: visible !important;
                    }
                    .print-container {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    /* Remove shadows and glass effects for paper */
                    .print-pass {
                        box-shadow: none !important;
                        border: 1px solid #20FFBD !important;
                        background: white !important;
                        color: black !important;
                    }
                    .print-pass * {
                        color: black !important;
                    }
                    .bg-mint\/10 { background-color: #f0fff4 !important; }
                    .bg-forest\/50 { background-color: #f0f0f0 !important; }
                    .bg-white\/5 { border: 1px solid #eee !important; }
                    .bg-red-500\/10 { background-color: #fff5f5 !important; }
                    
                    /* Force background colors to print */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
            <GlassCard className="max-w-md mx-auto overflow-hidden border-mint/30 shadow-[0_0_50px_rgba(32,255,189,0.15)] print-pass">
            {/* Header / Brand */}
            <div className="bg-mint/10 p-6 border-b border-mint/20 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-mint/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <h2 className="text-2xl font-black text-mint tracking-tighter uppercase italic">Digital Mandi Pass</h2>
                <p className="text-[10px] text-mint/60 font-black tracking-widest uppercase mt-1">Provenance Verfied & Hashed</p>
            </div>

            {/* Main Content */}
            <div className="p-8 space-y-8">
                {/* QR Section */}
                <div className="flex flex-col items-center">
                    <div className="bg-white p-4 rounded-3xl shadow-xl mb-4 ring-4 ring-mint/20">
                        <img 
                            src={qrUrl} 
                            alt="Provenance QR" 
                            className="w-48 h-48 rounded-lg"
                            crossOrigin="anonymous"
                        />
                    </div>
                    <p className="text-[10px] font-mono text-gray-400 break-all max-w-[200px] text-center opacity-50">
                        {hash}
                    </p>
                </div>

                {/* Audit Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Quality Grade</p>
                        <div className="flex items-center space-x-2">
                            <span className="text-3xl font-black text-white">{record.grade}</span>
                            <StatusPill status="GREEN" message="Premium" className="scale-75" />
                        </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Audit Score</p>
                        <span className="text-3xl font-black text-mint">{record.qualityScore}%</span>
                    </div>
                </div>

                {/* Pricing Delta */}
                <div className="bg-gradient-to-br from-mint/20 to-transparent p-6 rounded-3xl border border-mint/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3">
                         <div className="w-1.5 h-1.5 bg-mint rounded-full animate-ping"></div>
                    </div>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-[10px] text-mint font-black uppercase tracking-widest mb-1">Shadow Price Prediction</p>
                            <h3 className="text-4xl font-black text-white italic">₹{record.shadowPrice}</h3>
                            <p className="text-[10px] text-white/40 mt-1 font-bold">Base Mandi: ₹{record.mandiPrice}/Qtl</p>
                        </div>
                        <div className="text-right">
                             <span className="text-2xl font-black text-mint">+{Math.round(((record.shadowPrice/record.mandiPrice)-1)*100)}%</span>
                             <p className="text-[10px] text-mint/60 font-bold">Premium</p>
                        </div>
                    </div>
                </div>

                {/* Footer Meta */}
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                    <div>
                        <p className="text-[9px] text-gray-500 font-bold uppercase">{record.crop} Yield Audit</p>
                        <p className="text-[9px] text-white/30">{new Date(record.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="bg-black/40 px-3 py-1 rounded-full border border-white/10">
                         <span className="text-[10px] text-gray-400 font-mono">ID: {record.userId.slice(0,8)}</span>
                    </div>
                </div>
            </div>
            
            {/* Security Notice */}
            <div className="bg-red-500/10 p-3 text-center border-t border-red-500/20">
                <p className="text-[9px] text-red-400 font-bold uppercase tracking-widest">Tamper-Proof Ledger Protected</p>
            </div>
        </GlassCard>
      </div>
    );
};
