import { Star, Clock, Wifi, Zap, MapPin, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Schedule } from "@/types/bus";

interface BusResultsProps {
  results: Schedule[];
  fromCity: string;
  toCity: string;
  onBook: (schedule: Schedule) => void;
  onViewDetails: (schedule: Schedule) => void;
}

export function BusResults({ results, fromCity, toCity, onBook, onViewDetails }: BusResultsProps) {
  const { t } = useLanguage();
  if (results.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl font-semibold">
          {fromCity} → {toCity}
        </h2>
        <span className="rounded-full bg-primary/10 px-3 py-0.5 text-sm font-medium text-primary">
          {results.length} {results.length > 1 ? t("results.buses") : t("results.bus")}
        </span>
      </div>

      <div className="space-y-3">
        {results.map((schedule: any) => (
          <div
            key={schedule.id}
            className="glass-card rounded-xl p-4 transition-all hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
            onClick={() => onViewDetails(schedule)}
            data-gaze-target={`bus-${schedule.id}`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-semibold text-foreground">
                    {schedule.bus?.name}
                  </h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    schedule.bus?.bus_type?.includes("AC") && !schedule.bus?.bus_type?.includes("Non")
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-secondary-foreground"
                  }`}>
                    {schedule.bus?.bus_type}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {schedule.bus?.operator}
                </p>

                <div className="mt-2 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-foreground font-medium">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {schedule.departure_time?.slice(0, 5)} - {schedule.arrival_time?.slice(0, 5)}
                  </div>
                  <span className="text-muted-foreground">
                    {schedule.duration_hours}h
                  </span>
                  {schedule.bus?.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                      <span className="font-medium">{schedule.bus.rating}</span>
                    </div>
                  )}
                </div>

                {schedule.bus?.amenities?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {schedule.bus.amenities.map((a: string) => (
                      <span
                        key={a}
                        className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {a === "WiFi" && <Wifi className="h-3 w-3" />}
                        {a === "Charging Point" && <Zap className="h-3 w-3" />}
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                <div className="text-right">
                  <p className="font-display text-2xl font-bold text-foreground">
                    ₹{schedule.price}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {schedule.available_seats} {t("results.seatsLeft")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onViewDetails(schedule); }}
                    className="gap-1"
                    data-gaze-target={`details-${schedule.id}`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {t("busDetail.viewDetails")}
                  </Button>
                  <Button
                    onClick={(e) => { e.stopPropagation(); onBook(schedule); }}
                    className="bg-primary hover:bg-primary/90"
                    data-gaze-target={`book-${schedule.id}`}
                  >
                    {t("results.selectSeats")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
