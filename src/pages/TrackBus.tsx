import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, MapPin, Clock, Bus, CheckCircle, AlertTriangle, Calendar, Navigation, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTTS } from "@/contexts/TTSContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";

interface TrackingData {
  booking: any;
  progress: number;
  status: string;
  eta: string;
  currentSpeed: number;
  distanceCovered: number;
  totalDistance: number;
}

export default function TrackBus() {
  const { t } = useLanguage();
  const { speak } = useTTS();
  const navigate = useNavigate();
  const [refCode, setRefCode] = useState("");
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-refresh tracking every 30s
  useEffect(() => {
    if (!tracking) return;
    const interval = setInterval(() => {
      handleTrack(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [tracking, refCode]);

  const handleTrack = async (silent = false) => {
    if (!refCode.trim()) return;
    if (!silent) setLoading(true);
    setError("");
    if (!silent) setTracking(null);
    try {
      const { data, error: err } = await supabase
        .from("bookings")
        .select(`*, schedule:schedules(*, bus:buses(*), route:routes(*, from_city:cities!routes_from_city_id_fkey(*), to_city:cities!routes_to_city_id_fkey(*)))`)
        .eq("booking_ref", refCode.trim().toUpperCase())
        .single();

      if (err || !data) {
        if (!silent) {
          setError(t("track.notFound"));
          speak(t("track.notFound"));
        }
        return;
      }

      const today = format(new Date(), "yyyy-MM-dd");
      if (data.travel_date !== today) {
        if (!silent) {
          setError(t("track.notToday"));
          speak(t("track.notToday"));
        }
        return;
      }

      const now = new Date();
      const depTime = data.schedule?.departure_time;
      if (depTime) {
        const [h, m] = depTime.split(":").map(Number);
        const depDate = new Date();
        depDate.setHours(h, m, 0, 0);
        if (now < depDate) {
          const msg = `${t("track.notDeparted")} ${depTime.slice(0, 5)}`;
          if (!silent) {
            setError(msg);
            speak(msg);
          }
          return;
        }
      }

      const arrTime = data.schedule?.arrival_time;
      const durationH = data.schedule?.duration_hours || 6;
      const totalDist = data.schedule?.route?.distance_km || 350;
      let progress = 50;

      if (depTime && arrTime) {
        const [dh, dm] = depTime.split(":").map(Number);
        const depMs = dh * 60 + dm;
        const nowMs = now.getHours() * 60 + now.getMinutes();
        const totalMs = durationH * 60;
        progress = Math.min(98, Math.max(2, Math.round(((nowMs - depMs) / totalMs) * 100)));
      }

      const remainingH = Math.round(durationH * (1 - progress / 100) * 10) / 10;
      const distCovered = Math.round(totalDist * progress / 100);
      const speed = Math.round(40 + Math.random() * 30); // Simulated 40-70 km/h

      const trackData: TrackingData = {
        booking: data,
        progress,
        status: progress > 90 ? "arriving" : progress > 50 ? "on_route" : "departed",
        eta: `${remainingH}h`,
        currentSpeed: speed,
        distanceCovered: distCovered,
        totalDistance: totalDist,
      };

      setTracking(trackData);

      if (!silent) {
        const busName = data.schedule?.bus?.name || "";
        speak(`${busName} ${t("track.onTime")}. ${progress}% ${t("track.eta")} ${remainingH} ${t("common.hours")}`);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const stops = tracking ? [
    { name: tracking.booking.schedule?.route?.from_city?.name || "Origin", time: tracking.booking.schedule?.departure_time?.slice(0, 5), done: true },
    { name: "Stop 1", time: null, done: (tracking.progress || 0) > 25 },
    { name: "Stop 2", time: null, done: (tracking.progress || 0) > 50 },
    { name: "Stop 3", time: null, done: (tracking.progress || 0) > 75 },
    { name: tracking.booking.schedule?.route?.to_city?.name || "Destination", time: tracking.booking.schedule?.arrival_time?.slice(0, 5), done: (tracking.progress || 0) > 95 },
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      <Header onVoiceOpen={() => {}} />
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/")} className="rounded-xl p-2 hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-2xl font-bold">{t("track.title")}</h1>
        </div>

        {/* Search */}
        <div className="bg-card rounded-2xl p-5 mb-6 shadow-lg border border-border/50">
          <div className="flex gap-2">
            <Input
              placeholder={t("track.enterRef")}
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
              className="bg-background font-mono rounded-xl h-12"
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
            />
            <Button onClick={() => handleTrack()} disabled={loading} className="bg-primary hover:bg-primary/90 h-12 px-5 rounded-xl">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          {error && (
            <div className="flex items-center gap-2 mt-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        {/* Tracking Result */}
        {tracking && (
          <div className="space-y-4 animate-in slide-in-from-bottom-4">
            {/* Bus Info Card */}
            <div className="bg-card rounded-2xl p-5 shadow-lg border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-display font-bold text-lg text-foreground">{tracking.booking.schedule?.bus?.name}</p>
                  <p className="text-sm text-muted-foreground">{tracking.booking.schedule?.bus?.bus_type}</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
                  tracking.status === "arriving"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-primary/10 text-primary"
                }`}>
                  {tracking.status === "arriving" ? t("track.arriving") : t("track.onTime")}
                </div>
              </div>

              {/* Live stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <Navigation className="h-4 w-4 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{tracking.currentSpeed}</p>
                  <p className="text-[10px] text-muted-foreground">km/h</p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <MapPin className="h-4 w-4 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{tracking.distanceCovered}</p>
                  <p className="text-[10px] text-muted-foreground">/{tracking.totalDistance} km</p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <Clock className="h-4 w-4 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{tracking.eta}</p>
                  <p className="text-[10px] text-muted-foreground">ETA</p>
                </div>
              </div>
            </div>

            {/* Route Progress */}
            <div className="bg-card rounded-2xl p-5 shadow-lg border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <span className="font-display font-semibold text-foreground">
                  {tracking.booking.schedule?.route?.from_city?.name} → {tracking.booking.schedule?.route?.to_city?.name}
                </span>
                <span className="text-sm text-primary font-bold bg-primary/10 px-3 py-1 rounded-full">{tracking.progress}%</span>
              </div>

              {/* Progress bar with bus */}
              <div className="relative mb-6">
                <div className="h-2 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-primary/60 transition-all duration-1000"
                    style={{ width: `${tracking.progress}%` }}
                  />
                </div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000"
                  style={{ left: `calc(${tracking.progress}% - 16px)` }}
                >
                  <div className="h-8 w-8 rounded-full bg-primary border-3 border-primary-foreground shadow-xl flex items-center justify-center animate-pulse">
                    <Bus className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              </div>

              {/* Timeline Stops */}
              <div className="relative pl-6">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
                {stops.map((stop, i) => (
                  <div key={i} className="relative flex items-start gap-4 pb-5 last:pb-0">
                    <div className={`absolute left-[-13px] h-6 w-6 rounded-full flex items-center justify-center z-10 ${
                      stop.done
                        ? "bg-green-500 text-white shadow-md shadow-green-500/30"
                        : "bg-card border-2 border-border text-muted-foreground"
                    }`}>
                      {stop.done ? (
                        <CheckCircle className="h-3.5 w-3.5" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${stop.done ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                        {stop.name}
                      </p>
                      {stop.time && (
                        <p className="text-xs text-muted-foreground mt-0.5">{stop.time}</p>
                      )}
                    </div>
                    {i === stops.length - 1 && !stop.done && (
                      <span className="text-xs text-primary font-semibold flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
                        <Clock className="h-3 w-3" />
                        {tracking.eta}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Auto refresh notice */}
            <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Auto-refreshes every 30s
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
