"use client";

import { motion } from "framer-motion";
import { 
  Mic, 
  WifiOff, 
  TrendingUp, 
  ShieldCheck, 
  BarChart3, 
  Zap, 
  Globe 
} from "lucide-react";

const FEATURES = [
  {
    title: "Agri-Vakeel AI",
    desc: "Speak in Hindi or Marathi. Voice-first sub-second empathetic advice powered by Groq & Llama 3.",
    icon: <Mic className="w-8 h-8 text-mint" />,
    size: "md:col-span-2",
    color: "bg-mint/10",
  },
  {
    title: "Offline-First",
    desc: "Works in deep field. Caches data and voice via Service Workers.",
    icon: <WifiOff className="w-8 h-8 text-blue-400" />,
    size: "md:col-span-1",
    color: "bg-blue-500/10",
  },
  {
    title: "Temporal Arbitrage",
    desc: "Stop selling at a loss. Ingests weather & mandi prices to tell you exactly when to sell.",
    icon: <TrendingUp className="w-8 h-8 text-orange-400" />,
    size: "md:col-span-1",
    color: "bg-orange-500/10",
  },
  {
    title: "Blockchain Traceability",
    desc: "Polygon-powered transparency ledger for every harvest batch.",
    icon: <ShieldCheck className="w-8 h-8 text-purple-400" />,
    size: "md:col-span-2",
    color: "bg-purple-500/10",
  },
  {
    title: "Net Realization math",
    desc: "We deduct logistics and heat decay spoilage to show your exact take-home profit.",
    icon: <BarChart3 className="w-8 h-8 text-teal-400" />,
    size: "md:col-span-1",
    color: "bg-teal-500/10",
  },
  {
    title: "Shock Analyzer",
    desc: "Detect black-swan price crashes 24h before they hit.",
    icon: <Zap className="w-8 h-8 text-red-400" />,
    size: "md:col-span-1",
    color: "bg-red-500/10",
  },
  {
    title: "Global Mandi Orbit",
    desc: "Rank every market in a 500km radius by absolute net realization.",
    icon: <Globe className="w-8 h-8 text-emerald-400" />,
    size: "md:col-span-1",
    color: "bg-emerald-500/10",
  }
];

export function BentoGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
      {FEATURES.map((feature, i) => (
        <motion.div
          key={i}
          whileHover={{ y: -5, scale: 1.01 }}
          className={`glass-panel rounded-3xl p-8 relative overflow-hidden group cursor-pointer ${feature.size}`}
        >
          {/* Decorative background glow */}
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[80px] -mr-16 -mt-16 transition-colors ${feature.color} opacity-0 group-hover:opacity-100`}></div>
          
          <div className="relative z-10 h-full flex flex-col">
            <div className="mb-4 inline-block p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:border-mint/30 transition-colors">
              {feature.icon}
            </div>
            
            <h3 className="text-xl font-black mb-3 text-white tracking-tight">
              {feature.title}
            </h3>
            
            <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-200 transition-colors">
              {feature.desc}
            </p>
          </div>
          
          {/* Subtle border shine effect */}
          <div className="absolute inset-0 border border-white/5 group-hover:border-mint/20 rounded-3xl pointer-events-none transition-colors"></div>
        </motion.div>
      ))}
    </div>
  );
}
