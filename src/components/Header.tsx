import { Bus, Mic, LogOut, Globe, Menu, X, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTTS } from "@/contexts/TTSContext";
import { languageNames, type Language } from "@/i18n/translations";
import { Link } from "react-router-dom";
import { useState } from "react";
import { LiveClock } from "@/components/LiveClock";

interface HeaderProps {
  onVoiceOpen: () => void;
}

export function Header({ onVoiceOpen }: HeaderProps) {
  const { signOut, user } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const { speak } = useTTS();
  const [menuOpen, setMenuOpen] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const navLinks = [
    { to: "/", label: t("nav.home") },
    { to: "/bookings", label: t("nav.myBookings") },
    { to: "/track", label: t("nav.trackBus") },
    { to: "/offers", label: t("nav.offers") },
  ];

  const handleNavClick = (label: string) => {
    if (ttsEnabled) speak(label);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 glass-card border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2" onClick={() => ttsEnabled && speak("BusBuddy " + t("nav.home"))}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Bus className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">BusBuddy</span>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => handleNavClick(link.label)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Live Clock */}
          <LiveClock />

          {/* Language switcher */}
          <select
            value={lang}
            onChange={(e) => {
              setLang(e.target.value as Language);
              if (ttsEnabled) speak(languageNames[e.target.value as Language]);
            }}
            className="hidden sm:block rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
          >
            {(Object.keys(languageNames) as Language[]).map((l) => (
              <option key={l} value={l}>{languageNames[l]}</option>
            ))}
          </select>

          {/* TTS toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className="text-muted-foreground"
            title={ttsEnabled ? "Mute narration" : "Enable narration"}
          >
            {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>

          <Button onClick={() => { onVoiceOpen(); if (ttsEnabled) speak(t("voice.title")); }} size="sm" className="gap-2 bg-primary hover:bg-primary/90">
            <Mic className="h-4 w-4" />
            <span className="hidden sm:inline">{t("voice.title")}</span>
          </Button>

          <Button onClick={signOut} variant="ghost" size="sm" className="text-muted-foreground">
            <LogOut className="h-4 w-4" />
          </Button>

          {/* Mobile menu */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden rounded-lg p-2 hover:bg-secondary">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => handleNavClick(link.label)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
            >
              {link.label}
            </Link>
          ))}
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Language)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {(Object.keys(languageNames) as Language[]).map((l) => (
              <option key={l} value={l}>{languageNames[l]}</option>
            ))}
          </select>
        </div>
      )}
    </header>
  );
}
