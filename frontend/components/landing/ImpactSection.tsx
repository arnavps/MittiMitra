"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const STATS = [
  { label: "Profit Boost", value: 15, suffix: "%", desc: "Average increase in net realization" },
  { label: "Middleman Friction", value: 0, suffix: "%", desc: "Transparent blockchain traceability" },
  { label: "Mandi Coverage", value: 500, suffix: "+", desc: "Regional markets ranked live" },
  { label: "Response Time", value: 800, suffix: "ms", desc: "Sub-second Agri-Vakeel AI" }
];

export function ImpactSection() {
  return (
    <section className="py-24 bg-black/40">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          {STATS.map((stat, i) => (
            <Counter key={i} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Counter({ label, value, suffix, desc }: { label: string; value: number; suffix: string; desc: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const duration = 2000;
      const stepTime = Math.abs(Math.floor(duration / value));
      
      const timer = setInterval(() => {
        start += 1;
        setCount(start);
        if (start >= value) clearInterval(timer);
      }, stepTime || 50);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <div ref={ref} className="text-center group">
      <div className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tighter transition-all group-hover:text-mint">
        {count}{suffix}
      </div>
      <div className="text-xs md:text-sm font-bold uppercase tracking-widest text-mint mb-4">
        {label}
      </div>
      <p className="text-gray-500 text-[10px] md:text-xs leading-relaxed max-w-[150px] mx-auto opacity-60">
        {desc}
      </p>
    </div>
  );
}
