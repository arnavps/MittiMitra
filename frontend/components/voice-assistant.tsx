"use client";

import { useState, useRef, useEffect } from "react";
import { useOfflineCache } from "@/hooks/useOfflineCache";
import { useLanguage } from "@/contexts/LanguageContext";
import { getVoiceContextMode } from "@/services/voiceOrchestrator";
import { usePathname } from 'next/navigation';

interface VoiceAssistantProps {
    dashboardData: any; // The full response from /recommendation
    isEmbedded?: boolean;
    initialQuery?: string;
}

export function VoiceAssistant({ dashboardData, isEmbedded = false, initialQuery = "" }: VoiceAssistantProps) {
    const { t, language: globalLanguage } = useLanguage();
    const pathname = usePathname();

    // Map context codes to backend names
    const langCodeToName: Record<string, string> = {
        en: "English",
        hi: "Hindi",
        mr: "Marathi",
        te: "Telugu",
        ta: "Tamil",
        gu: "Gujarati",
        pa: "Punjabi"
    };

    const [isOpen, setIsOpen] = useState(isEmbedded);
    const [isListening, setIsListening] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [textInput, setTextInput] = useState("");
    const [response, setResponse] = useState("");
    const [language, setLanguage] = useState(langCodeToName[globalLanguage] || "Hindi");
    const [isSupported, setIsSupported] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [interventionOptions, setInterventionOptions] = useState<any[]>([]);

    // Sync with global language changes
    useEffect(() => {
        setLanguage(langCodeToName[globalLanguage] || "Hindi");
    }, [globalLanguage]);

    const { isOnline, cachedData: cachedAiResponse, saveToCache } = useOfflineCache('last_ai_response', '');

    // Web Speech API references
    const recognitionRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastShockRef = useRef<string | null>(null);

    useEffect(() => {
        if (initialQuery && !isThinking) {
            setIsOpen(true); // Pop open the assistant immediately
            setTranscript(initialQuery);
            setResponse(""); // Clear previous response when a new suggestion is clicked
            handleAskVakeel(initialQuery);
        }
    }, [initialQuery]);

    // Handle dynamic event-based triggers (e.g., from Logistics page)
    useEffect(() => {
        const handleCustomAsk = (event: any) => {
            const query = event.detail?.query;
            if (query && !isThinking) {
                setIsOpen(true);
                setTranscript(query);
                setResponse("");
                handleAskVakeel(query);
            }
        };

        window.addEventListener('agriVakeelAsk', handleCustomAsk);
        return () => window.removeEventListener('agriVakeelAsk', handleCustomAsk);
    }, [isThinking, dashboardData, language]); // Re-bind when context changes

    // Handle high-priority interventions (Rerouting, Thermal, Market)
    useEffect(() => {
        const handleIntervention = (event: any) => {
            const { message, title, options } = event.detail;
            setIsOpen(true);
            setResponse(message);
            setInterventionOptions(options || []);
            // In a real app, we'd wait for voice "Yes/No"
            // For now, we show the message and play the voice.
            speakResponse(message);
        };

        window.addEventListener('agriVakeelIntervention', handleIntervention);
        return () => window.removeEventListener('agriVakeelIntervention', handleIntervention);
    }, [language]);

    const initRecognition = () => {
        if (typeof window === "undefined") return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        try {
            if (recognitionRef.current) {
                recognitionRef.current.onresult = null;
                recognitionRef.current.onend = null;
                recognitionRef.current.onerror = null;
            }

            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;

            if (language === "Hindi") {
                recognition.lang = "hi-IN";
            } else if (language === "Marathi") {
                recognition.lang = "mr-IN";
            } else {
                recognition.lang = "en-US";
            }

            recognition.onresult = (event: any) => {
                const current = event.resultIndex;
                const text = event.results[current][0].transcript;
                setTranscript(text);
                handleAskVakeel(text);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onerror = (event: any) => {
                if (event.error !== 'no-speech') {
                    console.error("Speech recognition error", event.error);
                }
                setIsListening(false);

                if (event.error === 'not-allowed') {
                    setErrorMsg(t('micDenied') || "Microphone access denied.");
                } else if (event.error === 'network') {
                    setErrorMsg(t('networkError') || "Network error.");
                } else {
                    setErrorMsg(`Error: ${event.error}`);
                }
            };

            recognitionRef.current = recognition;
        } catch (e) {
            console.error("Failed to initialize recognition", e);
            setIsSupported(false);
        }
    };

    useEffect(() => {
        initRecognition();

        // Cleanup audio on unmount
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.removeAttribute('src');
            }
        };
    }, [language]);

    // 1. Market Shock / Rerouting Intervention
    useEffect(() => {
        if (dashboardData?.shock_alert?.is_shock) {
            const shockMsg = dashboardData.shock_alert.message || "";
            const pivotMsg = dashboardData.shock_alert.pivot_advice || "";
            const fullAlert = `${shockMsg} ${pivotMsg}`;
            
            if (lastShockRef.current !== fullAlert) {
                lastShockRef.current = fullAlert;
                triggerVoiceIntervention(fullAlert);
            }
        } else {
            lastShockRef.current = null;
        }
    }, [dashboardData?.shock_alert]);

    // 2. Harvest Oracle Strategic Intervention
    const lastHarvestAlertRef = useRef<string | null>(null);
    useEffect(() => {
        const oracleVerdict = dashboardData?.oracle_verdict;
        if (oracleVerdict?.action_priority === "STRATEGIC") {
            const harvestMsg = `Namaste! Based on your crop maturity and the high supply expected at the Mandi next week, I recommend harvesting 2 days early. You might lose 2kg of weight, but you will gain ₹5/kg in price.`;
            
            if (lastHarvestAlertRef.current !== harvestMsg) {
                lastHarvestAlertRef.current = harvestMsg;
                triggerVoiceIntervention(harvestMsg);
            }
        }
    }, [dashboardData?.oracle_verdict]);

    const triggerVoiceIntervention = (message: string) => {
        // FORCE INTERRUPT!
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        
        // Play alert beep
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5);
        } catch (e) {}

        setIsOpen(true);
        setResponse(message);
        speakResponse(message);
    };

    const toggleListen = async () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            setTranscript("");
            setResponse("");
            setErrorMsg(null);

            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }

            try {
                // EXPLICITLY request microphone permission first to force mobile browsers to prompt
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    // Immediately stop the stream, we just needed the permission granted for SpeechRecognition
                    stream.getTracks().forEach(track => track.stop());
                }

                recognitionRef.current?.start();
                setIsListening(true);
            } catch (err: any) {
                if (err.name === 'InvalidStateError') {
                    setIsListening(true);
                } else {
                    console.error("Microphone permission denied or not supported:", err);
                    setErrorMsg(t('micRequired') || "Microphone access is required to use the Voice Assistant.");
                    setIsListening(false);
                }
            }
        }
    };

    const [lastVoiceName, setLastVoiceName] = useState<string>("MittiMitra TTS Engine");

    const speakResponse = async (text: string) => {
        if (!text) return;

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        try {
            if (text.length >= 500) {
                // Use POST for long text to avoid URL limits
                const res = await fetch(`/api/chat/tts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, language })
                });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                audio.onended = () => URL.revokeObjectURL(url);

                audioRef.current = audio;
                await audio.play();
                setLastVoiceName(`MittiMitra Voice (${language}) - Extended Mode`);
            } else {
                // Use fast GET streaming for short text
                const streamUrl = `/api/chat/tts?text=${encodeURIComponent(text)}&language=${encodeURIComponent(language)}`;
                const audio = new Audio(streamUrl);

                audio.onerror = () => {
                    const error = audio.error;
                    console.error("Audio streaming error:", { code: error?.code, message: error?.message });
                    setLastVoiceName(`Error: Stream failed (Code ${error?.code || '?'})`);
                };

                if (language === "Marathi") audio.playbackRate = 1.35;

                audioRef.current = audio;
                await audio.play();
                setLastVoiceName(`MittiMitra Voice (${language}) - Streaming Mode`);
            }
        } catch (err) {
            console.error("Error playing audio response", err);
        }
    };

    const handleAskVakeel = async (query: string) => {
        if (!query.trim() || !dashboardData) return;

        // Also update the transcript UI so the user sees what they typed
        setTranscript(query);
        setTextInput(""); // clear the input field

        setIsThinking(true);
        try {
            const backendUrl = `/api/chat/explain`;
            const res = await fetch(backendUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    farmer_query: query,
                    dashboard_context: {
                        ...dashboardData,
                        context_mode: getVoiceContextMode(pathname)
                    },
                    language: language
                })
            });

            if (res.ok) {
                const data = await res.json();
                setResponse(data.response);
                saveToCache(data.response); // Cache the latest working response for offline resilience
                speakResponse(data.response);
            } else {
                setResponse(t('serverError') || "Sorry, I couldn't connect to the server.");
            }
        } catch (error) {
            console.error(error);
            const fallback = cachedAiResponse || t('networkErrorOccurred') || "Network error occurred.";
            setResponse(fallback);
            speakResponse(fallback);
        } finally {
            setIsThinking(false);
        }
    };

    const content = (
        <div className={`${isEmbedded ? 'w-full' : 'w-full max-w-lg max-h-[90vh] overflow-y-auto bg-forest/90 backdrop-blur-xl border border-glass-border rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative animate-in slide-in-from-bottom-10 duration-300'}`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-glass-border pb-4">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <span className="w-3 h-3 rounded-full bg-mint animate-pulse mr-2"></span>
                        {t('agriVakeel') || 'Agri-Vakeel AI'}
                    </h3>
                    <p className="text-sm text-gray-400">{t('askWhySellWait') || 'Ask why you should sell or wait'}</p>
                </div>
                {!isEmbedded && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                            if (audioRef.current) audioRef.current.pause();
                        }}
                        className="flex items-center space-x-2 bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-400 px-3 py-1.5 rounded-full border border-white/10 hover:border-red-500/30 transition-all font-bold text-xs uppercase tracking-widest"
                    >
                        <span>{t('close') || 'Close'}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Language Selection */}
            <div className="flex flex-wrap gap-2 mb-6">
                {['English', 'Hindi', 'Marathi', 'Telugu', 'Tamil', 'Gujarati', 'Punjabi'].map((lang) => (
                    <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${language === lang
                            ? 'bg-mint text-forest'
                            : 'bg-glass-bg border border-glass-border text-gray-300 hover:bg-white/5'
                            }`}
                    >
                        {lang}
                    </button>
                ))}
            </div>

            {/* Chat History / Transcript Area */}
            <div className="min-h-[150px] mb-6 flex flex-col justify-end space-y-4">
                {transcript && (
                    <div className="self-end bg-white/10 border border-glass-border rounded-2xl rounded-tr-none py-2 px-4 max-w-[85%] text-gray-200">
                        "{transcript}"
                    </div>
                )}

                {isThinking && (
                    <div className="self-start py-2 px-4 flex flex-col items-start space-y-1">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-mint animate-bounce"></div>
                            <div className="w-2 h-2 rounded-full bg-mint animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 rounded-full bg-mint animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-[10px] text-mint/60 uppercase tracking-widest font-bold">{t('findingAnswer') || 'MittiMitra is finding an answer...'}</span>
                    </div>
                )}

                {response && (
                    <div className="self-start space-y-3 w-full">
                        <div className="bg-mint/10 border border-mint/20 rounded-2xl rounded-tl-none py-3 px-4 text-mint whitespace-pre-wrap">
                            {response}
                        </div>
                        {interventionOptions.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in slide-in-from-top-2 duration-500">
                                {interventionOptions.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setResponse(`Confirmed: ${opt.label}`);
                                            setInterventionOptions([]);
                                            speakResponse(`Understood. ${opt.label} initiated.`);
                                        }}
                                        className="bg-mint text-forest px-4 py-2 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white transition-all shadow-lg"
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Voice Control Button & Waveform */}
            <div className="flex flex-col items-center justify-center mt-8">
                {isListening && (
                    <div className="flex items-center justify-center space-x-1 mb-4 h-8">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className="w-1.5 bg-mint rounded-full animate-waveform"
                                style={{ height: `${Math.max(20, Math.random() * 100)}%`, animationDelay: `${i * 0.1}s` }}
                            ></div>
                        ))}
                    </div>
                )}

                <button
                    onClick={toggleListen}
                    disabled={!isSupported}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${!isSupported ? 'bg-gray-600 cursor-not-allowed' : isListening
                        ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse'
                        : 'bg-mint text-forest shadow-[0_0_15px_rgba(32,255,189,0.2)] hover:scale-105'
                        }`}
                >
                    {isListening ? (
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                    ) : (
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    )}
                </button>
                <p className={`text-sm mt-4 font-medium transition-colors ${errorMsg ? 'text-red-400' : 'text-gray-400'}`}>
                    {!isSupported
                        ? (t('voiceNotSupported') || "Voice not supported in this browser")
                        : errorMsg
                            ? errorMsg
                            : isListening
                                ? (t('listeningTapStop') || "Listening... Tap to stop")
                                : (t('tapToSpeak') || "Tap to speak with Agri-Vakeel")}
                </p>
                {errorMsg && (
                    <button
                        onClick={() => { setErrorMsg(null); initRecognition(); }}
                        className="text-xs text-mint underline mt-2 hover:text-white"
                    >
                        {t('tryAgain') || 'Try Again'}
                    </button>
                )}

                {/* --- Text Fallback UI --- */}
                <div className="w-full mt-6 pt-6 border-t border-glass-border flex space-x-2">
                    <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAskVakeel(textInput);
                        }}
                        placeholder={`${t('typeQuestionIn') || 'Type your question in'} ${language}...`}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint transition-all"
                    />
                    <button
                        onClick={() => handleAskVakeel(textInput)}
                        disabled={!textInput.trim() || isThinking}
                        className="bg-mint text-forest p-3 rounded-xl disabled:opacity-50 hover:bg-white hover:shadow-[0_0_15px_rgba(32,255,189,0.3)] transition-all flex items-center justify-center min-w-[3rem]"
                    >
                        {isThinking ? (
                            <div className="w-4 h-4 border-2 border-forest border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Voice Engine Diagnostic (Subtle) */}
            {lastVoiceName && (
                <div className="mt-4 flex justify-center">
                    <p className="text-[10px] text-white/20 font-mono tracking-tight uppercase">
                        {t('aiEngine') || 'AI Engine'}: {lastVoiceName}
                    </p>
                </div>
            )}
        </div>
    );

    if (isEmbedded) return <div className="w-full">{content}</div>;

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-mint shadow-[0_4px_30px_rgba(32,255,189,0.3)] flex items-center justify-center text-forest hover:scale-105 transition-transform z-40 border-2 border-mint/50"
            >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            </button>

            {/* Glassy Bottom Sheet Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => {
                        setIsOpen(false);
                        if (audioRef.current) audioRef.current.pause();
                    }}
                >
                    <div onClick={(e) => e.stopPropagation()} className="w-full sm:w-auto">
                        {content}
                    </div>
                </div>
            )}
        </>
    );
}
