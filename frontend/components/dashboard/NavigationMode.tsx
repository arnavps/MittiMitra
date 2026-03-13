"use client";

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/glass-card';
import { useLanguage } from '@/contexts/LanguageContext';
import { VoiceAssistant } from '@/components/voice-assistant';
import { useOfflineCache } from '@/hooks/useOfflineCache';

interface NavigationModeProps {
    targetMandi: string;
    distanceLeft: number;
    estimatedArrival: string;
    onExit: () => void;
}

export function NavigationMode({ targetMandi, distanceLeft, estimatedArrival, onExit }: NavigationModeProps) {
    const { t } = useLanguage();
    const { cacheMapTiles, getPreservationReminder } = useOfflineCache('navigation');
    const [speed, setSpeed] = useState(0);
    const [showStopPrompt, setShowStopPrompt] = useState(false);
    const [lastInstruction, setLastInstruction] = useState("");
    const [hoursElapsed, setHoursElapsed] = useState(0);

    // Pre-download Map Tiles for 0G dead zones
    useEffect(() => {
        cacheMapTiles({ lat: 18.5, lng: 73.8 }, 12);
    }, []);

    const speak = (text: string) => {
        if (!window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-IN'; // Extend to regional in production
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    // Simulated Navigation Directions
    useEffect(() => {
        const directions = [
            "Start your trip. Head North toward the main highway.",
            "Continue straight for 5 kilometers.",
            "Reminder: You've been driving for 2 hours in high heat; check if your tarp is still secure."
        ];
        
        let i = 0;
        const interval = setInterval(() => {
            if (i < directions.length) {
                setLastInstruction(directions[i]);
                speak(directions[i]);
                i++;
            }
        }, 15000); // New instruction every 15s for demo
        
        return () => clearInterval(interval);
    }, []);

    // Periodic Preservation Reminders
    useEffect(() => {
        const interval = setInterval(() => {
            const newHours = hoursElapsed + 1;
            setHoursElapsed(newHours);
            const reminder = getPreservationReminder(newHours, 34, "Tomato");
            if (reminder) {
                setLastInstruction(reminder);
                speak(reminder);
            }
        }, 60000); // Check every minute (simulating hours)
        return () => clearInterval(interval);
    }, [hoursElapsed]);

    // Background Sync: Market-Watch & Thermal Safety
    useEffect(() => {
        const syncInterval = setInterval(async () => {
             try {
                // Mock thermal check
                const res = await fetch('/api/copilot/thermal-check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        crop: "Tomato",
                        current_temp: 34,
                        path_forecasts: [{temp: 36, hours_from_now: 1}],
                        remaining_hours: 1.5
                    })
                });
                const thermal = await res.json();
                
                if (thermal.needs_reroute) {
                    const alertMsg = "Alert! Thermal safety threshold exceeded. Recalculating cooler path.";
                    // VoiceAssistant handles the speech via the intervention event
                    window.dispatchEvent(new CustomEvent('agriVakeelIntervention', { 
                        detail: { message: alertMsg, title: "THERMAL ALERT" } 
                    }));
                }

                // Mock Market Check
                const priceRes = await fetch('/api/copilot/price-drop-check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        current_price: 1800,
                        historical_prices: [2200, 2150, 2100, 2250, 2300],
                        z_threshold: 1.0 // sensitive for demo
                    })
                });
                const priceDrop = await priceRes.json();

                if (priceDrop.alert) {
                    const alertMsg = "Alert! Market prices are falling fast in your target Mandi. Should we reroute to a more stable market?";
                    window.dispatchEvent(new CustomEvent('agriVakeelIntervention', { 
                        detail: { 
                            message: alertMsg, 
                            title: "MARKET ALERT",
                            options: [
                                { label: "Yes, Reroute", action: "reroute" },
                                { label: "No, Continue", action: "ignore" }
                            ]
                        } 
                    }));
                }
             } catch (e) { console.error(e); }
        }, 30000); // Sync every 30s for demo
        
        return () => clearInterval(syncInterval);
    }, []);

    // Real GPS speed detection
    useEffect(() => {
        if (!navigator.geolocation) return;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                // convert m/s to kph (1 m/s = 3.6 kph)
                const speedKph = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0;
                setSpeed(speedKph);
            },
            (err) => console.warn("GPS Speed detection failed", err),
            { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return (
        <div className="fixed inset-0 z-[100000] bg-black/40 backdrop-blur-md flex items-center justify-center p-4 md:p-10">
            <div className="w-full h-full max-w-7xl bg-[#050505] border-2 border-white/10 rounded-[60px] shadow-[0_0_150px_rgba(0,0,0,0.8)] flex flex-col p-6 md:p-12 overflow-y-auto relative animate-in zoom-in-95 duration-500">
                {/* High Contrast Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic">
                        {targetMandi}
                    </h2>
                    <div className="flex items-center mt-2 space-x-4">
                        <span className="px-3 py-1 bg-mint text-forest font-black rounded-md text-xl uppercase tracking-widest animate-pulse">
                            ACTIVE TRIP
                        </span>
                        <span className="text-gray-400 text-2xl font-mono uppercase font-bold tracking-widest">
                            {estimatedArrival}
                        </span>
                    </div>
                </div>
                <button 
                    onClick={() => setShowStopPrompt(true)}
                    className="bg-red-600 text-white p-6 rounded-3xl shadow-[0_0_30px_rgba(220,38,38,0.4)] border-2 border-red-400/30 hover:bg-red-700 transition-all active:scale-95"
                >
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* Core Navigation Stats - Huge Elements */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="text-gray-500 text-2xl font-black uppercase tracking-[0.3em]">Distance Left</p>
                    <div className="text-[120px] md:text-[200px] leading-none font-black text-white font-mono tracking-tighter">
                        {distanceLeft}<span className="text-4xl md:text-6xl text-mint ml-2">KM</span>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="text-gray-500 text-2xl font-black uppercase tracking-[0.3em]">Current Speed</p>
                    <div className="text-[120px] md:text-[200px] leading-none font-black text-mint font-mono tracking-tighter">
                        {speed}<span className="text-4xl md:text-6xl text-white ml-2">KPH</span>
                    </div>
                </div>
            </div>

            {/* Turn-by-Turn Placeholder / Next Action */}
            <div className="mt-8 p-8 bg-forest/30 border-2 border-white/5 rounded-[40px] flex items-center space-x-8">
                <div className="w-32 h-32 bg-mint text-forest rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </div>
                <div className="flex-1">
                    <p className="text-2xl text-gray-400 font-black uppercase tracking-widest mb-1">Next Action</p>
                    <p className="text-4xl md:text-6xl text-white font-bold leading-tight">
                        {lastInstruction || "Calculating initial route... Head North."}
                    </p>
                </div>
            </div>

            {/* Exit Confirmation Modal */}
            {showStopPrompt && (
                <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
                    <div className="max-w-md w-full p-8 rounded-[40px] border-2 border-white/10 bg-forest text-center space-y-8 shadow-[0_0_100px_rgba(32,255,189,0.1)]">
                        <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">Exit Trip Mode?</h3>
                        <p className="text-xl text-gray-400 leading-relaxed font-bold">This will stop background price monitoring and safety alerts. Navigate manually?</p>
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <button 
                                onClick={() => setShowStopPrompt(false)}
                                className="p-6 bg-white/10 text-white text-2xl font-black rounded-3xl border border-white/10 uppercase tracking-widest hover:bg-white/20 transition-all"
                            >
                                GO BACK
                            </button>
                            <button 
                                onClick={onExit}
                                className="p-6 bg-red-600 text-white text-2xl font-black rounded-3xl shadow-2xl uppercase tracking-widest hover:bg-red-700 transition-all active:scale-95"
                            >
                                EXIT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </div>
    );
}
