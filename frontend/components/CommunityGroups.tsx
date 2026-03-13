"use client";

import { GlassCard } from './glass-card';
import { motion } from 'framer-motion';

interface GroupProps {
    crop: string;
    memberCount: number;
    avgPrice: string;
    trend: 'up' | 'down' | 'stable';
    alert?: string;
}

export function CommunityGroups() {
    const groups: GroupProps[] = [
        {
            crop: "Tomato",
            memberCount: 1240,
            avgPrice: "₹2,450/q",
            trend: 'up',
            alert: "Late Blight spreading in Nashik-West"
        },
        {
            crop: "Onion",
            memberCount: 856,
            avgPrice: "₹1,800/q",
            trend: 'stable'
        },
        {
            crop: "Potato",
            memberCount: 542,
            avgPrice: "₹1,200/q",
            trend: 'down',
            alert: "Supply surge expected in 48h"
        }
    ];

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-black italic uppercase tracking-tighter text-white/80">Crop-Specific Circles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {groups.map((group, idx) => (
                    <motion.div
                        key={group.crop}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <GlassCard className={`p-5 space-y-3 border-white/5 hover:border-mint/20 transition-all ${group.alert ? 'ring-1 ring-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.05)]' : ''}`}>
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-white uppercase italic tracking-tight">{group.crop} Circle</h3>
                                    <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">{group.memberCount} Farmers Active</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-2 border-y border-white/5">
                                <div>
                                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Ground Price</p>
                                    <p className="text-sm font-black text-white">{group.avgPrice}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Market Trend</p>
                                    <div className="flex items-center space-x-1">
                                        <span className={`text-xs font-bold ${group.trend === 'up' ? 'text-mint' : group.trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
                                            {group.trend.toUpperCase()}
                                        </span>
                                        {group.trend === 'up' && <svg className="w-3 h-3 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>}
                                    </div>
                                </div>
                            </div>

                            {group.alert && (
                                <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                                    <p className="text-[9px] text-orange-400 font-bold flex items-center">
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        ALERT: {group.alert}
                                    </p>
                                </div>
                            )}

                            <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-mint transition-all">
                                Enter Hub
                            </button>
                        </GlassCard>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
