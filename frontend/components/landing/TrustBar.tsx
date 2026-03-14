"use client";

import { motion } from "framer-motion";

const PARTNERS = [
  { name: "Groq", logo: "/logos/groq.svg" },
  { name: "Polygon", logo: "/logos/polygon.svg" },
  { name: "IMD", logo: "/logos/imd.svg" },
  { name: "e-NAM", logo: "/logos/enam.svg" },
  { name: "Stripe", logo: "/logos/stripe.svg" },
  { name: "Supabase", logo: "/logos/supabase.svg" }
];

export function TrustBar() {
  return (
    <div className="py-12 border-y border-white/5 bg-black/20">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-gray-500 mb-10 opacity-60">
          Powered by industry-leading technology
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 md:gap-x-20">
          {PARTNERS.map((partner) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0.3, filter: "grayscale(100%)" }}
              whileHover={{ opacity: 1, filter: "grayscale(0%)" }}
              className="group cursor-pointer flex items-center"
            >
                <span className="text-lg md:text-xl font-black tracking-tighter text-gray-500 group-hover:text-white transition-colors uppercase italic">
                    {partner.name}
                </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
