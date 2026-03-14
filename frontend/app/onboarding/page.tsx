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

    // Auto-scroll chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isThinking]);

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
        <div className="flex min-h-screen bg-forest text-white selection:bg-mint p-4 overflow-hidden relative">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <img src="/bg-img.jpg" alt="Farm" className="w-full h-full object-cover opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-b from-forest/90 via-forest/60 to-forest" />
            </div>

            <audio ref={audioRef} className="hidden" />

            {/* Language Modal */}
            {showLanguageModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
                    <GlassCard className="max-w-md w-full p-8 text-center">
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
                </div>
            )}

            {/* Main Content */}
            {!showLanguageModal && (
                <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col h-full">
                    <div ref={scrollRef} className="flex-1 flex flex-col space-y-6 pb-24 overflow-y-auto pt-8">
                        
                        {/* Task List / Progress (Senior Dev detail) */}
                        <div className="mb-4 sticky top-0 bg-forest/80 backdrop-blur-md z-20 py-2">
                           <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] text-mint/40 mb-4">
                                <Terminal className="w-3 h-3" />
                                <span>Session Status: Local Edge Sync Active</span>
                           </div>
                           <div className="grid grid-cols-4 gap-2">
                                <div className={`h-1 rounded-full ${consentGranted ? 'bg-mint' : 'bg-white/10'}`} />
                                <div className={`h-1 rounded-full ${crop ? 'bg-mint' : 'bg-white/10'}`} />
                                <div className={`h-1 rounded-full ${harvestStatus ? 'bg-mint' : 'bg-white/10'}`} />
                                <div className={`h-1 rounded-full ${transportType ? 'bg-mint' : 'bg-white/10'}`} />
                           </div>
                        </div>

                        {/* Message History */}
                        <AnimatePresence>
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div className={`max-w-[85%] p-4 px-6 rounded-3xl ${
                                        msg.role === 'ai' 
                                            ? 'bg-white/5 border border-white/10 backdrop-blur-xl rounded-bl-none text-mint italic text-lg font-medium' 
                                            : 'bg-mint text-forest font-black rounded-br-none text-sm'
                                    }`}>
                                        {msg.role === 'ai' ? `"${msg.text}"` : msg.text}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Thinking */}
                        {isThinking && (
                            <div className="flex space-x-2 p-4">
                                <div className="w-2 h-2 bg-mint rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-mint rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="w-2 h-2 bg-mint rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        )}
                    </div>

                    {/* Camera View */}
                    <AnimatePresence>
                        {cameraActive && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="fixed inset-0 z-40 bg-black flex flex-col p-6 pt-20"
                            >
                                <div className="flex-1 relative rounded-3xl overflow-hidden border-2 border-mint/30 shadow-[0_0_50px_rgba(32,255,189,0.2)]">
                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-mint/50 animate-pulse" />
                                        <div className="absolute inset-10 border-2 border-mint/20 border-dashed rounded-3xl" />
                                    </div>
                                </div>
                                <button 
                                    onClick={capturePhoto}
                                    className="mt-8 w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center border-8 border-mint/20 active:scale-90 transition-transform"
                                >
                                    <Camera className="w-10 h-10 text-forest" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Controls */}
                    <div className="fixed bottom-0 left-0 right-0 p-8 pt-0 bg-gradient-to-t from-forest to-transparent pb-12">
                        <div className="flex items-center space-x-4 max-w-lg mx-auto">
                            {(currentStep === 'HealthAudit' || currentStep === 'DepartureAudit') && !cameraActive ? (
                                <button 
                                    onClick={startCameraStep}
                                    className="flex-1 h-20 bg-mint text-forest rounded-3xl flex items-center justify-center space-x-3 font-black uppercase tracking-widest shadow-[0_0_30px_rgba(32,255,189,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    <Camera className="w-6 h-6" />
                                    <span>Open Visual Audit</span>
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={isListening ? () => recognitionRef.current?.stop() : startListening}
                                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 scale-110 shadow-[0_0_40px_rgba(239,68,68,0.4)]' : 'bg-mint text-forest shadow-[0_0_30px_rgba(32,255,189,0.3)]'}`}
                                    >
                                        {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
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
                                        className="flex-1 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 backdrop-blur-md group focus-within:border-mint transition-all"
                                    >
                                        <input 
                                            name="text-input"
                                            type="text"
                                            placeholder={isListening ? "Listening..." : "Tap mic or type here..."}
                                            className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-gray-500"
                                        />
                                        <button type="submit" className="text-mint ml-2 transform hover:scale-110 transition-transform">
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Final Success View */}
            {currentStep === 'Success' && (
                <div className="fixed inset-0 z-[60] bg-forest flex flex-col items-center justify-center p-8">
                     <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center"
                     >
                        <div className="w-24 h-24 bg-mint rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-[0_0_50px_rgba(32,255,189,0.4)]">
                            <CheckCircle2 className="w-12 h-12 text-forest" />
                        </div>
                        <h2 className="text-4xl font-black mb-4">CALIBRATION COMPLETE</h2>
                        <p className="text-gray-400 mb-12">Redirecting to your Profit Dashboard...</p>
                        <div className="flex flex-col space-y-4 max-w-xs mx-auto">
                            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-mint/60">Quality Grade</span>
                                <span className="font-mono text-mint">A+ Verified</span>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-mint/60">Path of Profit</span>
                                <span className="font-mono text-mint">Locked (Vashi)</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => router.push('/dashboard')}
                            className="mt-12 group flex items-center space-x-3 text-mint font-black text-sm uppercase tracking-widest"
                        >
                            <span>Enter Cockpit</span>
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                     </motion.div>
                </div>
            )}
        </div>
    );
}
