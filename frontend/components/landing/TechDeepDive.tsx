"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, WifiOff, Smartphone, Zap, Database } from "lucide-react";

export function TechDeepDive() {
  const [isOffline, setIsOffline] = useState(false);

  return (
    <section className="py-24 relative">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
            Resilient Architecture
          </h2>
          <p className="text-gray-400">
            Engineered for the reality of rural connectivity.
          </p>
        </div>

        <div className="glass-panel rounded-[32px] p-8 md:p-12 overflow-hidden relative">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Control Panel */}
            <div className="w-full lg:w-1/3">
              <h3 className="text-2xl font-bold mb-6 text-white">Hybrid-Cloud Logic</h3>
              <p className="text-gray-400 text-sm mb-10 leading-relaxed">
                Our PWA uses background sync and IndexedDB to ensure that every voice query and arbitrage calculation works even when signal drops to zero.
              </p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => setIsOffline(false)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${!isOffline ? 'bg-mint/10 border-mint/50 scale-[1.02]' : 'bg-white/5 border-white/10 opacity-50'}`}
                >
                  <div className="flex items-center space-x-3">
                    <Cloud className={`w-5 h-5 ${!isOffline ? 'text-mint' : 'text-gray-400'}`} />
                    <span className={`font-bold ${!isOffline ? 'text-white' : 'text-gray-500'}`}>Cloud Online</span>
                  </div>
                  {!isOffline && <div className="w-2 h-2 rounded-full bg-mint animate-pulse" />}
                </button>

                <button 
                  onClick={() => setIsOffline(true)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${isOffline ? 'bg-blue-500/10 border-blue-500/50 scale-[1.02]' : 'bg-white/5 border-white/10 opacity-50'}`}
                >
                  <div className="flex items-center space-x-3">
                    <WifiOff className={`w-5 h-5 ${isOffline ? 'text-blue-400' : 'text-gray-400'}`} />
                    <span className={`font-bold ${isOffline ? 'text-white' : 'text-gray-500'}`}>Edge Offline</span>
                  </div>
                  {isOffline && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                </button>
              </div>
            </div>

            {/* Visual breakdown */}
            <div className="flex-grow flex items-center justify-center relative">
               <AnimatePresence mode="wait">
                 {!isOffline ? (
                   <motion.div 
                     key="online"
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 1.1 }}
                     className="relative"
                   >
                      <div className="w-64 h-64 rounded-full bg-mint/5 border-2 border-mint/20 flex flex-col items-center justify-center relative z-10">
                         <Database className="w-12 h-12 text-mint mb-2" />
                         <span className="text-mint font-bold uppercase tracking-widest text-[10px]">FastAPI Cluster</span>
                      </div>
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                        className="absolute inset-[-40px] border-2 border-dashed border-white/5 rounded-full"
                      />
                   </motion.div>
                 ) : (
                   <motion.div 
                     key="offline"
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 1.1 }}
                     className="relative"
                   >
                      <div className="w-64 h-64 rounded-full bg-blue-500/5 border-2 border-blue-500/20 flex flex-col items-center justify-center relative z-10">
                         <Smartphone className="w-12 h-12 text-blue-400 mb-2" />
                         <span className="text-blue-400 font-bold uppercase tracking-widest text-[10px]">IndexedDB Cache</span>
                      </div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-blue-500/10" />
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
