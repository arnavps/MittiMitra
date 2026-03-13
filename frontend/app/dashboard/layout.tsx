'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { auth } from '@/services/firebase';
import { LanguageSwitcher } from '@/components/language-switcher';

import { ConsentNotice } from '@/components/auth/ConsentNotice';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { t } = useLanguage();
    const [profileName, setProfileName] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const phone = auth.currentUser?.phoneNumber || localStorage.getItem('demo_phone') || "9999999999";
                const { data } = await supabase
                    .from('profiles')
                    .select('name')
                    .eq('phone', phone)
                    .single();

                if (data?.name) {
                    setProfileName(data.name);
                }
            } catch (error) {
                console.error("Failed to fetch profile in layout");
            }
        };
        fetchProfile();
    }, []);

    // Since we need "Strategy", "Market Maps", "Agri-Vakeel", let's use translated keys if possible, or fallback
    // We'll add these keys to translations later
    const navItems = [
        {
            name: 'Strategy',
            tKey: 'strategy',
            href: '/dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
        {
            name: 'Market Maps',
            tKey: 'marketMaps',
            href: '/dashboard/market-maps',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            name: 'Logistics',
            tKey: 'logistics',
            href: '/dashboard/logistics',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
            )
        },
        {
            name: 'Agri-Vakeel',
            tKey: 'agriVakeelNav',
            href: '/dashboard/agri-vakeel',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            )
        },
        {
            name: 'Disease Audit',
            tKey: 'diseaseAudit',
            href: '/dashboard/disease-audit',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            )
        },
        {
            name: 'Accounts',
            tKey: 'accounts',
            href: '/dashboard/accounts',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )
        }
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-[#1B3022] text-white">
            <ConsentNotice />
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 border-r border-white/20 bg-black/20 backdrop-blur-xl">
                <div className="p-6 flex items-center space-x-3">
                    <img
                        src="/logo_notext.jpeg"
                        alt="MittiMitra Logo"
                        className="w-8 h-8 object-contain rounded-md"
                    />
                    <span className="text-xl font-bold tracking-tight text-white"><span className="text-mint">Mitti</span>Mitra</span>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-mint/10 text-mint border border-mint/20 shadow-[0_0_15px_rgba(32,255,189,0.1)]'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent'
                                    }`}
                            >
                                {item.icon}
                                <span className="font-medium">{t(item.tKey as any) || item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10 space-y-4">
                    {/* Global Desktop Language Switcher */}
                    <div className="flex">
                        <LanguageSwitcher />
                    </div>
                    <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-mint to-teal-500 flex items-center justify-center text-forest font-bold text-sm">
                            {profileName ? profileName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                            <p className="text-sm font-medium">{profileName || t('farmerLogin')}</p>
                            <p className="text-xs text-gray-400">{t('proFarmer')}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Bar (Optional, simpler implementation for now) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-t border-white/10 flex flex-col pb-safe">
                {/* Global Mobile Language Switcher (sits right above the nav icons) */}
                <div className="flex justify-center py-2 border-b border-white/5 bg-black/60">
                    <LanguageSwitcher />
                </div>
                <div className="flex justify-around p-3">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex flex-col items-center space-y-1 p-2 rounded-lg ${isActive ? 'text-mint' : 'text-gray-400'
                                    }`}
                            >
                                {item.icon}
                                <span className="text-[10px] font-medium">{t(item.tKey as any) || item.name}</span>
                            </Link>
                        )
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-y-auto overflow-x-hidden min-h-screen pb-20 md:pb-0">
                {/* Background light glare effect */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-mint/5 rounded-full blur-[120px] -mr-40 -mt-20 pointer-events-none"></div>
                {/* Render page content */}
                {children}
            </main>
        </div>
    );
}
