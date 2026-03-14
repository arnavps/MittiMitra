"use client";

import { useState, useEffect } from 'react';
import { auth } from '@/services/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/language-switcher';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Smartphone, 
  ShieldCheck, 
  Key, 
  Command, 
  ArrowRight,
  Loader2,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export default function LoginPage() {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [isFocused, setIsFocused] = useState(false);

    const router = useRouter();
    const { t } = useLanguage();

    useEffect(() => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
                callback: () => {},
                'expired-callback': () => {
                    setError('reCAPTCHA expired. Please try again.');
                }
            });
        }
    }, []);

    const DEMO_ACCOUNTS = ['9999999999', '9869530800', '7777777777', '8888888888'];

    const formatPhoneNumber = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 10);
        if (cleaned.length > 5) {
            return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
        }
        return cleaned;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value);
        setPhone(formatted.replace('-', ''));
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (phone.length < 10) {
            setError(t('invalidPhone'));
            setLoading(false);
            return;
        }

        if (DEMO_ACCOUNTS.includes(phone)) {
            setTimeout(() => {
                setStep('OTP');
                setLoading(false);
            }, 1000); // Simulate network
            return;
        }

        try {
            const formattedPhone = `+91${phone}`;
            const appVerifier = window.recaptchaVerifier;
            const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            setConfirmationResult(confirmation);
            setStep('OTP');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to send OTP.');
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.render().then((widgetId: any) => {
                    grecaptcha.reset(widgetId);
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (DEMO_ACCOUNTS.includes(phone)) {
                if (otp === '123456') {
                    localStorage.setItem('demo_phone', phone);
                    router.push('/onboarding');
                    return;
                } else {
                    throw new Error("Invalid Demo OTP");
                }
            }

            const result = await confirmationResult!.confirm(otp);
            if (result.user) {
                router.push('/onboarding');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || t('invalidOtp'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-forest overflow-hidden selection:bg-mint selection:text-forest">
            {/* --- LEFT SIDE: HERO (60%) --- */}
            <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
                <motion.div 
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 10, ease: "linear", repeat: Infinity, repeatType: "mirror" }}
                    className="absolute inset-0 z-0"
                >
                    <img 
                        src="/bg-img.jpg" 
                        alt="Hero" 
                        className="w-full h-full object-cover opacity-60 grayscale-[20%]"
                    />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-forest/40 to-forest z-10" />
                <div className="absolute inset-0 backdrop-blur-[2px] z-0" />

                <div className="relative z-20 w-full p-20 flex flex-col justify-between">
                    <div>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white/10 backdrop-blur-md rounded-2xl w-16 h-16 flex items-center justify-center mb-8 border border-white/20"
                        >
                            <Command className="w-8 h-8 text-mint" />
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-6xl font-black text-white tracking-tighter leading-[0.9] mb-6"
                        >
                            THE GLASS <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-mint to-teal-400">PORTAL</span>
                        </motion.h1>
                        <p className="text-gray-300 text-lg max-w-md font-medium leading-relaxed opacity-80">
                            Enter the high-fidelity decision engine where every harvest batch is verified on-chain.
                        </p>
                    </div>

                    {/* LIVE TICKERS */}
                    <div className="flex space-x-6">
                        <TickerBox 
                            icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
                            label="Mandi Volatility"
                            value="Low"
                            trend="Stable"
                        />
                        <TickerBox 
                            icon={<AlertTriangle className="w-4 h-4 text-yellow-400" />}
                            label="Spoilage Risk"
                            value="12%"
                            trend="(Nashik)"
                        />
                    </div>
                </div>
            </div>

            {/* --- RIGHT SIDE: LOGIN (40%) --- */}
            <div className="w-full lg:w-2/5 flex flex-col items-center justify-center p-8 md:p-16 relative bg-forest lg:bg-transparent">
                {/* Language Switcher Position */}
                <div className="absolute top-8 right-8 z-50">
                    <LanguageSwitcher direction="down" />
                </div>

                <div className="w-full max-w-sm space-y-12">
                    {/* Header */}
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-black text-white tracking-tight mb-2">
                            Secure Access
                        </h2>
                        <p className="text-gray-400 text-sm font-medium">
                            Authorized personnel only.
                        </p>
                    </div>

                    {/* Glass Login Card */}
                    <motion.div 
                        layout
                        className={`glass-panel rounded-3xl p-8 relative transition-all duration-500 overflow-hidden ${isFocused ? 'shadow-[0_0_50px_rgba(32,255,189,0.15)] border-mint/30' : ''}`}
                    >
                        {/* Focus Glow Overlay */}
                        <AnimatePresence>
                            {isFocused && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-gradient-to-br from-mint/5 to-transparent pointer-events-none"
                                />
                            )}
                        </AnimatePresence>

                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl text-red-400 text-xs font-bold"
                            >
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={step === 'PHONE' ? handleSendOtp : handleVerifyOtp} className="space-y-6 relative z-10">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
                                    {step === 'PHONE' ? t('phoneNumber') : t('enterOtp')}
                                </label>
                                
                                {step === 'PHONE' ? (
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center space-x-2 text-gray-500 border-r border-white/10 pr-3 mr-3">
                                            <span className="font-bold text-sm">+91</span>
                                        </div>
                                        <input
                                            type="tel"
                                            placeholder="XXXXX-XXXXX"
                                            onFocus={() => setIsFocused(true)}
                                            onBlur={() => setIsFocused(false)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-20 pr-4 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-mint/50 transition-all"
                                            value={phone.length > 5 ? `${phone.slice(0, 5)}-${phone.slice(5)}` : phone}
                                            onChange={handlePhoneChange}
                                        />
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        placeholder="······"
                                        onFocus={() => setIsFocused(true)}
                                        onBlur={() => setIsFocused(false)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white font-mono text-center tracking-[1em] text-xl placeholder-gray-600 focus:outline-none focus:border-mint/50 transition-all"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    />
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full h-14 relative rounded-2xl font-black uppercase tracking-widest text-xs transition-all overflow-hidden ${
                                    loading 
                                    ? 'bg-white/10 cursor-not-allowed text-gray-500' 
                                    : 'bg-mint text-forest hover:shadow-[0_0_30px_rgba(32,255,189,0.3)] transform hover:-translate-y-0.5'
                                }`}
                            >
                                <span className={loading ? 'opacity-0' : 'flex items-center justify-center space-x-2'}>
                                    <span>{step === 'PHONE' ? t('getOtp') : t('verifyLogin')}</span>
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </span>
                                
                                {loading && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="absolute inset-x-0 bottom-0 top-0 bg-mint/20 animate-progress origin-left w-full h-full" />
                                        <Loader2 className="w-5 h-5 animate-spin text-mint z-10" />
                                    </div>
                                )}
                            </button>
                        </form>

                        {/* Passkey Mockup */}
                        {step === 'PHONE' && (
                            <div className="mt-6 pt-6 border-t border-white/5">
                                <button className="w-full h-12 flex items-center justify-center space-x-3 text-gray-500 hover:text-white transition-colors text-xs font-bold">
                                    <Key className="w-4 h-4" />
                                    <span>Login with Passkey</span>
                                </button>
                            </div>
                        )}
                    </motion.div>

                    {/* Extra Links */}
                    <div className="flex flex-col space-y-4">
                        {step === 'OTP' && (
                            <button 
                                onClick={() => { setStep('PHONE'); setOtp(''); setError(''); }}
                                className="text-xs font-bold text-gray-500 hover:text-mint transition-colors inline-flex items-center"
                            >
                                <ArrowRight className="w-3 h-3 rotate-180 mr-2" />
                                Change Number
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer Monospace Meta */}
                <div className="mt-auto pt-10 flex flex-col items-center opacity-40">
                    <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="font-mono text-[10px] tracking-tight text-white uppercase whitespace-nowrap">
                            v1.2.0-stable | Edge: Mumbai-1
                        </span>
                    </div>
                </div>
            </div>

            <div id="recaptcha-container"></div>
        </div>
    );
}

function TickerBox({ icon, label, value, trend }: { icon: any, label: string, value: string, trend: string }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-4 rounded-2xl flex items-center space-x-4 min-w-[180px]"
        >
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                {icon}
            </div>
            <div>
                <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">{label}</p>
                <div className="flex items-center space-x-2">
                    <span className="text-white font-black text-sm">{value}</span>
                    <span className="text-[9px] text-gray-600 font-bold">{trend}</span>
                </div>
            </div>
        </motion.div>
    );
}
