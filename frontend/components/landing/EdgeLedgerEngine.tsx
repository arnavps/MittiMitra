"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { 
  Smartphone, 
  Waves, 
  Database, 
  ArrowRight,
  ShieldCheck
} from "lucide-react";

export function EdgeLedgerEngine() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const pathLength = useTransform(scrollYProgress, [0.1, 0.5], [0, 1]);
  const opacity = useTransform(scrollYProgress, [0.5, 0.6], [0, 1]);

  return (
    <div ref={containerRef} className="py-24 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
            The Edge-to-Ledger Engine
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
            Witness the flow of hyper-local intelligence from the field to the immutable blockchain.
          </p>
        </div>

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-12 md:gap-0">
          {/* Connection Lines (Desktop) */}
          <svg className="absolute top-1/2 left-0 w-full h-1 md:block hidden -translate-y-1/2 z-0" fill="none">
             <motion.path 
                d="M 100 0 H 1100" 
                stroke="url(#lineGradient)" 
                strokeWidth="2" 
                strokeDasharray="10 5"
                style={{ pathLength }}
             />
             <defs>
                <linearGradient id="lineGradient" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#20FFBD" stopOpacity="0" />
                    <stop offset="0.5" stopColor="#20FFBD" />
                    <stop offset="1" stopColor="#20FFBD" stopOpacity="0" />
                </linearGradient>
             </defs>
          </svg>

          {/* Node 1: PWA */}
          <EngineNode 
            icon={<Smartphone className="w-8 h-8 text-blue-400" />}
            title="PWA Offline"
            desc="Field-ready data capture"
            delay={0}
          />

          {/* Node 2: AI Ripple */}
          <EngineNode 
            icon={<Waves className="w-8 h-8 text-mint" />}
            title="Agri-Vakeel AI"
            desc="Voice-first intelligence"
            delay={0.2}
            isRipple
          />

          {/* Node 3: Blockchain */}
          <EngineNode 
            icon={<ShieldCheck className="w-8 h-8 text-purple-400" />}
            title="Traceability"
            desc="Immutable ledger seal"
            delay={0.4}
          />
        </div>
      </div>
    </div>
  );
}

function EngineNode({ icon, title, desc, delay, isRipple = false }: { 
    icon: React.ReactNode; 
    title: string; 
    desc: string; 
    delay: number;
    isRipple?: boolean;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative z-10 flex flex-col items-center text-center max-w-[200px]"
    >
      <div className="w-20 h-20 rounded-2xl glass-panel flex items-center justify-center mb-6 relative group border-white/10 hover:border-mint/50 transition-colors">
        {isRipple && (
            <>
                <div className="absolute inset-0 rounded-2xl bg-mint/20 animate-ping opacity-20"></div>
                <div className="absolute inset-0 rounded-2xl bg-mint/10 animate-pulse opacity-30"></div>
            </>
        )}
        <div className="relative z-10 group-hover:scale-110 transition-transform">
            {icon}
        </div>
      </div>
      <h4 className="text-white font-bold mb-2 tracking-tight">{title}</h4>
      <p className="text-gray-500 text-[10px] md:text-xs leading-relaxed uppercase tracking-widest font-bold">{desc}</p>
    </motion.div>
  );
}
