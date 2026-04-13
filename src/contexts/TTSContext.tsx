import { createContext, useContext, useCallback, useRef, type ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/i18n/translations";

const langToSpeechLang: Record<Language, string> = {
  en: "en-IN",
  hi: "hi-IN",
  te: "te-IN",
  ml: "ml-IN",
  kn: "kn-IN",
  ta: "ta-IN",
};

interface TTSContextType {
  speak: (text: string) => void;
  stop: () => void;
}

const TTSContext = createContext<TTSContextType>({
  speak: () => {},
  stop: () => {},
});

export function TTSProvider({ children }: { children: ReactNode }) {
  const { lang } = useLanguage();
  const voicesLoadedRef = useRef(false);

  const getMatchingVoice = useCallback(
    (voices: SpeechSynthesisVoice[]) => {
      const speechLang = langToSpeechLang[lang] || "en-IN";
      // Priority: exact match → prefix match on full code → prefix match on base lang
      return (
        voices.find((v) => v.lang === speechLang) ||
        voices.find((v) => v.lang.startsWith(speechLang.split("-")[0])) ||
        null
      );
    },
    [lang]
  );

  const speak = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();

      const doSpeak = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        const speechLang = langToSpeechLang[lang] || "en-IN";
        utterance.lang = speechLang;
        utterance.rate = 0.9;
        utterance.pitch = 1;

        const voices = window.speechSynthesis.getVoices();
        const match = getMatchingVoice(voices);
        if (match) utterance.voice = match;

        window.speechSynthesis.speak(utterance);
      };

      // Voices may not be loaded yet on first call
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0 && !voicesLoadedRef.current) {
        window.speechSynthesis.onvoiceschanged = () => {
          voicesLoadedRef.current = true;
          doSpeak();
        };
      } else {
        doSpeak();
      }
    },
    [lang, getMatchingVoice]
  );

  const stop = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  return (
    <TTSContext.Provider value={{ speak, stop }}>
      {children}
    </TTSContext.Provider>
  );
}

export const useTTS = () => useContext(TTSContext);
