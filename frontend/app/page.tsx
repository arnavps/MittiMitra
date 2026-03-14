"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/Navbar";

export default function LandingPage() {
  const [isClient, setIsClient] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="bg-forest text-white selection:bg-mint selection:text-forest relative">
      {/* Navbar */}
      <Navbar />

      {/* Absolute Background Image - RAW */}
      <img
        src="/bg-img.jpg"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-100 pointer-events-none"
      />
      {/* Gradient to cleanly fade the bottom of the image into the grid section */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-forest/40 to-forest z-0 pointer-events-none"></div>

      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-mint/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 animate-pulse-slow z-0"></div>
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] translate-y-1/4 -translate-x-1/4 z-0"></div>

      {/* --- INITIAL VIEWPORT (100vh) --- */}
      <div className="relative min-h-screen flex flex-col justify-between">
        {/* Navigation Layer - Spacer for Navbar */}
        <div className="h-4"></div>

        {/* Hero Section */}
        <main className="relative z-10 flex-grow flex flex-col items-center justify-center text-center px-4 mx-auto w-full max-w-5xl">

          {/* Badge */}
          <div className="mb-3 inline-flex items-center rounded-full border border-mint/30 bg-mint/10 px-4 py-1.5 text-sm font-medium text-mint shadow-[0_0_15px_rgba(32,255,189,0.15)] animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-mint animate-pulse mr-2"></span>
            {t('heroBadge')}
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-2 leading-[1.1] animate-fade-in-up md:animate-delay-100 drop-shadow-md">
            {t('heroHeading1')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-mint to-blue-400">
              {t('heroHeading2')}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-200 max-w-2xl mb-6 animate-fade-in-up md:animate-delay-200 drop-shadow-sm">
            {t('heroDescription')}
          </p>

          <div className="flex flex-col sm:flex-row items-center font-bold space-y-4 sm:space-y-0 sm:space-x-4 animate-fade-in-up md:animate-delay-300">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-mint text-forest hover:bg-white transition-all shadow-[0_0_30px_rgba(32,255,189,0.3)] hover:shadow-[0_0_40px_rgba(32,255,189,0.5)] transform hover:-translate-y-1"
            >
              {t('enterDecisionHub')}
            </Link>
            <Link
              href="#demo"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-transparent border border-gray-400/50 text-white hover:border-white transition-colors backdrop-blur-md"
            >
              {t('watchDemo')}
            </Link>
          </div>
        </main>

        {/* Spacer strictly matching Navbar height to ensure perfect flex vertical centering */}
        <div className="h-[72px]"></div>
      </div>

      {/* Feature Bento Grid (BELOW THE FOLD) */}
      <section className="relative z-10 px-6 py-24 bg-black/40 border-t border-glass-border" id="features">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 whitespace-pre-line">{t('bentoTitle')}</h2>
            <p className="text-gray-400">{t('bentoDesc')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Bento Box 1: Shock Analyzer */}
            <div className="md:col-span-2 relative overflow-hidden rounded-3xl border border-glass-border bg-glass-bg backdrop-blur-md p-8 hover:border-mint/50 transition-colors group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-red-500/20 transition-colors"></div>
              <svg className="w-10 h-10 text-red-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <h3 className="text-2xl font-bold mb-2">{t('shockTitle')}</h3>
              <p className="text-gray-400 max-w-md border-transparent text-sm md:text-base leading-relaxed">{t('shockDesc')}</p>
            </div>

            {/* Bento Box 2: Voice AI */}
            <div className="relative overflow-hidden rounded-3xl border border-glass-border bg-glass-bg backdrop-blur-md p-8 hover:border-mint/50 transition-colors group">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-mint/10 rounded-full blur-2xl group-hover:bg-mint/20 transition-colors"></div>
              <svg className="w-10 h-10 text-mint mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              <h3 className="text-2xl font-bold mb-2">{t('voiceTitle')}</h3>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed">{t('voiceDesc')}</p>
            </div>

            {/* Bento Box 3: Offline */}
            <div className="relative overflow-hidden rounded-3xl border border-glass-border bg-glass-bg backdrop-blur-md p-8 hover:border-mint/50 transition-colors group">
              <svg className="w-10 h-10 text-blue-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <h3 className="text-2xl font-bold mb-2">{t('offlineTitle')}</h3>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed">{t('offlineDesc')}</p>
            </div>

            {/* Bento Box 4: Arbitrage */}
            <div className="md:col-span-2 relative overflow-hidden rounded-3xl border border-glass-border bg-glass-bg backdrop-blur-md p-8 hover:border-mint/50 transition-colors group">
              <div className="absolute inset-0 bg-gradient-to-r from-mint/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <svg className="w-10 h-10 text-mint mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              <h3 className="text-2xl font-bold mb-2">{t('arbitrageTitle')}</h3>
              <p className="text-gray-400 max-w-md text-sm md:text-base leading-relaxed">{t('arbitrageDesc')}</p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-glass-border py-12 text-center text-sm text-gray-500">
        <p>© 2026 MittiMitra (KrishiAI) by Team Technexis. Built for Indian smallholder farmers.</p>
      </footer>
    </div>
  );
}
