"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/language-switcher";

export function Navbar() {
  const { t } = useLanguage();

  const ArrowUpRight = ({ className }: { className?: string }) => (
    <svg 
      className={className}
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <line x1="7" y1="17" x2="17" y2="7"></line>
      <polyline points="7 7 17 7 17 17"></polyline>
    </svg>
  );

  return (
    <div className="fixed top-6 left-0 right-0 z-50 px-4 md:px-12 flex justify-center pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-between w-full max-w-6xl h-16 px-4 md:px-6 bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100">
        {/* Logo Section */}
        <div className="flex items-center space-x-2">
          <div className="relative w-8 h-8 overflow-hidden rounded-lg">
            <Image
              src="/logo.jpeg"
              alt="MittiMitra Logo"
              fill
              className="object-cover scale-110"
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">
            <span className="text-[#2D5A27]">Agro</span> Grow
          </span>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          <Link href="/" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">
            {t('home')}
          </Link>
          <Link href="#about" className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
            {t('about')}
          </Link>
          <Link href="#solutions" className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
            {t('solutions')}
          </Link>
          <Link href="#blog" className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
            {t('blog')}
          </Link>
          <Link href="#contact" className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
            {t('contactUs')}
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
            <div className="hidden sm:block">
                <LanguageSwitcher direction="down" />
            </div>
          <Link
            href="/login"
            className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#2D5620] text-white hover:bg-[#234519] transition-all font-semibold text-sm shadow-lg shadow-[#2D5620]/20"
          >
            <span>{t('getStarted')}</span>
            <div className="bg-white/20 rounded-full p-0.5">
                <ArrowUpRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </nav>
    </div>
  );
}
