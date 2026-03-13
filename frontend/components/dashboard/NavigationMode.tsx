"use client";

import { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@/components/glass-card';
import { useLanguage } from '@/contexts/LanguageContext';
import { VoiceAssistant } from '@/components/voice-assistant';
import { useOfflineCache } from '@/hooks/useOfflineCache';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in Leaflet + Next.js
const fixLeafletIcon = () => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
};

// Dynamic Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false });

interface NavigationModeProps {
    targetMandi: string;
    startLoc: { lat: number; lng: number };
    endLoc: { lat: number; lng: number };
    distanceLeft: number;
    estimatedArrival: string;
    onExit: () => void;
}

export function NavigationMode({ targetMandi, startLoc, endLoc, distanceLeft: totalDistance, estimatedArrival, onExit }: NavigationModeProps) {
    const { t } = useLanguage();
    const { cacheMapTiles, getPreservationReminder } = useOfflineCache('navigation');
    const [speed, setSpeed] = useState(0);
    const [showStopPrompt, setShowStopPrompt] = useState(false);
    const [lastInstruction, setLastInstruction] = useState("");
    const [hoursElapsed, setHoursElapsed] = useState(0);
    const [currentPos, setCurrentPos] = useState({ lat: startLoc.lat, lng: startLoc.lng });
    const [progress, setProgress] = useState(0); // 0 to 1

    // Pre-download Map Tiles for 0G dead zones
    useEffect(() => {
        fixLeafletIcon();
        cacheMapTiles(startLoc, 15);
    }, []);

    const speak = (text: string) => {
        if (!window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-IN'; 
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    // Simulated Movement Interpolation
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                const next = Math.min(prev + 0.005, 1);
                
                // Interpolate Coordinates
                const currentLat = startLoc.lat + (endLoc.lat - startLoc.lat) * next;
                const currentLng = startLoc.lng + (endLoc.lng - startLoc.lng) * next;
                setCurrentPos({ lat: currentLat, lng: currentLng });
                
                return next;
            });
        }, 3000); // Progress every 3s
        return () => clearInterval(interval);
    }, [startLoc, endLoc]);

    // Simulated Navigation Directions based on progress
    useEffect(() => {
        const triggers = [
            { p: 0.0, msg: "Start your trip. Head North toward the main highway." },
            { p: 0.1, msg: "Continue straight for 5 kilometers. Road is clear." },
            { p: 0.3, msg: "Take the slight right at the junction ahead." },
            { p: 0.5, msg: "Halfway mark reached. Check your crop ventilation." }
        ];
        
        const trigger = triggers.find(tr => Math.abs(progress - tr.p) < 0.005);
        if (trigger) {
            setLastInstruction(trigger.msg);
            speak(trigger.msg);
        }
    }, [progress]);

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
        }, 60000); 
        return () => clearInterval(interval);
    }, [hoursElapsed]);

    // Background Sync: Market-Watch & Thermal Safety
    useEffect(() => {
        const syncInterval = setInterval(async () => {
             try {
                const res = await fetch('/api/copilot/thermal-check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        crop: "Tomato",
                        current_temp: 34,
                        path_forecasts: [{temp: 36, hours_from_now: 1}],
                        remaining_hours: 1.5 * (1 - progress)
                    })
                });
                const thermal = await res.json();
                
                if (thermal.needs_reroute) {
                    const alertMsg = "Alert! Thermal safety threshold exceeded. Recalculating cooler path.";
                    window.dispatchEvent(new CustomEvent('agriVakeelIntervention', { 
                        detail: { message: alertMsg, title: "THERMAL ALERT" } 
                    }));
                }
             } catch (e) { console.error(e); }
        }, 30000); 
        return () => clearInterval(syncInterval);
    }, [progress]);

    // GPS speed detection
    useEffect(() => {
        if (!navigator.geolocation) return;
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const speedKph = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : (progress > 0 && progress < 1 ? 40 : 0);
                setSpeed(speedKph);
            },
            (err) => console.warn("GPS Speed detection failed", err),
            { enableHighAccuracy: true }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [progress]);

    const distanceRemaining = Math.max(0, Math.round(totalDistance * (1 - progress)));

    // Helper component to update map view dynamically
    function MapRefocus({ pos }: { pos: { lat: number, lng: number } }) {
        // @ts-ignore
        const map = useMap();
        useEffect(() => {
            if (map) map.panTo([pos.lat, pos.lng]);
        }, [pos, map]);
        return null;
    }

    return (
        <div className="fixed inset-0 z-[100000] bg-black/40 backdrop-blur-md flex items-center justify-center p-0 md:p-6 lg:p-10">
            <div className="w-full h-full max-w-[1600px] bg-[#050505] border-2 border-white/10 rounded-none md:rounded-[60px] shadow-[0_0_150px_rgba(0,0,0,0.8)] flex flex-col md:flex-row overflow-hidden relative animate-in zoom-in-95 duration-500">
                
                {/* Left: Live Map (65%) */}
                <div className="w-full md:w-[65%] h-[50%] md:h-full relative bg-forest/20">
                    {typeof window !== 'undefined' && (
                        <MapContainer
                            center={[currentPos.lat, currentPos.lng]}
                            zoom={13}
                            scrollWheelZoom={false}
                            zoomControl={false}
                            className="h-full w-full grayscale-[0.5] invert-[0.9] hue-rotate-[160deg]"
                        >
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                            <Polyline 
                                positions={[[startLoc.lat, startLoc.lng], [endLoc.lat, endLoc.lng]]} 
                                pathOptions={{ color: '#20FFBD', weight: 6, opacity: 0.4 }}
                            />
                            <Marker position={[currentPos.lat, currentPos.lng]} />
                            <MapRefocus pos={currentPos} />
                        </MapContainer>
                    )}
                    
                    {/* Floating Map Controls */}
                    <div className="absolute bottom-10 left-10 z-[1000] flex flex-col space-y-4">
                         <div className="p-4 bg-black/80 backdrop-blur-xl border-2 border-mint/20 rounded-3xl shadow-2xl">
                             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-mint mb-2">Live GPS Tracking</p>
                             <div className="flex items-center space-x-3">
                                 <div className="w-3 h-3 bg-mint rounded-full animate-ping" />
                                 <p className="text-white font-mono font-bold">{currentPos.lat.toFixed(4)}, {currentPos.lng.toFixed(4)}</p>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Right: Telemetry & Actions (35%) */}
                <div className="w-full md:w-[35%] h-[50%] md:h-full bg-forest/30 border-t-2 md:border-t-0 md:border-l-2 border-white/5 flex flex-col p-6 md:p-10 overflow-y-auto">
                    
                    {/* Header with Exit */}
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
                                {targetMandi}
                            </h2>
                            <div className="flex items-center mt-3 space-x-3">
                                <span className="px-2 py-0.5 bg-mint/10 text-mint text-xs font-black rounded border border-mint/20 uppercase tracking-widest animate-pulse">
                                    LIVE
                                </span>
                                <span className="text-gray-400 text-xl font-mono font-bold">
                                    {estimatedArrival}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowStopPrompt(true)}
                            className="bg-red-600/20 text-red-500 p-4 rounded-2xl border-2 border-red-500/20 hover:bg-red-600 hover:text-white transition-all active:scale-95"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="p-6 bg-black/40 border border-white/5 rounded-[40px] flex flex-col items-center justify-center">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 text-center">KM Left</span>
                            <span className="text-5xl font-black text-white font-mono leading-none">{distanceRemaining}</span>
                        </div>
                        <div className="p-6 bg-mint/10 border border-mint/20 rounded-[40px] flex flex-col items-center justify-center">
                            <span className="text-[10px] text-mint/60 font-black uppercase tracking-widest mb-1 text-center">KPH Speed</span>
                            <span className="text-5xl font-black text-mint font-mono leading-none">{speed}</span>
                        </div>
                    </div>

                    {/* Navigation Instruction */}
                    <div className="flex-1 space-y-8">
                         <div className="p-8 bg-white/[0.03] border-2 border-white/5 rounded-[40px] relative overflow-hidden group">
                             <div className="absolute top-0 left-0 w-2 h-full bg-mint group-hover:w-4 transition-all" />
                             <div className="flex items-center space-x-6">
                                 <div className="w-16 h-16 bg-mint text-forest rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                                     <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                 </div>
                                 <div>
                                     <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Next Action</p>
                                     <p className="text-2xl text-white font-bold leading-tight">
                                         {lastInstruction || "Drive Northwards..."}
                                     </p>
                                 </div>
                             </div>
                         </div>
                    </div>

                    {/* Preservation Tip Mini-Card */}
                    <div className="mt-8 p-6 bg-orange-500/10 border border-orange-500/20 rounded-[40px]">
                        <div className="flex items-center space-x-3 mb-2">
                             <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                             <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Storage Alert</span>
                        </div>
                        <p className="text-sm text-gray-300 font-medium leading-relaxed">
                            Maintain consistent speed to ensure airflow through crates. Current temp: 34°C.
                        </p>
                    </div>
                </div>

                {/* Exit Confirmation Modal */}
                {showStopPrompt && (
                    <div className="fixed inset-0 z-[100001] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
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
