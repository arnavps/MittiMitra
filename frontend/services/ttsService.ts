"use client";

let currentAudio: HTMLAudioElement | null = null;

export const speak = async (text: string, language: string = "Hindi") => {
    if (!text) return;

    // Stop any current playback
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

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
