"use client";

import React from 'react';

interface CropData {
    crop: string;
    yield: number;
    farmers: number;
    color: string;
}

interface RegionData {
    region: string;
    yield: number;
    mandi: string;
    panic: number;
}

export function CropDistributionChart({ data }: { data: CropData[] }) {
    const totalYield = data.reduce((acc, curr) => acc + curr.yield, 0);

    return (
        <div className="space-y-4">
            {data.map((item) => (
                <div key={item.crop} className="space-y-1">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{item.crop}</span>
                        <span className="text-xs font-mono font-bold text-white">{item.yield}q</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                            className="h-full transition-all duration-1000 ease-out"
                            style={{ 
                                width: `${(item.yield / totalYield) * 100}%`,
                                backgroundColor: item.color,
                                boxShadow: `0 0 10px ${item.color}40`
                            }}
                        ></div>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[8px] text-white/30 font-bold uppercase">{item.farmers} Farmers</span>
                        <span className="text-[8px] text-white/30 font-bold uppercase">{Math.round((item.yield / totalYield) * 100)}%</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function RegionalPanicChart({ data }: { data: RegionData[] }) {
    return (
        <div className="space-y-6">
            {data.map((item) => (
                <div key={item.region} className="relative">
                    <div className="flex justify-between mb-2">
                        <div>
                            <p className="text-xs font-bold text-white mb-0.5">{item.region}</p>
                            <p className="text-[9px] text-white/40 uppercase tracking-tighter">Heading to {item.mandi}</p>
                        </div>
                        <div className="text-right">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-sm ${item.panic > 100 ? 'bg-red-500/20 text-red-400' : 'bg-mint/20 text-mint'}`}>
                                {item.panic > 100 ? 'PANIC' : 'STABLE'}
                            </span>
                        </div>
                    </div>
                    
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                        <div 
                            className={`h-full transition-all duration-700 ${item.panic > 100 ? 'bg-red-500' : 'bg-mint'}`}
                            style={{ width: `${Math.min(100, item.panic)}%` }}
                        ></div>
                        {item.panic > 100 && (
                            <div 
                                className="h-full bg-red-600 animate-pulse"
                                style={{ width: `${item.panic - 100}%` }}
                            ></div>
                        )}
                    </div>
                    
                    <div className="flex justify-between mt-1.5">
                        <span className="text-[8px] text-white/30 font-bold">Mandi Load: {item.panic}%</span>
                        <span className="text-[8px] text-white/30 font-bold">Yield: {item.yield}q</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
