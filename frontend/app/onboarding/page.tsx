"use client";

import { useState, useRef, useEffect } from 'react';
import { GlassCard } from '@/components/glass-card';
import { useGPS } from '@/hooks/useGPS';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { auth } from '@/services/firebase';
import { fuzzLocation } from '@/utils/physics';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Send, 
  RefreshCw, 
  Camera, 
  MapPin, 
  TrendingUp, 
  Terminal,
  ChevronRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

// Steps from onboarding.md
type Step = 
  | 'Language' 
  | 'Consent'           // Phase 1 - Step 1
  | 'CropIdentity'      // Phase 1 - Step 2
  | 'HarvestStatus'     // Phase 2 - Step 2.5
  | 'StorageAudit'      // Branch A - Step A3
  | 'HealthAudit'       // Branch A - Step A4 (Camera)
  | 'MaturityCheck'     // Branch B - Step B3
  | 'OracleVerdict'     // Branch B - Step B4
  | 'TransitConfig'     // Phase 3 - Step 6
  | 'DepartureAudit'    // Phase 3 - Step 7 (Camera)
  | 'FinalVerdict'      // Phase 3 - Step 8
  | 'Success';          // Phase 3 - Step 9

export default function OnboardingPage() {
    const router = useRouter();
    const { setLanguage, language: globalLanguage, t } = useLanguage();
    const { location, error: gpsError, requestLocation } = useGPS();

    // Onboarding State Machine
    const [currentStep, _setCurrentStep] = useState<Step>('Language');
    const currentStepRef = useRef<Step>('Language');
    const setCurrentStep = (step: Step) => {
        currentStepRef.current = step;
        _setCurrentStep(step);
    };

    // Data State
    const [langStr, setLangStr] = useState("English");
    const [consentGranted, setConsentGranted] = useState<boolean | null>(null);
    const [crop, setCrop] = useState("");
    const [yieldAmount, setYieldAmount] = useState("");
    const [harvestStatus, setHarvestStatus] = useState<'Already Harvested' | 'Not Yet Harvested' | null>(null);
    const [storageType, setStorageType] = useState("");
    const [healthStatus, setHealthStatus] = useState("");
    const [sowingDate, setSowingDate] = useState("");
    const [transportType, setTransportType] = useState("");
    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // AI/UI States
    const [messages, setMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [showLanguageModal, setShowLanguageModal] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    const recognitionRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const ledgerScrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isThinking]);

    // Auto-scroll ledger to active item
    useEffect(() => {
        const activeItem = document.querySelector('[data-ledger-status="active"]');
        if (activeItem && ledgerScrollRef.current) {
            activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentStep, harvestStatus, consentGranted, crop, yieldAmount]);

    // Audio Engine initialization
    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;
                
                recognitionRef.current.onresult = (event: any) => {
                    const text = event.results[event.results.length - 1][0].transcript;
                    setMessages(prev => [...prev, { role: 'user', text }]);
                    processAIExtraction(text);
                };

                recognitionRef.current.onend = () => setIsListening(false);
            }
        }
    }, []);

    const speakResponse = async (text: string, lang: string, onDone?: () => void) => {
        if (!text || !audioRef.current) return;
        const streamUrl = `/api/chat/tts?text=${encodeURIComponent(text)}&language=${encodeURIComponent(lang)}`;
        audioRef.current.src = streamUrl;
        audioRef.current.onended = onDone || null;
        try {
            await audioRef.current.play();
        } catch (e) {
            console.error("Audio playback error", e);
            if (onDone) onDone();
        }
    };

    const handleLanguageSelect = (code: string, name: string) => {
        setLanguage(code as any);
        setLangStr(name);
        setShowLanguageModal(false);
        setCurrentStep('Consent');
        
        const greeting = name === "Hindi" 
            ? "नमस्ते! मैं मिट्टीमित्र हूँ। आपके लिए सबसे अच्छे लाभ खिड़कियां खोजने के लिए, मुझे आपके जीपीएस और फसल डेटा का उपयोग करने की आवश्यकता है। क्या मुझे आगे बढ़ने के लिए डीपीपीए अधिनियम 2023 के तहत आपकी अनुमति है?"
            : "Namaste! I am MittiMitra. To find you the best profit windows, I need to use your GPS and crop data. Do I have your permission under the DPDP Act 2023 to proceed?";
        
        setMessages([{ role: 'ai', text: greeting }]);
        speakResponse(greeting, name, () => startListening());
    };

    const startListening = () => {
        if (recognitionRef.current) {
            const langMap: any = { "English": "en-IN", "Hindi": "hi-IN", "Marathi": "mr-IN" };
            recognitionRef.current.lang = langMap[langStr] || "en-IN";
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {}
        }
    };

    const processAIExtraction = async (text: string) => {
        setIsThinking(true);
        const res = await fetch('/api/chat/onboarding_extract', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                step: currentStepRef.current,
                text_input: text,
                language: langStr,
                current_name: "Farmer",
                current_crop: crop,
                consent_granted: consentGranted
            })
        });

        const data = await res.json();
        setIsThinking(false);
        setMessages(prev => [...prev, { role: 'ai', text: data.ai_reply }]);

        // Logic for state transitions based on onboarding.md
        if (currentStepRef.current === 'Consent') {
            if (data.consent_granted) {
                setConsentGranted(true);
                setCurrentStep('CropIdentity');
            }
        } else if (currentStepRef.current === 'CropIdentity') {
            if (data.crop) {
                setCrop(data.crop);
                setYieldAmount(data.yield_quintals || "");
                setCurrentStep('HarvestStatus');
            }
        } else if (currentStepRef.current === 'HarvestStatus') {
            if (data.harvest_status === 'already_harvested') {
                setHarvestStatus('Already Harvested');
                setCurrentStep('StorageAudit');
            } else if (data.harvest_status === 'not_yet_harvested') {
                setHarvestStatus('Not Yet Harvested');
                setCurrentStep('MaturityCheck');
            }
        } else if (currentStepRef.current === 'StorageAudit') {
            if (data.storage_type) {
                setStorageType(data.storage_type);
                setCurrentStep('HealthAudit');
            }
        } else if (currentStepRef.current === 'MaturityCheck') {
            if (data.sowing_date) {
                setSowingDate(data.sowing_date);
                setCurrentStep('OracleVerdict');
            }
        } else if (currentStepRef.current === 'TransitConfig') {
            if (data.transport_type) {
                setTransportType(data.transport_type);
                setCurrentStep('DepartureAudit');
            }
        } else if (currentStepRef.current === 'FinalVerdict') {
            setCurrentStep('Success');
        }

        speakResponse(data.ai_reply, langStr, () => {
            const nextStep = currentStepRef.current;
            if (nextStep !== 'HealthAudit' && nextStep !== 'DepartureAudit' && nextStep !== 'Success') {
                startListening();
            }
        });
    };

    const startCameraStep = async () => {
        setCameraActive(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (e) {
            console.error("Camera error", e);
        }
    };

    const capturePhoto = () => {
        // Mock capture for now
        setCameraActive(false);
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        }

        if (currentStepRef.current === 'HealthAudit') {
            setCurrentStep('TransitConfig');
            const nextMsg = "Quality verified. Now, will you transport these in a tractor, a pickup truck, or a covered van?";
            setMessages(prev => [...prev, { role: 'ai', text: nextMsg }]);
            speakResponse(nextMsg, langStr, () => startListening());
        } else if (currentStepRef.current === 'DepartureAudit') {
            setCurrentStep('FinalVerdict');
            const nextMsg = "Grade-A Quality Proof Locked. Based on live Mandi rates, Vashi market is your best bet today. Ready to start navigation?";
            setMessages(prev => [...prev, { role: 'ai', text: nextMsg }]);
            speakResponse(nextMsg, langStr, () => startListening());
        }
    };

    return (
        <div className="flex min-h-screen bg-forest text-white selection:bg-mint overflow-hidden relative">
            {/* Professional Background with Depth */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <img src="/bg-img.jpg" alt="Farm" className="w-full h-full object-cover opacity-[0.07] scale-105 blur-sm" />
                <div className="absolute inset-0 bg-gradient-to-tr from-forest via-forest/80 to-forest/40" />
                
                {/* Animated Depth Blobs */}
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        x: [0, 100, 0],
                        y: [0, -50, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-mint/5 rounded-full blur-[120px]" 
                />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.3, 1],
                        x: [0, -120, 0],
                        y: [0, 80, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-mint/5 rounded-full blur-[120px]" 
                />
            </div>

            <audio ref={audioRef} className="hidden" />

            {/* Language Modal */}
            <AnimatePresence>
                {showLanguageModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
                    >
                        <GlassCard className="max-w-md w-full p-8 text-center shadow-[0_0_100px_rgba(32,255,189,0.1)]">
                            <Zap className="w-12 h-12 text-mint mx-auto mb-6 animate-pulse" />
                            <h2 className="text-2xl font-black mb-2 tracking-tight">Select Language</h2>
                            <div className="grid grid-cols-2 gap-4 mt-8">
                                {['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Gujarati', 'Punjabi'].map(l => (
                                    <button 
                                        key={l}
                                        onClick={() => handleLanguageSelect(l, l)}
                                        className="p-4 rounded-2xl bg-white/5 border border-white/10 font-bold hover:bg-mint/20 hover:border-mint transition-all"
                                    >
                                        {l}
                                    </button>
                                ))}
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content: Card-Based Layout */}
            {!showLanguageModal && (
                <div className="relative z-10 w-full flex items-center justify-center p-6 lg:p-12">
                    <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 h-[85vh]">
                        
                        {/* LEFT CARD: Extraction Ledger (35%) */}
                        <motion.div 
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-4 h-full"
                        >
                            <GlassCard className="h-full flex flex-col p-8 border-mint/10 overflow-hidden relative group">
                                <div className="mb-8">
                                    <div className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-[0.3em] text-mint/60 mb-4">
                                        <Terminal className="w-4 h-4" />
                                        <span>Extraction Ledger</span>
                                    </div>
                                    <h2 className="text-3xl font-black tracking-tighter leading-none uppercase">
                                        Data <span className="text-mint">Calibration</span>
                                    </h2>
                                </div>

                                <div 
                                    ref={ledgerScrollRef}
                                    className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar"
                                >
                                    <LedgerItem 
                                        label="DPDP Consent" 
                                        value={consentGranted ? "Granted ✅" : "Pending..."} 
                                        status={consentGranted ? 'locked' : (currentStepRef.current === 'Consent' ? 'active' : 'pending')}
                                        icon={<ShieldCheck className="w-4 h-4" />}
                                    />
                                    <LedgerItem 
                                        label="Crop Identity" 
                                        value={crop || "Waiting..."} 
                                        status={crop ? 'locked' : (currentStepRef.current === 'CropIdentity' ? 'active' : 'pending')}
                                        icon={<RefreshCw className="w-4 h-4" />}
                                    />
                                    <LedgerItem 
                                        label="Yield Volume" 
                                        value={yieldAmount ? `${yieldAmount} Quintals` : "---"} 
                                        status={yieldAmount ? 'locked' : (currentStepRef.current === 'CropIdentity' ? 'active' : 'pending')}
                                        icon={<Zap className="w-4 h-4" />}
                                    />
                                    <LedgerItem 
                                        label="Harvest Node" 
                                        value={harvestStatus || "Detecting..."} 
                                        status={harvestStatus ? 'locked' : (currentStepRef.current === 'HarvestStatus' ? 'active' : 'pending')}
                                        icon={<TrendingUp className="w-4 h-4" />}
                                    />

                                    <AnimatePresence>
                                        {(harvestStatus === 'Already Harvested' || !harvestStatus) && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="space-y-4 pt-4 border-t border-white/5"
                                            >
                                                <LedgerItem 
                                                    label="Storage" 
                                                    value={storageType || "Pending..."} 
                                                    status={storageType ? 'locked' : (currentStepRef.current === 'StorageAudit' ? 'active' : 'pending')}
                                                    icon={<MapPin className="w-4 h-4" />}
                                                />
                                                <LedgerItem 
                                                    label="Transit" 
                                                    value={transportType || "---"} 
                                                    status={transportType ? 'locked' : (currentStepRef.current === 'TransitConfig' ? 'active' : 'pending')}
                                                    icon={<CheckCircle2 className="w-4 h-4" />}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <AnimatePresence>
                                        {harvestStatus === 'Not Yet Harvested' && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="space-y-4 pt-4 border-t border-white/5"
                                            >
                                                <LedgerItem 
                                                    label="Sowing Date" 
                                                    value={sowingDate || "---"} 
                                                    status={sowingDate ? 'locked' : (currentStepRef.current === 'MaturityCheck' ? 'active' : 'pending')}
                                                    icon={<Zap className="w-4 h-4" />}
                                                />
                                                <LedgerItem 
                                                    label="Oracle" 
                                                    value="Syncing..." 
                                                    status={currentStepRef.current === 'OracleVerdict' ? 'active' : 'pending'}
                                                    icon={<TrendingUp className="w-4 h-4" />}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="mt-6 pt-6 border-t border-white/5 opacity-40">
                                    <div className="font-mono text-[8px] tracking-widest text-mint text-center">
                                        VERIFIER: MITTI-MITRA AGRI-NODE 01
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>

                        {/* RIGHT CARD: Agri-Vakeel Terminal (65%) */}
                        <motion.div 
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-8 h-full"
                        >
                            <GlassCard className="h-full flex flex-col border-mint/10 overflow-hidden relative shadow-[0_0_100px_rgba(32,255,189,0.1)] bg-forest/20">
                                {/* Chat Header */}
                                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded-2xl bg-mint/20 flex items-center justify-center border border-mint/20">
                                            <Zap className="w-5 h-5 text-mint" />
                                        </div>
                                        <div>
                                            <div className="font-black text-sm uppercase tracking-tight">Agri-Vakeel AI</div>
                                            <div className="text-[10px] text-mint flex items-center">
                                                <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse mr-2" />
                                                Live Sync Active
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar pb-32">
                                    <AnimatePresence initial={false}>
                                        {messages.map((msg, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}
                                            >
                                                <div className={`max-w-[85%] p-5 rounded-3xl ${
                                                    msg.role === 'ai' 
                                                        ? 'bg-white/5 border border-white/10 text-mint italic text-lg leading-relaxed rounded-bl-none shadow-xl' 
                                                        : 'bg-mint text-forest font-bold text-base rounded-br-none shadow-lg'
                                                }`}>
                                                    {msg.role === 'ai' ? `"${msg.text}"` : msg.text}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {isThinking && (
                                        <div className="flex space-x-2 p-4 justify-start">
                                            <div className="w-2 h-2 bg-mint/50 rounded-full animate-bounce" />
                                            <div className="w-2 h-2 bg-mint/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <div className="w-2 h-2 bg-mint/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    )}
                                </div>

                                {/* Input Controls */}
                                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-forest via-forest/90 to-transparent">
                                    <div className="max-w-2xl mx-auto flex items-center space-x-4">
                                        {(currentStepRef.current === 'HealthAudit' || currentStepRef.current === 'DepartureAudit') && !cameraActive ? (
                                            <button 
                                                onClick={startCameraStep}
                                                className="flex-1 h-16 bg-mint text-forest rounded-2xl flex items-center justify-center space-x-3 font-black uppercase tracking-[0.1em] shadow-[0_0_30px_rgba(32,255,189,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                                            >
                                                <Camera className="w-5 h-5" />
                                                <span>Start Visual Audit</span>
                                            </button>
                                        ) : (
                                            <>
                                                <button 
                                                    onClick={isListening ? () => recognitionRef.current?.stop() : startListening}
                                                    className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-2xl ${
                                                        isListening 
                                                        ? 'bg-red-500 scale-110 shadow-[0_0_40px_rgba(239,68,68,0.4)]' 
                                                        : 'bg-mint text-forest hover:scale-105 active:scale-95'
                                                    }`}
                                                >
                                                    {isListening ? <MicOff className="w-7 h-7 animate-pulse" /> : <Mic className="w-7 h-7" />}
                                                </button>
                                                <form 
                                                    onSubmit={(e) => {
                                                        e.preventDefault();
                                                        const input = e.currentTarget.elements.namedItem('text-input') as HTMLInputElement;
                                                        if (input.value) {
                                                            setMessages(prev => [...prev, { role: 'user', text: input.value }]);
                                                            processAIExtraction(input.value);
                                                            input.value = "";
                                                        }
                                                    }}
                                                    className="flex-1 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center px-6 focus-within:border-mint/50 transition-all shadow-xl backdrop-blur-3xl group"
                                                >
                                                    <input 
                                                        name="text-input"
                                                        type="text"
                                                        autoComplete="off"
                                                        placeholder={isListening ? "System listening..." : "Type your message..."}
                                                        className="bg-transparent border-none outline-none text-white text-md w-full placeholder:text-gray-500"
                                                    />
                                                    <button type="submit" className="text-mint ml-4 hover:scale-110 transition-transform">
                                                        <Send className="w-6 h-6" />
                                                    </button>
                                                </form>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </div>

                    {/* Camera Overlay */}
                    <AnimatePresence>
                        {cameraActive && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[200] bg-black flex flex-col p-6 pt-20"
                            >
                                <div className="flex-1 relative rounded-3xl overflow-hidden border-2 border-mint/20">
                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-mint/50 shadow-[0_0_15px_rgba(32,255,189,0.5)]" style={{ animation: 'scan 2s linear infinite' }} />
                                    </div>
                                </div>
                                <button 
                                    onClick={capturePhoto}
                                    className="mt-8 w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center border-8 border-mint/20 active:scale-90 transition-all shadow-2xl"
                                >
                                    <Camera className="w-10 h-10 text-forest" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Success Overlay */}
            <AnimatePresence>
                {currentStepRef.current === 'Success' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[400] bg-forest flex flex-col items-center justify-center p-8 backdrop-blur-[100px]"
                    >
                         <motion.div 
                            initial={{ scale: 0.9, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            className="text-center max-w-md w-full"
                         >
                            <div className="w-28 h-28 bg-mint rounded-[2.5rem] mx-auto mb-12 flex items-center justify-center shadow-[0_0_100px_rgba(32,255,189,0.5)]">
                                <CheckCircle2 className="w-14 h-14 text-forest" />
                            </div>
                            <h2 className="text-5xl font-black mb-6 tracking-tighter uppercase leading-none">
                                Calibration <br />
                                <span className="text-mint">Locked</span>
                            </h2>
                            <p className="text-gray-400 mb-12 text-lg font-medium leading-relaxed">System sync complete. Your profit arbitrage windows for {crop || 'your crop'} are now active.</p>
                            
                            <div className="grid grid-cols-2 gap-4 mb-14">
                                <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] text-left">
                                    <ShieldCheck className="w-5 h-5 text-mint mb-4" />
                                    <div className="text-[10px] font-black uppercase tracking-widest text-mint/60 mb-1">Status</div>
                                    <div className="font-bold text-sm">A+ VERIFIED</div>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] text-left">
                                    <TrendingUp className="w-5 h-5 text-mint mb-4" />
                                    <div className="text-[10px] font-black uppercase tracking-widest text-mint/60 mb-1">Target</div>
                                    <div className="font-bold text-sm uppercase">Vashi Market</div>
                                </div>
                            </div>

                            <button 
                                onClick={() => router.push('/dashboard')}
                                className="w-full h-20 bg-mint text-forest rounded-[2rem] flex items-center justify-center space-x-4 font-black uppercase tracking-[0.2em] shadow-[0_0_60px_rgba(32,255,189,0.4)] hover:scale-[1.03] active:scale-95 transition-all text-sm"
                             >
                                <Zap className="w-5 h-5" />
                                <span>Enter Dashboard</span>
                                <ChevronRight className="w-6 h-6" />
                            </button>
                         </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function LedgerItem({ label, value, status, icon }: { label: string, value: string, status: 'pending' | 'active' | 'locked', icon: any }) {
    return (
        <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            data-ledger-status={status}
            className={`group relative p-5 rounded-3xl border transition-all duration-500 cursor-default ${
                status === 'locked' 
                    ? 'bg-mint/5 border-mint/20' 
                    : (status === 'active' ? 'bg-white/10 border-mint shadow-[0_0_40px_rgba(32,255,189,0.1)]' : 'bg-white/5 border-white/5 opacity-40')
            } hover:scale-[1.02] active:scale-[0.98]`}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-2xl transition-all duration-500 ${
                        status === 'locked' 
                            ? 'bg-mint text-forest rotate-6' 
                            : (status === 'active' ? 'bg-mint/20 text-mint animate-pulse' : 'bg-white/5 text-gray-500')
                    }`}>
                        {icon}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${status === 'active' ? 'text-mint' : 'text-gray-500'}`}>
                        {label}
                    </span>
                </div>
                <AnimatePresence>
                    {status === 'locked' && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <CheckCircle2 className="w-4 h-4 text-mint" />
                        </motion.div>
                    )}
                </AnimatePresence>
                {status === 'active' && <div className="w-2 h-2 rounded-full bg-mint animate-ping" />}
            </div>
            <div className={`text-sm font-bold truncate pl-12 transition-colors duration-500 ${status === 'locked' ? 'text-white' : 'text-gray-300'}`}>
                {value}
            </div>

            {/* Premium Active Overlay */}
            {status === 'active' && (
                <motion.div 
                    layoutId="ledger-glow"
                    className="absolute inset-0 border-2 border-mint rounded-3xl pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
            )}
        </motion.div>
    );
}
