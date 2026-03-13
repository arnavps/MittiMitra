"use client";

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/glass-card';

export function StatusPill({ status, message, className = "" }: { status: "GREEN" | "YELLOW" | "RED" | "STABLE" | "WATCH" | "REROUTE", message: string, className?: string }) {
    const getColors = () => {
        switch (status) {
            case "GREEN":
            case "STABLE": return "bg-mint/20 text-mint border-mint/50";
            case "YELLOW":
            case "WATCH": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
            case "RED":
            case "REROUTE": return "bg-red-500/20 text-red-400 border-red-500/50";
            default: return "bg-gray-500/20 text-gray-300 border-gray-500/50";
        }
    };

    const getIcon = () => {
        switch (status) {
            case "GREEN":
                return <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
            case "YELLOW":
                return <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
            case "RED":
                return <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
            default: return null;
        }
    };

    return (
        <div className={`flex items-center px-4 py-2 rounded-full border ${getColors()} font-semibold shadow-sm ${className}`}>
            {getIcon()}
            {message}
        </div>
    );
}
