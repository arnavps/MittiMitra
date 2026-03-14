"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/Navbar";

// Upgraded Components
import { TrustBar } from "@/components/landing/TrustBar";
import { BentoGrid } from "@/components/landing/BentoGrid";
import { TechTerminal } from "@/components/landing/TechTerminal";
import { EdgeLedgerEngine } from "@/components/landing/EdgeLedgerEngine";
import { TechDeepDive } from "@/components/landing/TechDeepDive";
import { ImpactSection } from "@/components/landing/ImpactSection";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  const [isClient, setIsClient] = useState(false);
  const { t } = useLanguage();
  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return <div className="bg-forest min-h-screen" />;

  return (
    <div className="bg-forest text-white selection:bg-mint selection:text-forest relative font-sans overflow-x-hidden">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 pt-20">
        {/* Parallax Background */}
        <motion.div style={{ y: heroY }} className="absolute inset-0 z-0">
          <img
            src="/bg-img.jpg"
            alt="Farm Background"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-forest/20 via-forest/60 to-forest"></div>
        </motion.div>

        {/* Dynamic Blobs */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-mint/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] translate-y-1/4 -translate-x-1/4"></div>

        <motion.div 
          style={{ opacity: heroOpacity }}
          className="relative z-10 w-full max-w-7xl flex flex-col lg:flex-row items-center justify-between gap-16"
        >
          {/* Hero Left Content */}
          <div className="flex-1 text-center lg:text-left">

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter mb-6 leading-[0.95] drop-shadow-2xl"
            >
              {t('heroHeading1')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-mint to-blue-400">
                {t('heroHeading2')}
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base md:text-lg text-gray-400 max-w-xl mb-10 leading-relaxed font-medium"
            >
              {t('heroDescription')}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6"
            >
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-mint text-forest font-black uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_40px_rgba(32,255,189,0.3)] hover:shadow-[0_0_60px_rgba(32,255,189,0.5)] transform hover:-translate-y-1 text-sm text-center"
              >
                {t('enterDecisionHub')}
              </Link>
              <Link
                href="#how-it-works"
                className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all backdrop-blur-xl text-sm text-center"
              >
                {t('watchDemo')}
              </Link>
            </motion.div>
          </div>

          {/* Hero Right Content: Tech Terminal */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex-1 w-full max-w-md hidden lg:block"
          >
            <TechTerminal />
          </motion.div>
        </motion.div>
      </section>

      {/* --- TRUST BAR --- */}
      <TrustBar />

      {/* --- BENTO GRID SECTION --- */}
      <section id="features" className="py-24 relative z-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-20">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-black mb-6 tracking-tight"
            >
              {t('bentoTitle')}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 text-lg"
            >
              {t('bentoDesc')}
            </motion.p>
          </div>
          <BentoGrid />
        </div>
      </section>

      {/* --- EDGE LEDGER ENGINE --- */}
      <div id="solutions">
        <EdgeLedgerEngine />
      </div>

      {/* --- TECH DEEP DIVE --- */}
      <div id="about">
        <TechDeepDive />
      </div>

      {/* --- IMPACT SECTION --- */}
      <ImpactSection />

      {/* --- FOOTER --- */}
      <div id="contact">
        <Footer />
      </div>
    </div>
  );
}
