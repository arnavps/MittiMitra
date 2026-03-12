"use client";

import { useState, useRef, useEffect } from 'react';
import { GlassCard } from '@/components/glass-card';
import { useGPS } from '@/hooks/useGPS';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { auth } from '@/services/firebase';
import { fuzzLocation } from '@/utils/physics';
import { useLanguage } from '@/contexts/LanguageContext';

export default function OnboardingPage() {
    const router = useRouter();
    const { setLanguage, language: globalLanguage, t, n } = useLanguage();
    const { location, error: gpsError, requestLocation } = useGPS();

    // Onboarding State Machine
    type Step = 'Language' | 'Consent' | 'CropDetails' | 'Location' | 'StorageTransport' | 'FinalCalibration' | 'Verdict';
    const [currentStep, _setCurrentStep] = useState<Step>('Language');
    const currentStepRef = useRef<Step>('Language');

    const setCurrentStep = (step: Step) => {
        currentStepRef.current = step;
        _setCurrentStep(step);
    };

    // Extracted Variables
    const [langStr, _setLangStr] = useState("English");
    const langStrRef = useRef("English");
    const setLangStr = (s: string) => {
        langStrRef.current = s;
        _setLangStr(s);
    };

    const [consentGranted, _setConsentGranted] = useState<boolean | null>(null);
    const consentGrantedRef = useRef<boolean | null>(null);
    const setConsentGranted = (b: boolean | null) => {
        consentGrantedRef.current = b;
        _setConsentGranted(b);
    };

    const [name, _setName] = useState("");
    const nameRef = useRef("");
    const setName = (val: string) => {
        nameRef.current = val;
        _setName(val);
    };

    const [crop, _setCrop] = useState("");
    const cropRef = useRef("");
    const setCrop = (val: string) => {
        cropRef.current = val;
        _setCrop(val);
    };

    const [landSize, _setLandSize] = useState<number | null>(null);
    const landSizeRef = useRef<number | null>(null);
    const setLandSize = (val: number | null) => {
        landSizeRef.current = val;
        _setLandSize(val);
    };

    const [yieldQuintals, _setYieldQuintals] = useState<number | null>(null);
    const yieldQuintalsRef = useRef<number | null>(null);
    const setYieldQuintals = (val: number | null) => {
        yieldQuintalsRef.current = val;
        _setYieldQuintals(val);
    };

    const [plantingDate, _setPlantingDate] = useState("");
    const plantingDateRef = useRef("");
    const setPlantingDate = (val: string) => {
        plantingDateRef.current = val;
        _setPlantingDate(val);
    };

    const [storageType, _setStorageType] = useState("");
    const storageTypeRef = useRef("");
    const setStorageType = (val: string) => {
        storageTypeRef.current = val;
        _setStorageType(val);
    };

    const [transportType, _setTransportType] = useState("");
    const transportTypeRef = useRef("");
    const setTransportType = (val: string) => {
        transportTypeRef.current = val;
        _setTransportType(val);
    };

    // Conversational UI States
    const [isListening, setIsListening] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [aiReply, setAiReply] = useState("");
    const [showLanguageModal, setShowLanguageModal] = useState(true);

    // Rehydrate from cache on mount
    useEffect(() => {
        const cached = localStorage.getItem('krishi_onboarding_cache');
        if (cached) {
            try {
                const data = JSON.parse(cached);
                if (data.currentStep && data.currentStep !== 'Verdict') {
                    setCurrentStep(data.currentStep);
                    setLangStr(data.langStr || "English");
                    setConsentGranted(data.consentGranted ?? null);
                    setName(data.name || "");
                    setCrop(data.crop || "");
                    setLandSize(data.landSize ?? null);
                    setYieldQuintals(data.yieldQuintals ?? null);
                    setPlantingDate(data.plantingDate || "");
                    setStorageType(data.storageType || "");
                    setTransportType(data.transportType || "");
                    setShowLanguageModal(data.showLanguageModal ?? true);
                }
            } catch (e) {
                console.error("Cache parsing error", e);
            }
        }
    }, []);

    // Save to cache on change
    useEffect(() => {
        if (currentStep !== 'Verdict') {
            localStorage.setItem('krishi_onboarding_cache', JSON.stringify({
                currentStep, langStr, consentGranted, name, crop, landSize, yieldQuintals, plantingDate, storageType, transportType, showLanguageModal
            }));
        } else {
            localStorage.removeItem('krishi_onboarding_cache');
        }
    }, [currentStep, langStr, consentGranted, name, crop, landSize, yieldQuintals, plantingDate, storageType, transportType, showLanguageModal]);

    // Audio & STT Refs
    const recognitionRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Clean up audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.removeAttribute('src');
            }
        };
    }, []);

    const speakResponse = async (text: string, langName: string, onDone?: () => void) => {
        if (!text) return;
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            const streamUrl = `/api/chat/tts?text=${encodeURIComponent(text)}&language=${encodeURIComponent(langName)}`;
            audioRef.current.src = streamUrl;

            audioRef.current.onended = () => {
                if (onDone) onDone();
            };

            try {
                await audioRef.current.play();
            } catch (err) {
                console.error("Error playing TTS", err);
                // If autoplay fails, we still want to resume listening eventually
                if (onDone) setTimeout(onDone, 2000);
            }
        }
    };

    const handleLanguageSelect = (langCode: any, langName: string) => {
        setLanguage(langCode);
        setLangStr(langName);
        setShowLanguageModal(false);
        setCurrentStep('Consent');

        let greeting = "Welcome to MittiMitra. I am Agri-Vakeel. To begin, do I have your permission to process your location and farm data for hyper-local profit mapping?";
        if (langName === "Hindi") greeting = "मिट्टीमित्र में आपका स्वागत है। मैं कृषि-वकील हूँ। शुरू करने के लिए, क्या मुझे आपके स्थान और खेत के डेटा का उपयोग करने की अनुमति है?";
        if (langName === "Marathi") greeting = "मिट्टीमित्र मध्ये आपले स्वागत आहे. मी कृषी-वकील आहे. सुरू करण्यासाठी, मला तुमचा स्थान आणि शेताचा डेटा वापरण्याची परवानगी आहे का?";
        if (langName === "Telugu") greeting = "మిట్టిమిత్రకు స్వాగతం. నేను అగ్రి-వకీల్. మీ పరిసర వాతావరణ మరియు మార్కెట్ సమాచారం కోసం మీ లొకేషన్ వివరాలు సేకరించడానికి అనుమతి ఇస్తున్నారా?";
        if (langName === "Tamil") greeting = "மிட்டிமித்ராவிற்கு வரவேற்கிறோம். நான் உங்கள் அக்ரி-வக்கீல். ஆரம்பிக்க, உங்கள் லாபத்தை கணிக்க உங்கள் இடம் மற்றும் பண்ணை தரவை பயன்படுத்த எனக்கு அனுமதி உள்ளதா?";
        if (langName === "Gujarati") greeting = "મિટ્ટીમિત્રમાં તમારું સ્વાગત છે. હું કૃષિ-વકીલ છું. શું મને તમારી સ્થાન અને ફાર્મ ડેટા પર પ્રક્રિયા કરવાની પરવાનગી છે?";
        if (langName === "Punjabi") greeting = "ਮਿੱਟੀਮਿੱਤਰ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ। ਮੈਂ ਐਗਰੀ-ਵਕੀਲ ਹਾਂ। ਕੀ ਮੈਨੂੰ ਤੁਹਾਡੀ ਮਨਜ਼ੂਰੀ ਹੈ?";

        setAiReply(greeting);
        initRecognition(langName);
        // Automatically start listening after greeting
        speakResponse(greeting, langName, () => {
            startRecognitionInternal();
        });
    };

    const startRecognitionInternal = () => {
        try {
            recognitionRef.current?.start();
            setIsListening(true);
        } catch (e: any) {
            if (e.name !== 'InvalidStateError') {
                console.error("Recognition start failed", e);
            } else {
                setIsListening(true);
            }
        }
    };

    const initRecognition = (langName: string) => {
        if (typeof window === "undefined") return;
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        const langMap: Record<string, string> = {
            "English": "en-IN", "Hindi": "hi-IN", "Marathi": "mr-IN",
            "Telugu": "te-IN", "Tamil": "ta-IN", "Gujarati": "gu-IN", "Punjabi": "pa-IN"
        };
        recognition.lang = langMap[langName] || "en-US";

        recognition.onresult = (event: any) => {
            const text = event.results[0][0].transcript;
            setTranscript(text);
            processAIExtraction(text);
        };

        recognition.onerror = (event: any) => {
            if (event.error !== 'no-speech') {
                console.error("STT Error", event.error);
            }
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
    };

    const toggleListen = async () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            setTranscript("");
            try {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    stream.getTracks().forEach(track => track.stop());
                }
                startRecognitionInternal();
            } catch (err) {
                console.error("Microphone denied", err);
            }
        }
    };

    const processAIExtraction = async (text: string) => {
        setIsThinking(true);
        const activeStep = currentStepRef.current;
        const activeLang = langStrRef.current;

        console.log(`[Onboarding] Analyzing: "${text}" | Step: ${activeStep} | RefLang: ${activeLang}`);

        // LOCAL HEURISTIC: Force consent if common affirmative words are detected
        if (activeStep === 'Consent') {
            const affirmations = ['हो', 'आहे', 'जी', 'हाँ', 'अनुमति', 'yes', 'agree', 'correct', 'okay', 'ok'];
            const lowerText = text.toLowerCase();
            if (affirmations.some(word => lowerText.includes(word))) {
                console.log("[Onboarding] Local Heuristic triggered: Consent Granted.");
                setConsentGranted(true);
                const confirmMsg = activeLang === "Marathi" ? "धन्यवाद. आता तुमच्या पिकाचे नाव सांगा." : activeLang === "Hindi" ? "धन्यवाद। अब अपनी फसल का नाम बताएं।" : "Thank you. Now, please tell me your crop name.";
                setAiReply(confirmMsg);
                speakResponse(confirmMsg, activeLang, () => {
                    setCurrentStep('CropDetails');
                    startRecognitionInternal();
                });
                setIsThinking(false);
                return;
            }
        }

        try {
            const res = await fetch('/api/chat/onboarding_extract', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    step: activeStep,
                    text_input: text,
                    language: activeLang,
                    current_name: nameRef.current || name,
                    current_crop: cropRef.current || crop,
                    current_land_size: landSizeRef.current || landSize || 0,
                    consent_granted: (typeof consentGranted === 'boolean') ? consentGranted : consentGrantedRef.current,
                    location_available: !!location,
                    gps_error: gpsError,
                    current_storage: storageTypeRef.current || storageType,
                    current_transport: transportTypeRef.current || transportType
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detail || "API Extraction failed");
            }

            const data = await res.json();
            console.log(`[Onboarding] AI Data Received:`, data);

            // Stateful Auto-Transitions
            const isConsentTrue = data.consent_granted === true || String(data.consent_granted).toLowerCase() === 'true';

            // Function to handle step transition AFTER speech
            const finishTurn = (nextStep?: Step) => {
                if (nextStep) {
                    setTimeout(() => setCurrentStep(nextStep), 500);
                } else if (currentStepRef.current !== 'Verdict') {
                    startRecognitionInternal();
                }
                setIsThinking(false);
            };

            if (data.ai_reply) {
                setAiReply(data.ai_reply);

                // Prepare context for post-speech transition
                let targetStep: Step | undefined = undefined;
                if (activeStep === 'Consent' && isConsentTrue) {
                    setConsentGranted(true);
                    targetStep = 'CropDetails';
                } else if (activeStep === 'CropDetails') {
                    if (data.name) setName(data.name);
                    if (data.crop) setCrop(data.crop);
                    if (data.land_size) setLandSize(parseFloat(String(data.land_size)));

                    if ((data.crop || cropRef.current) && (data.land_size || landSizeRef.current)) {
                        targetStep = 'Location';
                    }
                } else if (activeStep === 'StorageTransport') {
                    if (data.storage_type) setStorageType(data.storage_type);
                    if (data.transport_type) setTransportType(data.transport_type);

                    if ((data.storage_type || storageTypeRef.current) && (data.transport_type || transportTypeRef.current)) {
                        targetStep = 'FinalCalibration';
                    }
                } else if (activeStep === 'FinalCalibration') {
                    if (data.yield_quintals) setYieldQuintals(parseFloat(String(data.yield_quintals)));
                    if (data.planting_date) setPlantingDate(data.planting_date);

                    if (data.yield_quintals || yieldQuintalsRef.current) {
                        targetStep = 'Verdict';
                    }
                }

                speakResponse(data.ai_reply, activeLang, () => finishTurn(targetStep));
            } else {
                // If no ai_reply, transition immediately if criteria met
                let targetStep: Step | undefined = undefined;
                if (activeStep === 'Consent' && isConsentTrue) {
                    setConsentGranted(true);
                    targetStep = 'CropDetails';
                } else if (activeStep === 'CropDetails' && cropRef.current && landSizeRef.current) {
                    targetStep = 'Location';
                }
                finishTurn(targetStep);
            }

        } catch (error) {
            console.error("Extraction error", error);
            setAiReply("I'm sorry, I'm having trouble connecting to the decision engine. Let's try again.");
            setIsThinking(false);
        }
    };

    // GPS Transition Logic
    useEffect(() => {
        if (currentStep === 'Location') {
            const handleGpsTransition = async () => {
                if (!location) {
                    const promptText = langStr === "Marathi" ? "तुमची लोकेशन शोधत आहे. कृपया परवानगी द्या." : langStr === "Hindi" ? "हम आपकी लोकेशन खोज रहे हैं। कृपया अनुमति दें।" : "I'm locking your coordinates. Please allow GPS access.";
                    setAiReply(promptText);
                    speakResponse(promptText, langStr, () => {
                        requestLocation();
                    });
                } else {
                    const successMsg = langStr === "Marathi" ? "लोकेशन मिळाली आहे. आता सांगा, पीक कसे साठवत आहात? उघड्यावर, छायेत की क्रेट्समध्ये?" : langStr === "Hindi" ? "लोकेशन मिल गई है। अब बताएं, उपज को कैसे स्टोर करेंगे? खुले में, छाया में, या क्रेट में?" : "Coordinates secured. Next, how will you store your yield today (Open Field, Shaded, or Crated)?";
                    setAiReply(successMsg);
                    speakResponse(successMsg, langStr, () => {
                        setCurrentStep('StorageTransport');
                        startRecognitionInternal();
                    });
                }
            };
            const timer = setTimeout(handleGpsTransition, 1000); // 1s delay to protect audio continuity
            return () => clearTimeout(timer);
        }
    }, [currentStep, location, langStr]);

    // Save & Transition on Verdict
    useEffect(() => {
        const finalize = async () => {
            if (currentStep === 'Verdict') {
                const promptText = t('calculating');
                speakResponse(promptText, langStr);
                try {
                    const phone = auth.currentUser?.phoneNumber || localStorage.getItem('demo_phone') || "9999999999";
                    const fuzzed = fuzzLocation(location?.latitude || 0, location?.longitude || 0);

                    await supabase.from('profiles').upsert({
                        phone: phone,
                        name: name || "Farmer",
                        crop: crop || "tomato",
                        land_size_acres: landSize || 1.0,
                        latitude: fuzzed.latitude,
                        longitude: fuzzed.longitude,
                        yield_quintals: yieldQuintals || 100,
                        planting_date: plantingDate || new Date().toISOString().split('T')[0],
                        storage_type: storageType || "Open Field",
                        transport_type: transportType || "Open Trolley"
                    });

                    setTimeout(() => router.push('/dashboard'), 3000);
                } catch (e) {
                    console.error("Save failed", e);
                }
            }
        };
        finalize();
    }, [currentStep]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 relative bg-forest text-white selection:bg-mint selection:text-forest overflow-hidden">
            {/* Background Layers */}
            <div className="absolute inset-0 z-0">
                <img src="/bg-img.jpg" alt="Background" className="w-full h-full object-cover opacity-20 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/80 to-transparent pointer-events-none"></div>
            </div>

            {/* Audio Engine */}
            <audio ref={audioRef} className="hidden" playsInline crossOrigin="anonymous" />

            {/* Language Selection Modal */}
            {showLanguageModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
                    <GlassCard className="p-8 max-w-sm w-full text-center slide-in-from-bottom-5">
                        <div className="w-16 h-16 mx-auto bg-mint/10 border border-mint/30 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-mint animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-mint mb-2">Speak your language</h2>
                        <p className="text-sm text-gray-400 mb-8">Agri-Vakeel AI supports 7 regional languages.</p>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { code: 'en', name: 'English' },
                                { code: 'hi', name: 'Hindi' },
                                { code: 'mr', name: 'Marathi' },
                                { code: 'te', name: 'Telugu' },
                                { code: 'ta', name: 'Tamil' },
                                { code: 'gu', name: 'Gujarati' },
                                { code: 'pa', name: 'Punjabi' }
                            ].map((l) => (
                                <button
                                    key={l.code}
                                    onClick={() => handleLanguageSelect(l.code, l.name)}
                                    className="bg-glass-bg border border-glass-border py-3 rounded-xl text-gray-300 font-medium hover:bg-mint/10 hover:border-mint/50 hover:text-mint transition-all"
                                >
                                    {l.name}
                                </button>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            )}

            {!showLanguageModal && currentStep !== 'Verdict' && (
                <div className="w-full max-w-md relative z-10 flex flex-col h-[90vh]">

                    {/* Assistant Chat Area */}
                    <div className="flex-1 overflow-y-auto mb-6 flex flex-col justify-end space-y-6 pb-12">
                        {/* Form Display Card (The Glassy Autofill) */}
                        <GlassCard className="p-5 border-mint/20 bg-forest/40 backdrop-blur-xl mb-4">
                            <h3 className="text-xs uppercase tracking-widest text-mint/60 font-bold mb-4 flex items-center">
                                <span className="w-2 h-2 rounded-full bg-mint mr-2 animate-pulse"></span>
                                Profile Extraction
                            </h3>
                            <div className="space-y-3">
                                {(() => {
                                    const labels: Record<string, any> = {
                                        "English": { c: "Consent", t: "Crop Type", s: "Scale (Acres)", g: "GPS Lock", st: "Storage", tr: "Transport", y: "Expected Yield" },
                                        "Hindi": { c: "सहमति", t: "फसल का प्रकार", s: "क्षेत्र (एकड़)", g: "जीपीएस लॉक", st: "भंडारण", tr: "यातायात", y: "अपेक्षित पैदावार" },
                                        "Marathi": { c: "संमती", t: "पिकाचा प्रकार", s: "क्षेत्र (एकर)", g: "जीपीएस लॉक", st: "साठवणूक", tr: "वाहतूक", y: "अपेक्षित उत्पन्न" }
                                    };
                                    const l = labels[langStr] || labels["English"];
                                    return (
                                        <>
                                            <FieldRow label={l.c} value={consentGranted === true ? (langStr === "Marathi" ? "मंजूर" : langStr === "Hindi" ? "मंजूर" : "Approved") : consentGranted === false ? "Declined" : "..."} active={currentStep === 'Consent'} filled={consentGranted !== null} />
                                            <FieldRow label={l.t} value={crop || "..."} active={currentStep === 'CropDetails'} filled={!!crop} />
                                            <FieldRow label={l.s} value={landSize ? `${landSize} ${langStr === "Marathi" ? "एकर" : "Acres"}` : "..."} active={currentStep === 'CropDetails'} filled={!!landSize} />
                                            <FieldRow label={l.g} value={location ? (langStr === "Marathi" ? "सुरक्षित" : "Secured") : "..."} active={currentStep === 'Location'} filled={!!location} />
                                            <FieldRow label={l.st} value={storageType || "..."} active={currentStep === 'StorageTransport'} filled={!!storageType} />
                                            <FieldRow label={l.tr} value={transportType || "..."} active={currentStep === 'StorageTransport'} filled={!!transportType} />
                                            <FieldRow label={l.y} value={yieldQuintals ? `${yieldQuintals} ${langStr === "Marathi" ? "क्विंटल" : "Quintals"}` : "..."} active={currentStep === 'FinalCalibration'} filled={!!yieldQuintals} />
                                        </>
                                    );
                                })()}
                            </div>
                        </GlassCard>

                        {/* Transcript Bubble */}
                        {transcript && (
                            <div className="self-end bg-white/10 border border-white/20 rounded-2xl rounded-tr-none py-3 px-5 max-w-[85%] text-white text-sm animate-in zoom-in-95">
                                "{transcript}"
                            </div>
                        )}

                        {/* Thinking Indicator */}
                        {isThinking && (
                            <div className="self-start py-2 px-4 flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-mint animate-bounce"></div>
                                <div className="w-2 h-2 rounded-full bg-mint animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 rounded-full bg-mint animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        )}

                        {/* AI Reply Bubble */}
                        {aiReply && !isThinking && (
                            <div className="self-start bg-mint/10 border border-mint/30 rounded-2xl rounded-tl-none py-4 px-5 max-w-[95%] text-mint text-[15px] leading-relaxed shadow-[0_0_20px_rgba(32,255,189,0.1)] animate-in fade-in slide-in-from-left-4">
                                {aiReply}
                            </div>
                        )}
                    </div>

                    {/* Microphone & Text fallback Controls */}
                    <div className="flex flex-col items-center shrink-0 pb-4">
                        {isListening && (
                            <div className="flex space-x-1 mb-6 h-8 items-center">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="w-1.5 bg-mint rounded-full animate-waveform" style={{ height: `${Math.max(20, Math.random() * 100)}%`, animationDelay: `${i * 0.1}s` }}></div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center space-x-4 w-full px-2">
                            <button
                                onClick={toggleListen}
                                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shrink-0 ${isListening
                                    ? 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)] animate-pulse'
                                    : 'bg-mint text-forest shadow-[0_0_20px_rgba(32,255,189,0.3)] hover:scale-105'}`}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    {isListening && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />}
                                </svg>
                            </button>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const input = e.currentTarget.elements.namedItem('text-input') as HTMLInputElement;
                                    if (input.value) {
                                        setTranscript(input.value);
                                        processAIExtraction(input.value);
                                        input.value = "";
                                    }
                                }}
                                className="flex-1 bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-2 hover:border-mint/30 focus-within:border-mint/50 transition-all shadow-inner"
                            >
                                <input
                                    name="text-input"
                                    type="text"
                                    placeholder={langStr === "Marathi" ? "येथे लिहा..." : langStr === "Hindi" ? "यहाँ लिखें..." : "Type here..."}
                                    className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-gray-500"
                                />
                                <button type="submit" className="text-mint ml-2 transform hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                </button>
                            </form>
                        </div>

                        <p className="text-gray-400 mt-3 text-xs tracking-wide">
                            {isListening ? "Listening... tap to stop" : "Speak to Agri-Vakeel or use the text box"}
                        </p>
                    </div>

                </div>
            )}

            {/* Verdict Loading State */}
            {currentStep === 'Verdict' && (
                <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-500">
                    <div className="w-24 h-24 relative mb-8">
                        <div className="absolute inset-0 rounded-full border-t-4 border-mint animate-spin"></div>
                        <div className="absolute inset-2 rounded-full border-l-4 border-transparent border-t-4 border-blue-400 animate-spin-slow"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-mint">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                    </div>
                    <h2 className="text-2xl text-white font-bold tracking-wider mb-2">{t('calculating')}</h2>
                    <p className="text-mint font-mono uppercase text-sm tracking-widest animate-pulse">{t('computing')}</p>
                </div>
            )}

        </div>
    );
}

// Subcomponent for the Glassy Extracted Fields
interface FieldRowProps {
    label: string;
    value: string;
    active: boolean;
    filled: boolean;
}

const FieldRow = ({ label, value, active, filled }: FieldRowProps) => (
    <div className={`flex justify-between items-center py-2 transition-all duration-500 ${active ? 'px-2 -mx-2 bg-mint/5 rounded-lg' : ''}`}>
        <span className={`text-sm ${active ? 'text-mint font-bold' : filled ? 'text-gray-300' : 'text-gray-500'}`}>
            {label}
        </span>
        <span className={`text-sm font-mono flex items-center ${filled ? 'text-mint' : active ? 'text-mint/40 animate-pulse' : 'text-gray-600'}`}>
            {value}
            {filled && (
                <svg className="w-4 h-4 ml-2 text-mint" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            )}
            {!filled && active && (
                <span className="ml-2 w-1.5 h-1.5 rounded-full bg-mint/30 animate-ping"></span>
            )}
        </span>
    </div>
);
