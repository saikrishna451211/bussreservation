import { useState, useEffect, useCallback, useRef } from "react";
import { X, Mic, MicOff, Loader2, MapPin, Calendar, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { parseVoiceIntent, searchBuses } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTTS } from "@/contexts/TTSContext";
import type { VoiceIntent, Schedule } from "@/types/bus";

interface Message {
  role: "user" | "assistant";
  text: string;
  intent?: VoiceIntent;
}

interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  cities: string[];
  onSearchResults: (results: Schedule[], from: string, to: string) => void;
}

export function VoiceAssistant({ isOpen, onClose, cities, onSearchResults }: VoiceAssistantProps) {
  const { t, lang } = useLanguage();
  const { speak } = useTTS();
  const { isListening, transcript, startListening, stopListening, isSupported, setLanguage } = useSpeechRecognition();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const lastProcessedRef = useRef<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasGreetedRef = useRef(false);

  // Set speech recognition language when lang changes
  useEffect(() => {
    const langMap: Record<string, string> = {
      en: "en-IN", hi: "hi-IN", te: "te-IN", ml: "ml-IN", kn: "kn-IN", ta: "ta-IN",
    };
    setLanguage(langMap[lang] || "en-IN");
  }, [lang, setLanguage]);

  // Set greeting on open
  useEffect(() => {
    if (isOpen && !hasGreetedRef.current) {
      hasGreetedRef.current = true;
      const greeting = t("voice.greeting");
      setMessages([{ role: "assistant", text: greeting }]);
      // Delay speak slightly to let the modal render
      setTimeout(() => speak(greeting), 300);
    }
    if (!isOpen) {
      hasGreetedRef.current = false;
      lastProcessedRef.current = "";
    }
  }, [isOpen, t, speak]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const processTranscript = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setMessages((prev) => [...prev, { role: "user", text }]);
      setIsProcessing(true);

      try {
        const intent = await parseVoiceIntent(text, cities, lang);
        setMessages((prev) => [...prev, { role: "assistant", text: intent.response, intent }]);
        speak(intent.response);

        if ((intent.intent === "search" || intent.intent === "book") && intent.from_city && intent.to_city) {
          const results = await searchBuses(intent.from_city, intent.to_city);
          if (results.length > 0) {
            onSearchResults(results, intent.from_city, intent.to_city);
            const foundMsg = t("voice.foundBuses")
              .replace("{count}", String(results.length))
              .replace("{from}", intent.from_city)
              .replace("{to}", intent.to_city);
            setMessages((prev) => [...prev, { role: "assistant", text: foundMsg }]);
            speak(foundMsg);
            setTimeout(() => onClose(), 2000);
          } else {
            const noMsg = t("voice.noBusesRoute")
              .replace("{from}", intent.from_city)
              .replace("{to}", intent.to_city);
            setMessages((prev) => [...prev, { role: "assistant", text: noMsg }]);
            speak(noMsg);
          }
        }
      } catch (err) {
        console.error("Voice intent error:", err);
        const errMsg = t("common.error");
        setMessages((prev) => [...prev, { role: "assistant", text: errMsg }]);
        speak(errMsg);
      } finally {
        setIsProcessing(false);
      }
    },
    [cities, onSearchResults, onClose, lang, speak, t]
  );

  // Process transcript when listening stops
  useEffect(() => {
    if (transcript && !isListening && !isProcessing && transcript !== lastProcessedRef.current) {
      lastProcessedRef.current = transcript;
      processTranscript(transcript);
    }
  }, [transcript, isListening, isProcessing, processTranscript]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-card shadow-2xl border border-border overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
            <h2 className="font-display text-lg font-semibold">{t("voice.title")}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto px-5 py-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-secondary text-secondary-foreground rounded-bl-md"
              }`}>
                {msg.text}
                {msg.role === "assistant" && (
                  <button onClick={() => speak(msg.text)} className="ml-2 inline-flex opacity-60 hover:opacity-100">
                    <Volume2 className="h-3 w-3" />
                  </button>
                )}
                {msg.intent?.from_city && msg.intent?.to_city && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-card/50 px-2.5 py-1 text-xs font-medium">
                      <MapPin className="h-3 w-3" /> {msg.intent.from_city}
                    </span>
                    <span className="text-xs self-center">→</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-card/50 px-2.5 py-1 text-xs font-medium">
                      <MapPin className="h-3 w-3" /> {msg.intent.to_city}
                    </span>
                    {msg.intent.date && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-card/50 px-2.5 py-1 text-xs font-medium">
                        <Calendar className="h-3 w-3" /> {msg.intent.date}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-secondary px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border px-5 py-5 flex flex-col items-center gap-3">
          {!isSupported ? (
            <p className="text-sm text-muted-foreground">{t("voice.notSupported")}</p>
          ) : (
            <>
              <div className="relative">
                {isListening && (
                  <div className="absolute -inset-2 rounded-full bg-primary/20 animate-ping" />
                )}
                <Button
                  size="lg"
                  onClick={isListening ? stopListening : startListening}
                  disabled={isProcessing}
                  className={`h-16 w-16 rounded-full relative z-10 ${
                    isListening ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {isListening ? t("voice.listening") : isProcessing ? t("voice.processing") : t("voice.tapToSpeak")}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
