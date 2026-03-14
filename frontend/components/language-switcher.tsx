"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useRef, useEffect } from "react";

export function LanguageSwitcher({ direction = "up", textColor = "text-gray-200", iconColor = "text-mint" }: { direction?: "up" | "down", textColor?: string, iconColor?: string }) {
    const { language, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const languages = [
        { code: "en", label: "English" },
        { code: "hi", label: "हिंदी" },
        { code: "mr", label: "मराठी" },
        { code: "te", label: "తెలుగు" },
        { code: "ta", label: "தமிழ்" },
        { code: "gu", label: "ગુજરાતી" },
        { code: "pa", label: "ਪੰਜਾਬੀ" },
    ];

    const currentLabel = languages.find(l => l.code === language)?.label || "English";

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative pointer-events-auto z-50" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/5 border border-glass-border hover:bg-white/10 transition-colors text-sm font-medium ${textColor}`}
            >
                <svg className={`w-4 h-4 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span>{currentLabel}</span>
            </button>

            {isOpen && (
                <div className={`absolute left-1/2 -translate-x-1/2 ${direction === "up" ? "bottom-full mb-2" : "top-full mt-2"} w-32 bg-forest border border-glass-border rounded-xl shadow-lg shadow-black/50 overflow-hidden z-[100]`}>
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => {
                                setLanguage(lang.code as "en" | "hi" | "mr" | "te" | "ta" | "gu" | "pa");
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-white/10 ${language === lang.code ? "text-mint font-bold bg-white/5" : "text-gray-300"
                                }`}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
