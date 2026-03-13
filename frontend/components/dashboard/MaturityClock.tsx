"use client";

interface MaturityClockProps {
    maturityPct: number;
    daysToPeak: number;
    windowStart: string;
    windowEnd: string;
    status: 'IDEAL' | 'WAIT' | 'OVERDUE';
}

export function MaturityClock({ 
    maturityPct, 
    daysToPeak, 
    windowStart, 
    windowEnd, 
    status 
}: MaturityClockProps) {
    const isIdeal = status === 'IDEAL';
    const isOverdue = status === 'OVERDUE';
    
    // Circular progress math
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (maturityPct / 100) * circumference;

    return (
        <div className="relative flex flex-col items-center">
            <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Background Track */}
                <svg className="absolute w-full h-full -rotate-90">
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        className="stroke-white/10 fill-none"
                        strokeWidth="8"
                    />
                    {/* Progress Circle */}
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        className={`fill-none transition-all duration-1000 ease-out ${
                            isIdeal ? 'stroke-mint' : isOverdue ? 'stroke-red-500' : 'stroke-blue-400'
                        }`}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                    />
                </svg>

                <div className="text-center z-10">
                    <span className="text-2xl font-black text-white">{Math.round(maturityPct)}%</span>
                    <p className="text-[8px] text-gray-400 uppercase font-bold tracking-tighter">Maturity</p>
                </div>

                {/* Pulsing indicator if ideal */}
                {isIdeal && (
                    <div className="absolute inset-0 rounded-full border border-mint/30 animate-ping"></div>
                )}
            </div>

            <div className="mt-4 text-center">
                <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                    isIdeal ? 'bg-mint/10 text-mint border-mint/30' : 
                    isOverdue ? 'bg-red-500/10 text-red-500 border-red-500/30' : 
                    'bg-blue-500/10 text-blue-400 border-blue-500/30'
                }`}>
                    {isIdeal ? 'Optimal Window' : isOverdue ? 'Overdue' : `Peak in ${daysToPeak} Days`}
                </div>
                
                <p className="text-[9px] text-gray-500 mt-2 font-mono">
                    {windowStart.split(' ')[0]} to {windowEnd.split(' ')[0]}
                </p>
            </div>
        </div>
    );
}
