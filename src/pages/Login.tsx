import { useState } from "react";
import { Bus, Mail, Phone, Globe, ArrowRight, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { languageNames, type Language } from "@/i18n/translations";

type AuthMode = "language" | "method" | "email-login" | "email-signup" | "phone-login" | "verify-email-otp" | "verify-phone-otp";

export default function Login() {
  const { lang, setLang, t } = useLanguage();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>("language");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");

  const languages: Language[] = ["en", "hi", "te", "ml", "kn", "ta"];
  const langFlags: Record<Language, string> = {
    en: "🇬🇧", hi: "🇮🇳", te: "🇮🇳", ml: "🇮🇳", kn: "🇮🇳", ta: "🇮🇳",
  };

  const handleLanguageSelect = (l: Language) => {
    setLang(l);
    setMode("method");
  };

  const handleEmailSignup = async () => {
    if (!email || !password || !fullName) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone } },
      });
      if (error) throw error;
      // Show OTP verification screen
      setPendingEmail(email);
      setOtp("");
      setMode("verify-email-otp");
      toast({ title: t("auth.otpSent"), description: email });
    } catch (err: any) {
      toast({ variant: "destructive", title: t("common.error"), description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (otp.length < 6) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: otp,
        type: "signup",
      });
      if (error) throw error;
      // Update profile with phone and language
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({
          phone,
          preferred_language: lang,
          full_name: fullName,
        }).eq("id", user.id);
      }
      toast({ title: t("pay.success"), description: "Welcome to BusBuddy!" });
    } catch (err: any) {
      toast({ variant: "destructive", title: t("common.error"), description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      toast({ variant: "destructive", title: t("common.error"), description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneOtpSend = async () => {
    if (!phone) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      setPendingPhone(phone);
      setOtp("");
      setMode("verify-phone-otp");
      toast({ title: t("auth.otpSent"), description: phone });
    } catch (err: any) {
      toast({ variant: "destructive", title: t("common.error"), description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (otp.length < 6) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: pendingPhone,
        token: otp,
        type: "sms",
      });
      if (error) throw error;
    } catch (err: any) {
      toast({ variant: "destructive", title: t("common.error"), description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/80 shadow-xl shadow-primary/25 mb-4">
            <Bus className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl font-bold text-foreground tracking-tight">BusBuddy</h1>
          <p className="text-muted-foreground mt-2 text-base">{t("auth.subtitle")}</p>
        </div>

        <div className="bg-card rounded-3xl p-7 shadow-xl border border-border/50 space-y-6">
          {/* Language Selection */}
          {mode === "language" && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-semibold text-center flex items-center justify-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                {t("auth.chooseLanguage")}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {languages.map((l) => (
                  <button
                    key={l}
                    onClick={() => handleLanguageSelect(l)}
                    className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md ${
                      lang === l ? "border-primary bg-primary/10 shadow-md" : "border-border"
                    }`}
                  >
                    <span className="text-2xl">{langFlags[l]}</span>
                    <span className="font-medium text-foreground">{languageNames[l]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Auth Method Selection */}
          {mode === "method" && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-center">{t("auth.welcome")}</h2>
              <Button
                onClick={() => setMode("email-login")}
                className="w-full h-14 text-base gap-3 bg-primary hover:bg-primary/90 rounded-xl"
              >
                <Mail className="h-5 w-5" />
                {t("auth.loginWithEmail")}
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
              <Button
                onClick={() => setMode("phone-login")}
                variant="outline"
                className="w-full h-14 text-base gap-3 rounded-xl"
              >
                <Phone className="h-5 w-5" />
                {t("auth.loginWithPhone")}
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
              <div className="text-center">
                <button onClick={() => setMode("language")} className="text-sm text-primary hover:underline flex items-center gap-1 mx-auto">
                  <Globe className="h-3.5 w-3.5" />
                  {languageNames[lang]}
                </button>
              </div>
            </div>
          )}

          {/* Email Login */}
          {mode === "email-login" && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-center">{t("auth.login")}</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{t("auth.email")}</label>
                  <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-background rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{t("auth.password")}</label>
                  <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-background rounded-xl" />
                </div>
              </div>
              <Button onClick={handleEmailLogin} disabled={loading || !email || !password} className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("auth.login")}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {t("auth.noAccount")}{" "}
                <button onClick={() => setMode("email-signup")} className="text-primary font-medium hover:underline">{t("auth.signup")}</button>
              </p>
              <button onClick={() => setMode("method")} className="text-sm text-muted-foreground hover:text-foreground block mx-auto">{t("common.back")}</button>
            </div>
          )}

          {/* Phone Login */}
          {mode === "phone-login" && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-center">{t("auth.loginWithPhone")}</h2>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">{t("auth.phone")}</label>
                <Input type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 bg-background rounded-xl" />
              </div>
              <Button onClick={handlePhoneOtpSend} disabled={loading || !phone} className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{t("auth.sendOtp")} <ArrowRight className="h-4 w-4 ml-2" /></>}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {t("auth.noAccount")}{" "}
                <button onClick={() => setMode("email-signup")} className="text-primary font-medium hover:underline">{t("auth.signup")}</button>
              </p>
              <button onClick={() => setMode("method")} className="text-sm text-muted-foreground hover:text-foreground block mx-auto">{t("common.back")}</button>
            </div>
          )}

          {/* Email Signup */}
          {mode === "email-signup" && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-center">{t("auth.signup")}</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{t("auth.fullName")}</label>
                  <Input placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12 bg-background rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{t("auth.email")}</label>
                  <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-background rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{t("auth.phone")}</label>
                  <Input type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 bg-background rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{t("auth.password")}</label>
                  <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-background rounded-xl" />
                </div>
              </div>
              <Button onClick={handleEmailSignup} disabled={loading || !email || !password || !fullName} className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("auth.signup")}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {t("auth.hasAccount")}{" "}
                <button onClick={() => setMode("email-login")} className="text-primary font-medium hover:underline">{t("auth.login")}</button>
              </p>
              <button onClick={() => setMode("method")} className="text-sm text-muted-foreground hover:text-foreground block mx-auto">{t("common.back")}</button>
            </div>
          )}

          {/* Verify Email OTP */}
          {mode === "verify-email-otp" && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-3">
                  <KeyRound className="h-7 w-7 text-primary" />
                </div>
                <h2 className="font-display text-xl font-semibold">{t("auth.verifyOtp")}</h2>
                <p className="text-sm text-muted-foreground mt-1">{t("auth.enterOtp")}</p>
                <p className="text-sm text-primary font-medium mt-1">{pendingEmail}</p>
              </div>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button onClick={handleVerifyEmailOtp} disabled={loading || otp.length < 6} className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("auth.verifyOtp")}
              </Button>
              <button onClick={() => setMode("email-signup")} className="text-sm text-muted-foreground hover:text-foreground block mx-auto">{t("common.back")}</button>
            </div>
          )}

          {/* Verify Phone OTP */}
          {mode === "verify-phone-otp" && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-3">
                  <Phone className="h-7 w-7 text-primary" />
                </div>
                <h2 className="font-display text-xl font-semibold">{t("auth.verifyOtp")}</h2>
                <p className="text-sm text-muted-foreground mt-1">{t("auth.otpSentPhone")}</p>
                <p className="text-sm text-primary font-medium mt-1">{pendingPhone}</p>
              </div>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button onClick={handleVerifyPhoneOtp} disabled={loading || otp.length < 6} className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("auth.verifyOtp")}
              </Button>
              <button onClick={() => setMode("phone-login")} className="text-sm text-muted-foreground hover:text-foreground block mx-auto">{t("common.back")}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
