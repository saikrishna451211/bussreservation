import { useState, useCallback, useRef, useEffect } from "react";

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
  setLanguage: (lang: string) => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const langRef = useRef("en-IN");

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const createRecognition = useCallback(() => {
    if (!isSupported) return;
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = langRef.current;

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1][0].transcript;
      setTranscript(result);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
  }, [isSupported]);

  useEffect(() => {
    createRecognition();
  }, [createRecognition]);

  const setLanguage = useCallback((lang: string) => {
    langRef.current = lang;
    // Recreate recognition with new language
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
    createRecognition();
  }, [createRecognition]);

  const startListening = useCallback(() => {
    // Always recreate to ensure latest language
    createRecognition();
    if (recognitionRef.current && !isListening) {
      setTranscript("");
      setIsListening(true);
      recognitionRef.current.start();
    }
  }, [isListening, createRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return { isListening, transcript, startListening, stopListening, isSupported, setLanguage };
}
