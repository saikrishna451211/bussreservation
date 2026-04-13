import { X, Star, Clock, MapPin, Wifi, Zap, Shield, Users, Bus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Schedule } from "@/types/bus";

interface BusDetailModalProps {
  schedule: Schedule;
  onClose: () => void;
  onSelectSeats: () => void;
}

// Simulated stops based on route
function generateStops(fromCity: string, toCity: string, departureTime: string, arrivalTime: string, durationHours: number) {
  type StopType = "departure" | "stop" | "arrival";
  const stops: { name: string; time: string; type: StopType }[] = [
    { name: fromCity, time: departureTime?.slice(0, 5), type: "departure" },
  ];

  const midStops = [
    "Highway Rest Stop",
    "Food Court Junction",
    "Service Point",
  ];

  const depMinutes = parseInt(departureTime?.slice(0, 2) || "0") * 60 + parseInt(departureTime?.slice(3, 5) || "0");
  const intervalMinutes = (durationHours * 60) / (midStops.length + 1);

  midStops.forEach((stop, i) => {
    const stopMinutes = depMinutes + intervalMinutes * (i + 1);
    const h = Math.floor(stopMinutes / 60) % 24;
    const m = Math.floor(stopMinutes % 60);
    stops.push({
      name: stop,
      time: `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
      type: "stop",
    });
  });

  stops.push({ name: toCity, time: arrivalTime?.slice(0, 5), type: "arrival" });
  return stops;
}

// Simulated reviews
const reviews = [
  { name: "Rahul M.", rating: 5, text: "Very comfortable journey, on time arrival!" },
  { name: "Priya S.", rating: 4, text: "Good bus, clean seats. AC was perfect." },
  { name: "Kiran R.", rating: 4, text: "Nice experience, driver was careful." },
  { name: "Anita K.", rating: 5, text: "Best bus service, will book again!" },
];

export function BusDetailModal({ schedule, onClose, onSelectSeats }: BusDetailModalProps) {
  const { t } = useLanguage();
  const bus = (schedule as any).bus;
  const route = (schedule as any).route;
  const fromCity = route?.from_city?.name || "Origin";
  const toCity = route?.to_city?.name || "Destination";

  const stops = generateStops(fromCity, toCity, schedule.departure_time, schedule.arrival_time, schedule.duration_hours);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-in slide-in-from-bottom-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">{bus?.name}</h3>
              <p className="text-sm text-muted-foreground">{bus?.operator} • {bus?.bus_type}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Quick Info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-secondary/50 p-3 text-center">
              <Clock className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">{t("filter.duration")}</p>
              <p className="font-semibold text-sm">{schedule.duration_hours}h</p>
            </div>
            <div className="rounded-xl bg-secondary/50 p-3 text-center">
              <Users className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">{t("results.seatsLeft")}</p>
              <p className="font-semibold text-sm">{schedule.available_seats}</p>
            </div>
            <div className="rounded-xl bg-secondary/50 p-3 text-center">
              <Star className="h-4 w-4 text-accent mx-auto mb-1 fill-accent" />
              <p className="text-xs text-muted-foreground">{t("filter.rating")}</p>
              <p className="font-semibold text-sm">{bus?.rating || "4.0"}</p>
            </div>
          </div>

          {/* Amenities */}
          {bus?.amenities?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">{t("busDetail.amenities")}</h4>
              <div className="flex flex-wrap gap-2">
                {bus.amenities.map((a: string) => (
                  <span key={a} className="inline-flex items-center gap-1.5 rounded-lg bg-primary/5 border border-primary/10 px-3 py-1.5 text-xs font-medium">
                    {a === "WiFi" && <Wifi className="h-3.5 w-3.5 text-primary" />}
                    {a === "Charging Point" && <Zap className="h-3.5 w-3.5 text-accent" />}
                    {a === "Blanket" && "🛏️"}
                    {a === "Water Bottle" && "💧"}
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Route & Stops */}
          <div>
            <h4 className="text-sm font-semibold mb-3">{t("busDetail.routeStops")}</h4>
            <div className="relative pl-6">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
              {stops.map((stop, i) => (
                <div key={i} className="relative flex items-start gap-3 pb-4 last:pb-0">
                  <div className={`absolute left-[-13px] h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                    stop.type === "departure" ? "border-primary bg-primary" :
                    stop.type === "arrival" ? "border-success bg-success" :
                    "border-border bg-card"
                  }`}>
                    {stop.type === "departure" || stop.type === "arrival" ? (
                      <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className={`text-sm ${stop.type !== "stop" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      {stop.name}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">{stop.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div>
            <h4 className="text-sm font-semibold mb-3">{t("busDetail.reviews")}</h4>
            <div className="space-y-2.5">
              {reviews.map((review, i) => (
                <div key={i} className="rounded-xl bg-secondary/40 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{review.name}</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={`h-3 w-3 ${j < review.rating ? "fill-accent text-accent" : "text-border"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <p className="font-display text-2xl font-bold text-foreground">₹{schedule.price}</p>
            <p className="text-xs text-muted-foreground">per seat</p>
          </div>
          <Button onClick={onSelectSeats} className="bg-primary hover:bg-primary/90 gap-2" data-gaze-target="select-seats">
            {t("results.selectSeats")}
          </Button>
        </div>
      </div>
    </div>
  );
}
