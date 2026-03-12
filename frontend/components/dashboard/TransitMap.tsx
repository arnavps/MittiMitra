"use client";

import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/glass-card';
import { MapContainer, TileLayer, Polyline, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

interface Route {
    id: string;
    name: string;
    distance_km: number;
    duration_hours: number;
    net_realization_inr: number;
    quality_loss_pct: number;
    description: string;
    segments: any[];
}

interface TransitMapProps {
    startLoc: { lat: number; lng: number };
    endLoc: { lat: number; lng: number };
    routes: Route[];
    optimalRouteId?: string;
}

export default function TransitMap({ startLoc, endLoc, routes, optimalRouteId }: TransitMapProps) {
    const [isMounted, setIsMounted] = useState(false);

    const [activeRouteId, setActiveRouteId] = useState<string | null>(null);

    useEffect(() => {
        fixLeafletIcon();
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (optimalRouteId) setActiveRouteId(optimalRouteId);
    }, [optimalRouteId]);

    // Component to re-center map when props change
    function ChangeView({ center }: { center: [number, number] }) {
        const map = useMap();
        useEffect(() => {
            map.setView(center, map.getZoom());
        }, [center, map]);
        return null;
    }

    if (!isMounted) return <div className="h-[400px] w-full bg-forest/50 animate-pulse rounded-2xl border border-white/5" />;

    const effectiveOptimalId = activeRouteId || optimalRouteId || (routes.length > 0 ? routes[0].id : null);
    const mapCenter: [number, number] = [(startLoc.lat + endLoc.lat) / 2, (startLoc.lng + endLoc.lng) / 2];

    // Generate a simple path between start and end for visualization 
    // In a real app, these would come from the Directions API geometry
    const getRoutePath = (index: number) => {
        const offset = (index - 1) * 0.02; // Add some offset to visually separate routes
        return [
            [startLoc.lat, startLoc.lng],
            [(startLoc.lat + endLoc.lat) / 2 + offset, (startLoc.lng + endLoc.lng) / 2 + offset],
            [endLoc.lat, endLoc.lng]
        ] as [number, number][];
    };

    return (
        <GlassCard className="p-0 overflow-hidden relative border-mint/20 shadow-[0_0_30px_rgba(32,255,189,0.1)]">
            <div className="absolute top-4 left-4 z-[1000] space-y-2">
                <div className="bg-forest/80 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-xl">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-mint mb-1">Transit Risk Monitor</h4>
                    <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] text-white font-bold">Thermal Heatmap Active</span>
                    </div>
                </div>
            </div>

            <div className="h-[400px] w-full">
                <MapContainer 
                    center={mapCenter} 
                    zoom={9} 
                    scrollWheelZoom={true}
                    zoomControl={false}
                    className="h-full w-full"
                    style={{ background: '#0a1a12' }}
                >
                    <ChangeView center={mapCenter} />
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />

                    {/* Start & End Markers */}
                    <Marker position={[startLoc.lat, startLoc.lng]}>
                        <Popup>
                            <div className="p-1">
                                <p className="font-bold text-forest">Your Farm</p>
                            </div>
                        </Popup>
                    </Marker>
                    
                    <Marker position={[endLoc.lat, endLoc.lng]}>
                        <Popup>
                             <div className="p-1">
                                <p className="font-bold text-forest">Destination Mandi</p>
                            </div>
                        </Popup>
                    </Marker>

                    {/* Routes */}
                    {routes.map((route, idx) => (
                        <Polyline
                            key={route.id}
                            positions={getRoutePath(idx)}
                            pathOptions={{
                                color: route.id === effectiveOptimalId ? '#20FFBD' : '#ffffff',
                                weight: route.id === effectiveOptimalId ? 6 : 4,
                                opacity: route.id === effectiveOptimalId ? 1 : 0.6,
                                dashArray: route.id === effectiveOptimalId ? undefined : '10, 10'
                            }}
                            eventHandlers={{
                                click: () => setActiveRouteId(route.id)
                            }}
                        >
                            <Popup>
                                <div className="p-2 space-y-1">
                                    <p className="font-black uppercase text-[10px] tracking-widest text-forest/60">{route.name}</p>
                                    <p className="text-xl font-bold">₹{route.net_realization_inr} <span className="text-[10px] text-gray-400">/qtl</span></p>
                                    <p className="text-xs">{route.description}</p>
                                    <p className="text-xs font-bold text-red-500">Spoilage: {route.quality_loss_pct}%</p>
                                </div>
                            </Popup>
                        </Polyline>
                    ))}

                    {/* Thermal Heatmap Mock - "Hot Zones" */}
                    <CircleMarker 
                        center={[(startLoc.lat + endLoc.lat) / 2 + 0.01, (startLoc.lng + endLoc.lng) / 2 + 0.01]}
                        radius={50}
                        pathOptions={{ 
                            fillColor: '#ef4444', 
                            fillOpacity: 0.2, 
                            color: 'transparent' 
                        }}
                    />
                    <CircleMarker 
                        center={[(startLoc.lat + endLoc.lat) / 2 + 0.01, (startLoc.lng + endLoc.lng) / 2 + 0.01]}
                        radius={30}
                        pathOptions={{ 
                            fillColor: '#f97316', 
                            fillOpacity: 0.3, 
                            color: 'transparent' 
                        }}
                    />
                </MapContainer>
            </div>

            {/* Path Selection Footer */}
            <div className="bg-forest/60 backdrop-blur-xl border-t border-white/5 p-4 flex gap-4 overflow-x-auto">
                {routes.map(route => (
                    <button 
                        key={route.id}
                        onClick={() => setActiveRouteId(route.id)}
                        className={`flex-shrink-0 p-3 rounded-xl border transition-all text-left w-48 ${
                            route.id === effectiveOptimalId 
                            ? 'bg-mint/10 border-mint/50 shadow-[0_0_15px_rgba(32,255,189,0.1)]' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                route.id === effectiveOptimalId ? 'bg-mint text-forest' : 'bg-white/10 text-white/60'
                            }`}>
                                {route.id === effectiveOptimalId ? 'Optimal' : 'Alternative'}
                            </span>
                            <span className="text-[9px] font-bold text-white/40">{route.distance_km} km</span>
                        </div>
                        <p className="text-xs font-bold text-white mb-1 truncate">{route.name}</p>
                        <p className="text-lg font-black text-mint">₹{route.net_realization_inr}</p>
                        <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider">Net Realization / QTL</p>
                    </button>
                ))}
            </div>
        </GlassCard>
    );
}
