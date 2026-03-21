"use client";

let currentAudio: HTMLAudioElement | null = null;

/**
 * Stop any currently playing audio across the dashboard (both local TTS and AI Vakeel).
 */
export const stopAllSpeech = () => {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    
    // Stop all other audio components (like VoiceAssistant)
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent('agriVakeelStopAudio'));
        
        // Also stop browser built-in synthesis if active (used in NavigationMode)
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }
};

export const speak = async (text: string, language: string = "Hindi") => {
    if (!text) return;

    // Stop any current playback
    stopAllSpeech();

    try {
        const langMap: Record<string, string> = {
            en: "English",
            hi: "Hindi",
            mr: "Marathi",
            te: "Telugu",
            ta: "Tamil",
            gu: "Gujarati",
            pa: "Punjabi"
        };

        // Normalize language name if code is passed
        const langName = langMap[language] || language;

        const streamUrl = `/api/chat/tts?text=${encodeURIComponent(text)}&language=${encodeURIComponent(langName)}`;
        const audio = new Audio(streamUrl);
        
        if (langName === "Marathi") audio.playbackRate = 1.35;
        
        currentAudio = audio;
        await audio.play();
        
        return new Promise((resolve) => {
            audio.onended = () => {
                currentAudio = null;
                resolve(true);
            };
        });
    } catch (err) {
        console.error("Error playing audio in ttsService", err);
        currentAudio = null;
    }
};
