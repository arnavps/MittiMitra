"use client";

import { useState, useRef, useEffect } from 'react';
import { GlassCard } from '@/components/glass-card';
import { useGPS } from '@/hooks/useGPS';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { auth } from '@/services/firebase';
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
  | 'CropName'          // Phase 1 - Step 2
  | 'YieldVolume'       // Phase 1 - Step 3
  | 'LocationPermission' // Phase 1 - Step 4
  | 'HarvestStatus'     // Phase 2 - Step 5
  | 'StorageAudit'      // Branch A - Step A3
  | 'HealthAudit'       // Branch A - Step A4 (Camera)
  | 'MaturityCheck'     // Branch B - Step B3
  | 'OracleVerdict'     // Branch B - Step B4
  | 'TransitConfig'     // Phase 3 - Step 6
  | 'Success';          // Phase 3 - Step 9 (Dashboard)

const ONBOARDING_STRINGS: Record<string, any> = {
    "English": {
        greeting: "Namaste! I am MittiMitra. To find you the best profit windows, I need to use your GPS and crop data. Do I have your permission to proceed?",
        location_success: "Location secured. Is your crop already harvested, or are you still waiting for it to ripen?",
        location_error: "Got it. We can proceed anyway. Is your crop already harvested, or are you still waiting?",
        error_parsing: "Sorry, I had trouble processing that. Could you please say it again?",
        camera_success: "Quality data analyzed. How will you be transporting your produce? Two wheeler, tractor, or pickup truck?"
    },
    "Hindi": {
        greeting: "नमस्ते! मैं मिट्टीमित्र हूँ। आपके लिए सबसे अच्छे लाभ खिड़कियां खोजने के लिए, मुझे आपके जीपीएस और फसल डेटा का उपयोग करने की आवश्यकता है। क्या मुझे आगे बढ़ने के लिए आपकी अनुमति है?",
        location_success: "स्थान प्राप्त हुआ। क्या आपकी फसल पहले ही कट चुकी है, या आप अभी इसके पकने का इंतजार कर रहे हैं?",
        location_error: "स्थान प्राप्त करने में समस्या हुई, लेकिन हम आगे बढ़ सकते हैं। क्या आपकी फसल पहले ही कट चुकी है?",
        error_parsing: "क्षमा करें, मुझे समझने में दिक्कत हुई। कृपया फिर से कहें।",
        camera_success: "गुणवत्ता डेटा का विश्लेषण किया गया। आप अपनी उपज का परिवहन कैसे करेंगे? दोपहिया, ट्रैक्टर, या पिकअप ट्रक?"
    },
    "Marathi": {
        greeting: "नमस्कार! मी मिट्टीमित्र आहे. तुमच्यासाठी सर्वोत्तम नफा शोधण्यासाठी, मला तुमचा जीपीएस आणि पिकाचा डेटा वापरण्याची परवानगी हवी आहे. मी पुढे जाऊ शकतो का?",
        location_success: "स्थान प्राप्त झाले. तुमची पिकाची कापणी आधीच झाली आहे, की तुम्ही अजून ती पिकण्याची वाट पाहत आहात?",
        location_error: "स्थान मिळवण्यात अडचण आली, पण आपण पुढे जाऊ शकतो. तुमची कापणी आधीच झाली आहे का?",
        error_parsing: "क्षमस्व, मला ते समजण्यात अडचण आली. कृपया पुन्हा सांगाल का?",
        camera_success: "गुणवत्ता डेटाचे विश्लेषण केले. तुम्ही तुमचा माल कसा नेणार आहात? दुचाकी, ट्रॅक्टर किंवा पिकअप ट्रक?"
    },
    "Tamil": {
        greeting: "வணக்கம்! நான் மிட்டிமித்ரா. உங்களுக்குச் சிறந்த லாபச் சந்தைகளைக் கண்டறிய, உங்கள் ஜிபிஎஸ் மற்றும் பயிர் தரவைப் பயன்படுத்த எனக்கு அனுமதி தேவை. நான் தொடரலாமா?",
        location_success: "இருப்பிடம் உறுதி செய்யப்பட்டது. உங்கள் பயிர் ஏற்கனவே அறுவடை செய்யப்பட்டுவிட்டதா, அல்லது அது முதிர்ச்சியடையும் வரை காத்திருக்கிறீர்களா?",
        location_error: "இருப்பிடத்தைப் பெறுவதில் சிக்கல் உள்ளது, ஆனால் நாம் தொடரலாம். உங்கள் பயிர் ஏற்கனவே அறுவடை செய்யப்பட்டுவிட்டதா?",
        error_parsing: "மன்னிக்கவும், அதைப் புரிந்துகொள்வதில் எனக்குச் சிரமம் இருந்தது. தயవుசெய்து மீண்டும் சொல்ல முடியுமா?",
        camera_success: "தரத் தரவு பகுப்பாய்வு செய்யப்பட்டது. உங்கள் விளைபொருட்களை எப்படி கொண்டு செல்வீர்கள்? இருசக்கர வாகனம், டிராக்டர் அல்லது பிக்கப் டிரக்?"
    },
    "Telugu": {
        greeting: "నమస్కారం! నేను మిట్టిమిత్ర. మీకు ఉత్తమ లాభదాయకమైన మార్కేట్లను కనుగొనడానికి, మీ జిపిఎస్ మరియు పంట డేటాను ఉపయోగించడానికి నాకు మీ అనుమతి అవసరం. నేను కొనసాగించవచ్చా?",
        location_success: "స్థానం గుర్తించబడింది. మీ పంట ఇప్పటికే కోతకు వచ్చిందా, లేదా మీరు ఇంకా అది పక్వానికి రావాలని ఎదురుచూస్తున్నారా?",
        location_error: "స్థానాన్ని పొందడంలో ఇబ్బంది ఉంది, కానీ మనం ముందుకు వెళ్ళవచ్చు. మీ పంట ఇప్పటికే కోతకు వచ్చిందా?",
        error_parsing: "క్షమించండి, దాన్ని ప్రాసెస్ చేయడంలో నాకు ఇబ్బంది కలిగింది. దయచేసి మళ్ళీ చెప్పగలరా?",
        camera_success: "నాణ్యత డేటా విశ్లేషించబడింది. మీరు మీ ఉత్పత్తులను ఎలా రవాణా చేస్తారు? ద్విచక్ర వాహనం, ట్రాక్టర్ లేదా పికప్ ట్రక్?"
    },
    "Gujarati": {
        greeting: "નમસ્તે! હું મિત્તીમિત્ર છું. તમારા માટે શ્રેષ્ઠ નફાકારક બજારો શોધવા માટે, મારે તમારા જીપીએસ અને પાકના ડેટાનો ઉપયોગ કરવાની મંજૂરી જોઈએ છે. શું હું આગળ વધી શકું?",
        location_success: "સ્થાન મળી ગયું. શું તમારા પાકની લણણી થઈ ગઈ છે, અથવા તમે હજુ પણ તેના પાકવાની રાહ જોઈ રહ્યા છો?",
        location_error: "સ્થાન મેળવવામાં સમસ્યા થઈ, પણ આપણે આગળ વધી શકીએ છીએ. શું તમારા પાકની લણણી થઈ ગઈ છે?",
        error_parsing: "ક્ષમા કરશો, મને તે સમજવામાં મુશ્કેલી પડી. શું તમે કૃપા કરીને ફરીથી કહી શકશો?",
        camera_success: "ગુણવત્તાના ડેટાનું વિશ્લેષણ કરવામાં આવ્યું. તમે તમારી ઉપજનું પરિવહન કેવી રીતે કરશો? ટુ વ્હીલર, ટ્રેક્ટર અથવા પિકઅપ ટ્રક?"
    },
    "Punjabi": {
        greeting: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਮਿੱਟੀਮਿੱਤਰ ਹਾਂ। ਤੁਹਾਡੇ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ ਮੁਨਾਫ਼ਾ ਵਾਲੀਆਂ ਮੰਡੀਆਂ ਲੱਭਣ ਲਈ, ਮੈਨੂੰ ਤੁਹਾਡੇ ਜੀਪੀਐਸ ਅਤੇ ਫ਼ਸਲ ਦੇ ਡੇਟਾ ਦੀ ਵਰਤੋਂ ਕਰਨ ਦੀ ਇਜਾਜ਼ਤ ਚਾਹੀਦੀ ਹੈ। ਕੀ ਮੈਂ ਅੱਗੇ ਵਧ ਸਕਦਾ ਹਾਂ?",
        location_success: "ਲੋਕੇਸ਼ਨ ਮਿਲ ਗਈ ਹੈ। ਕੀ ਤੁਹਾਡੀ ਫ਼ਸਲ ਦੀ ਕਟਾਈ ਹੋ ਚੁੱਕੀ ਹੈ, ਜਾਂ ਤੁਸੀਂ ਅਜੇ ਵੀ ਇਸ ਦੇ ਪੱਕਣ ਦੀ ਉਡੀਕ ਕਰ ਰਹੇ ਹੋ?",
        location_error: "ਲੋਕੇਸ਼ਨ ਪ੍ਰਾਪਤ ਕਰਨ ਵਿੱਚ ਮੁਸ਼ਕਲ ਆਈ ਹੈ, ਪਰ ਅਸੀਂ ਅੱਗੇ ਵਧ ਸਕਦੇ ਹਾਂ। ਕੀ ਤੁਹਾਡੀ ਫ਼ਸਲ ਦੀ ਕਟਾਈ ਪਹਿਲਾਂ ਹੀ ਹੋ ਚੁੱਕੀ ਹੈ?",
        error_parsing: "ਮਾਫ਼ ਕਰਨਾ, ਮੈਨੂੰ ਇਸ ਨੂੰ ਸਮਝਣ ਵਿੱਚ ਮੁਸ਼ਕਲ ਆਈ ਹੈ। ਕੀ ਤੁਸੀਂ ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕਹਿ ਸਕਦੇ ਹੋ?",
        camera_success: "ਗੁਣਵੱਤਾ ਦੇ ਡੇਟਾ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਕੀਤਾ ਗਿਆ ਹੈ। ਤੁਸੀਂ ਆਪਣੀ ਉਪਜ ਦੀ ਢੋਆ-ਢੁਆਈ ਕਿਵੇਂ ਕਰੋਗੇ? ਦੋ ਪਹੀਆ ਵਾਹਨ, ਟ੍ਰੈਕਟਰ, ਜਾਂ ਪਿਕਅੱਪ ਟਰੱਕ?"
    }
};

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
    const cropRef = useRef("");
    const [yieldAmount, setYieldAmount] = useState("");
    const yieldAmountRef = useRef("");
    const [harvestStatus, setHarvestStatus] = useState<'Already Harvested' | 'Not Yet Harvested' | null>(null);
    const harvestStatusRef = useRef<'Already Harvested' | 'Not Yet Harvested' | null>(null);
    const [storageType, setStorageType] = useState("");
    const storageTypeRef = useRef("");
    const [healthStatus, setHealthStatus] = useState("");
    const healthStatusRef = useRef("");
    const [sowingDate, setSowingDate] = useState("");
    const sowingDateRef = useRef("");
    const [transportType, setTransportType] = useState("");
    const transportTypeRef = useRef("");
    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // AI/UI States
    const [messages, setMessages] = useState<{ id: number, role: 'ai' | 'user', text: string }[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [recommendation, setRecommendation] = useState<any>(null);
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
                    if (text && text.trim()) {
                        const userText = text.trim();
                        setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: userText }]);
                        processAIExtraction(userText);
                    }
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
        audioRef.current.playbackRate = 1.15;
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
        
        const strings = ONBOARDING_STRINGS[name] || ONBOARDING_STRINGS["English"];
        const greeting = strings.greeting;
        
        setMessages([{ id: Date.now(), role: 'ai', text: greeting }]);
        speakResponse(greeting, name, () => startListening());
    };

    const startListening = () => {
        if (recognitionRef.current) {
            const langMap: any = { 
                "English": "en-IN", 
                "Hindi": "hi-IN", 
                "Marathi": "mr-IN",
                "Tamil": "ta-IN",
                "Telugu": "te-IN",
                "Gujarati": "gu-IN",
                "Punjabi": "pa-IN"
            };
            recognitionRef.current.lang = langMap[langStr] || "en-IN";
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {}
        }
    };

    const processAIExtraction = async (text: string) => {
        setIsThinking(true);
        try {
            const res = await fetch('/api/chat/onboarding_extract', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    step: currentStepRef.current,
                    text_input: text,
                    language: langStr,
                    current_name: "Farmer",
                    current_crop: cropRef.current || crop,
                    current_yield: yieldAmountRef.current || yieldAmount,
                    consent_granted: consentGranted,
                    current_storage: storageTypeRef.current || storageType,
                    current_transport: transportTypeRef.current || transportType,
                    harvest_status: (harvestStatusRef.current || harvestStatus) === 'Already Harvested' ? 'already_harvested' : ((harvestStatusRef.current || harvestStatus) === 'Not Yet Harvested' ? 'not_yet_harvested' : null),
                    location_provided: !!location,
                    sowing_date: sowingDateRef.current || sowingDate,
                    health_issue: (healthStatusRef.current || healthStatus) === "Issue Reported" ? true : ((healthStatusRef.current || healthStatus) === "No Issue" ? false : null),
                })
            });

            if (!res.ok) throw new Error("API responded with error");
            const data = await res.json();
            setIsThinking(false);
            
            // 1. UPDATE ALL STATE VARIABLES
            if (data.consent_granted === true && !consentGranted) {
                setConsentGranted(true);
            }
            if (data.crop && !crop) { 
                setCrop(data.crop); 
                cropRef.current = data.crop; 
            }
            if (data.yield_quintals && !yieldAmount) { 
                setYieldAmount(data.yield_quintals); 
                yieldAmountRef.current = data.yield_quintals; 
            }
            if (data.storage_type && !storageType) { 
                setStorageType(data.storage_type); 
                storageTypeRef.current = data.storage_type; 
            }
            if (data.transport_type && !transportType) { 
                setTransportType(data.transport_type); 
                transportTypeRef.current = data.transport_type; 
            }
            if (data.health_issue !== undefined && data.health_issue !== null) {
                setHealthStatus(data.health_issue ? "Issue Reported" : "Healthy");
                healthStatusRef.current = data.health_issue ? "Issue Reported" : "Healthy";
            }
            if (data.harvest_status) {
                const status = data.harvest_status === 'already_harvested' ? 'Already Harvested' : 'Not Yet Harvested';
                setHarvestStatus(status);
                harvestStatusRef.current = status;
            }
            if (data.sowing_date) {
                setSowingDate(data.sowing_date);
                sowingDateRef.current = data.sowing_date;
            }

            if (data.ai_reply) {
                setMessages(prev => [...prev, { id: Date.now(), role: 'ai', text: data.ai_reply }]);
            }

            // 1. UPDATE ALL STATE VARIABLES (Concurrent with local variables for next step)
            let updatedConsent = consentGranted || data.consent_granted;
            let updatedCrop = crop || data.crop;
            let updatedYield = yieldAmount || data.yield_quintals;
            let updatedHarvest = harvestStatus;

            if (data.consent_granted === true && !consentGranted) {
                setConsentGranted(true);
                updatedConsent = true;
            }
            if (data.crop && !crop) { 
                setCrop(data.crop); 
                cropRef.current = data.crop; 
                updatedCrop = data.crop;
            }
            if (data.yield_quintals && !yieldAmount) { 
                setYieldAmount(data.yield_quintals); 
                yieldAmountRef.current = data.yield_quintals; 
                updatedYield = data.yield_quintals;
            }
            if (data.harvest_status) {
                const status = data.harvest_status === 'already_harvested' ? 'Already Harvested' : 'Not Yet Harvested';
                setHarvestStatus(status);
                harvestStatusRef.current = status;
                updatedHarvest = status;
            }
            if (data.storage_type && !storageType) { 
                setStorageType(data.storage_type); 
                storageTypeRef.current = data.storage_type; 
            }
            if (data.transport_type && !transportType) { 
                setTransportType(data.transport_type); 
                transportTypeRef.current = data.transport_type; 
            }
            if (data.health_issue !== undefined && data.health_issue !== null) {
                const status = data.health_issue ? "Issue Reported" : "Healthy";
                setHealthStatus(status);
                healthStatusRef.current = status;
            }
            if (data.sowing_date) {
                setSowingDate(data.sowing_date);
                sowingDateRef.current = data.sowing_date;
            }

            // 2. INTELLIGENT STEP TRANSITION
            const updateStep = () => {
                if (!updatedConsent) return 'Consent';
                if (!updatedCrop) return 'CropName';
                if (!updatedYield) return 'YieldVolume';
                if (!location && !gpsError) return 'LocationPermission';
                if (!updatedHarvest) return 'HarvestStatus';
                
                if (updatedHarvest === 'Already Harvested') {
                    if (!(storageType || data.storage_type)) return 'StorageAudit';
                    if (data.health_issue === true || healthStatusRef.current === "Issue Reported") return 'HealthAudit';
                    if (!(transportType || data.transport_type)) return 'TransitConfig';
                    return 'Success';
                } else if (updatedHarvest === 'Not Yet Harvested') {
                    if (!(sowingDate || data.sowing_date)) return 'MaturityCheck';
                    return 'Success';
                }
                return currentStepRef.current;
            };

            const nextStep = updateStep();
            if (nextStep !== currentStepRef.current) {
                setCurrentStep(nextStep);
                if (nextStep === 'LocationPermission') {
                    requestLocation();
                }
            }

            if (data.ai_reply) {
                speakResponse(data.ai_reply, langStr, async () => {
                    if (nextStep === 'Success') {
                        await saveOnboardingData();
                        fetchFinalRecommendation();
                    } else if (nextStep !== 'HealthAudit' && nextStep !== 'LocationPermission') {
                        startListening();
                    }
                });
            }
        } catch (err) {
            console.error("AI Extraction failed", err);
            setIsThinking(false);
            const strings = ONBOARDING_STRINGS[langStr] || ONBOARDING_STRINGS["English"];
            const errorMsg = strings.error_parsing;
            setMessages(prev => [...prev, { id: Date.now(), role: 'ai', text: errorMsg }]);
            speakResponse(errorMsg, langStr, () => startListening());
        }
    };

    const fetchFinalRecommendation = async () => {
        setIsThinking(true);
        try {
            const payload = {
                crop: cropRef.current || crop || "Cotton",
                location: location ? { lat: location.latitude, lng: location.longitude } : { lat: 18.5204, lng: 73.8567 },
                yield_est_quintals: parseFloat(yieldAmountRef.current || yieldAmount) || 50,
                base_spoilage_rate: 0.05,
                language: globalLanguage,
                planting_date: sowingDate || null,
                is_harvested: harvestStatusRef.current === 'Already Harvested' || harvestStatus === 'Already Harvested'
            };

            const res = await fetch('/api/recommendation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                setRecommendation(data);
            }
        } catch (err) {
            console.error("Failed to fetch final recommendation", err);
        } finally {
            setIsThinking(false);
        }
    };

    // Watch for location to advance from LocationPermission
    useEffect(() => {
        const strings = ONBOARDING_STRINGS[langStr] || ONBOARDING_STRINGS["English"];
        if (location && currentStepRef.current === 'LocationPermission') {
            const nextMsg = strings.location_success;
            setMessages(prev => [...prev, { id: Date.now(), role: 'ai', text: nextMsg }]);
            speakResponse(nextMsg, langStr, () => startListening());
            setCurrentStep('HarvestStatus');
        } else if (gpsError && currentStepRef.current === 'LocationPermission') {
            const nextMsg = strings.location_error;
            setMessages(prev => [...prev, { id: Date.now(), role: 'ai', text: nextMsg }]);
            speakResponse(nextMsg, langStr, () => startListening());
            setCurrentStep('HarvestStatus');
        }
    }, [location, gpsError]);

    const saveOnboardingData = async () => {
        try {
            const phone = auth.currentUser?.phoneNumber || localStorage.getItem('demo_phone') || "9999999999";
            
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    phone,
                    name: 'Farmer',
                    crop: cropRef.current || crop,
                    yield_quintals: parseFloat(yieldAmountRef.current || yieldAmount) || 0,
                    harvest_status: harvestStatusRef.current === 'Already Harvested' || harvestStatus === 'Already Harvested',
                    latitude: location?.latitude || 18.5204,
                    longitude: location?.longitude || 73.8567,
                    storage_type: storageTypeRef.current || storageType || 'Open Field',
                    transport_type: transportTypeRef.current || transportType || 'Open Trolley',
                    last_onboarding_step: 'Success',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'phone' });

            if (error) throw error;
            console.log("Onboarding data saved successfully");
        } catch (err) {
            console.error("Failed to save onboarding data", err);
        }
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
            const strings = ONBOARDING_STRINGS[langStr] || ONBOARDING_STRINGS["English"];
            setCurrentStep('TransitConfig');
            const nextMsg = strings.camera_success;
            setMessages(prev => [...prev, { id: Date.now(), role: 'ai', text: nextMsg }]);
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
                            <h2 className="text-2xl font-black mb-2 tracking-tight">{t('selectLanguage')}</h2>
                            <div className="grid grid-cols-2 gap-4 mt-8">
                                {[
                                    { code: 'en', name: 'English', label: t('english') },
                                    { code: 'hi', name: 'Hindi', label: t('hindi') },
                                    { code: 'mr', name: 'Marathi', label: t('marathi') },
                                    { code: 'ta', name: 'Tamil', label: t('tamil') },
                                    { code: 'te', name: 'Telugu', label: t('telugu') },
                                    { code: 'gu', name: 'Gujarati', label: t('gujarati') },
                                    { code: 'pa', name: 'Punjabi', label: t('punjabi') }
                                ].map(l => (
                                    <button 
                                        key={l.code}
                                        onClick={() => handleLanguageSelect(l.code, l.name)}
                                        className="p-4 rounded-2xl bg-white/5 border border-white/10 font-bold hover:bg-mint/20 hover:border-mint transition-all"
                                    >
                                        {l.label}
                                    </button>
                                ))}
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content: Card-Based Layout */}
            {!showLanguageModal && (
                <div className="relative z-10 w-full h-screen min-h-screen overflow-hidden flex flex-col items-center justify-center p-2 lg:p-4">
                    <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 h-[92vh] max-h-none">
                        
                        {/* LEFT CARD: Extraction Ledger (35%) */}
                        <motion.div 
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-4 h-full overflow-hidden"
                        >
                            <GlassCard className="h-full flex flex-col p-6 lg:p-10 border-mint/10 overflow-hidden relative group shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                <div className="mb-6">
                                    <div className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-[0.3em] text-mint/60 mb-3">
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
                                        label="Crop Name" 
                                        value={crop || "Waiting..."} 
                                        status={crop ? 'locked' : (currentStepRef.current === 'CropName' ? 'active' : 'pending')}
                                        icon={<RefreshCw className="w-4 h-4" />}
                                    />
                                    <LedgerItem 
                                        label="Yield Volume" 
                                        value={yieldAmount ? `${yieldAmount} Quintals` : "---"} 
                                        status={yieldAmount ? 'locked' : (currentStepRef.current === 'YieldVolume' ? 'active' : 'pending')}
                                        icon={<Zap className="w-4 h-4" />}
                                    />
                                    <LedgerItem 
                                        label="Field Location" 
                                        value={location ? "Located ✅" : (gpsError ? "Manual 📍" : "Finding...")} 
                                        status={location || gpsError ? 'locked' : (currentStepRef.current === 'LocationPermission' ? 'active' : 'pending')}
                                        icon={<MapPin className="w-4 h-4" />}
                                    />
                                    <LedgerItem 
                                        label="Harvest Status" 
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
                                                    label="Health Status" 
                                                    value={healthStatus || "---"} 
                                                    status={healthStatus ? 'locked' : (currentStepRef.current === 'HealthAudit' ? 'active' : 'pending')}
                                                    icon={<AlertTriangle className="w-4 h-4" />}
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
                                    <div className="font-mono text-[8px] tracking-widest text-mint text-center uppercase">
                                        System Node Trace: MUM-EDG-92
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
                            <GlassCard className="h-full flex flex-col border-mint/20 overflow-hidden relative shadow-[0_30px_70px_rgba(0,0,0,0.6)] bg-forest/30">
                                {/* Chat Header */}
                                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/[0.03] backdrop-blur-md">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded-2xl bg-mint/20 flex items-center justify-center border border-mint/20 shadow-[0_0_20px_rgba(32,255,189,0.2)]">
                                            <Zap className="w-5 h-5 text-mint" />
                                        </div>
                                        <div>
                                            <div className="font-black text-sm uppercase tracking-tight">Agri-Vakeel Interface</div>
                                            <div className="text-[10px] text-mint flex items-center font-bold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse mr-2" />
                                                Data Uplink Stable
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages Area - Sliding Window (Last 2 Messages) */}
                                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 custom-scrollbar pb-10">
                                    <AnimatePresence initial={false} mode="popLayout">
                                        {messages.slice(-2).map((msg) => (
                                            <motion.div
                                                key={`msg-${msg.id}`}
                                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                                className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}
                                            >
                                                <div className={`max-w-[85%] p-6 rounded-3xl shadow-xl ${
                                                    msg.role === 'ai' 
                                                        ? 'bg-white/[0.07] border border-white/10 text-white italic text-lg leading-relaxed rounded-bl-none backdrop-blur-md' 
                                                        : 'bg-mint text-forest font-black text-lg rounded-br-none shadow-[0_10px_30px_rgba(32,255,189,0.4)]'
                                                }`}>
                                                    {msg.role === 'ai' ? (
                                                        <span className="text-mint">"{msg.text}"</span>
                                                    ) : (
                                                        <span>{msg.text}</span>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {isThinking && (
                                        <div className="flex space-x-2 p-4 justify-start">
                                            <div className="w-2.5 h-2.5 bg-mint/50 rounded-full animate-bounce" />
                                            <div className="w-2.5 h-2.5 bg-mint/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <div className="w-2.5 h-2.5 bg-mint/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    )}
                                </div>

                                {/* Message Input Bar - Ultra High Visibility */}
                                <div className="p-6 lg:p-8 bg-forest/90 border-t-2 border-mint/30 backdrop-blur-3xl shadow-[0_-20px_50px_rgba(32,255,189,0.1)] flex flex-col space-y-4">
                                    {currentStep === 'HealthAudit' && !cameraActive && (
                                        <div className="w-full flex justify-center pb-2">
                                            <button 
                                                onClick={startCameraStep}
                                                className="w-full max-w-sm h-14 bg-mint text-forest rounded-2xl flex items-center justify-center space-x-3 font-black uppercase tracking-[0.1em] shadow-[0_0_40px_rgba(32,255,189,0.4)] hover:scale-[1.03] active:scale-95 transition-all text-sm"
                                            >
                                                <Camera className="w-6 h-6" />
                                                <span>Initialize Visual Audit</span>
                                            </button>
                                        </div>
                                    )}
                                    <div className="max-w-2xl mx-auto w-full flex items-center space-x-5">
                                        <button 
                                            onClick={isListening ? () => recognitionRef.current?.stop() : startListening}
                                            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-2xl shrink-0 ${
                                                isListening 
                                                ? 'bg-red-500 scale-110 shadow-[0_0_50px_rgba(239,68,68,0.5)]' 
                                                : 'bg-mint text-forest hover:scale-110 active:scale-90 shadow-[0_10px_30px_rgba(32,255,189,0.3)]'
                                            }`}
                                        >
                                            {isListening ? <MicOff className="w-8 h-8 animate-pulse" /> : <Mic className="w-8 h-8" />}
                                        </button>
                                        <form 
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                const input = e.currentTarget.elements.namedItem('text-input') as HTMLInputElement;
                                                const trimmedValue = input.value.trim();
                                                if (trimmedValue) {
                                                    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: trimmedValue }]);
                                                    processAIExtraction(trimmedValue);
                                                    input.value = "";
                                                }
                                            }}
                                            className="flex-1 h-16 bg-white/[0.08] border-2 border-mint/20 rounded-2xl flex items-center px-6 focus-within:border-mint/60 focus-within:bg-white/[0.12] transition-all shadow-xl group"
                                        >
                                            <input 
                                                name="text-input"
                                                type="text"
                                                autoComplete="off"
                                                placeholder={isListening ? "Listening..." : "Speak via mic or type..."}
                                                className="bg-transparent border-none outline-none text-white text-md w-full placeholder:text-gray-400 font-bold"
                                            />
                                            <button type="submit" className="text-mint ml-4 hover:scale-125 transition-transform active:scale-90">
                                                <Send className="w-7 h-7" />
                                            </button>
                                        </form>
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
                                    <div className="font-bold text-sm uppercase">
                                        {recommendation?.mandi_stats?.name || "Detecting..."}
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={async () => {
                                    setIsThinking(true); // Re-use thinking state for loading
                                    await saveOnboardingData();
                                    router.push('/dashboard');
                                }}
                                disabled={isThinking}
                                className="w-full h-20 bg-mint text-forest rounded-[2rem] flex items-center justify-center space-x-4 font-black uppercase tracking-[0.2em] shadow-[0_0_60px_rgba(32,255,189,0.4)] hover:scale-[1.03] active:scale-95 transition-all text-sm disabled:opacity-70 disabled:hover:scale-100"
                             >
                                <Zap className={`w-5 h-5 ${isThinking ? 'animate-pulse' : ''}`} />
                                <span>{isThinking ? 'Syncing...' : 'Enter Dashboard'}</span>
                                {!isThinking && <ChevronRight className="w-6 h-6" />}
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
