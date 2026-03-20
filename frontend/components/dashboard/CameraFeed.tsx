"use client";

import { useEffect, useRef, useState } from 'react';
import { Camera, AlertCircle, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface CameraFeedProps {
    onReady?: () => void;
    onError?: (error: string) => void;
}

export function CameraFeed({ onReady, onError }: CameraFeedProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    const startCamera = async () => {
        setError(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment', // Prefer back camera
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                setStream(mediaStream);
                onReady?.();
            }
        } catch (err: any) {
            console.error("Camera access error:", err);
            const errorMsg = err.name === 'NotAllowedError' 
                ? "Camera permission denied." 
                : "Unable to access camera.";
            setError(errorMsg);
            onError?.(errorMsg);
        }
    };

    useEffect(() => {
        startCamera();
        
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    if (error) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4 bg-red-500/10 rounded-3xl border border-red-500/20">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <div>
                    <p className="text-white font-black uppercase tracking-tighter">{error}</p>
                    <p className="text-xs text-red-400 font-medium mt-1">Please enable camera access in your browser settings.</p>
                </div>
                <button 
                    onClick={startCamera}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                >
                    <RefreshCcw className="w-3 h-3" />
                    <span>Retry Access</span>
                </button>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full overflow-hidden rounded-3xl border-2 border-mint/30 shadow-[0_0_50px_rgba(32,255,189,0.1)]">
            <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover grayscale-[0.3] brightness-110"
            />
            
            {/* Glassy Overlay for Scanning */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-mint/5 to-transparent animate-pulse" />
                <motion.div 
                    initial={{ top: '0%' }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-0.5 bg-mint shadow-[0_0_20px_rgba(32,255,189,1)] z-20"
                />
            </div>

            {/* Viewfinder Corners */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-mint rounded-tl-xl" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-mint rounded-tr-xl" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-mint rounded-bl-xl" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-mint rounded-br-xl" />
        </div>
    );
}
