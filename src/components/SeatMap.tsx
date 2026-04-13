import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTTS } from "@/contexts/TTSContext";
import type { Schedule } from "@/types/bus";

interface SeatMapProps {
  schedule: Schedule;
  onClose: () => void;
  onContinue: (seats: string[]) => void;
}

type SeatStatus = "available" | "booked" | "ladies" | "selected";

interface Seat {
  id: string;
  row: number;
  col: number;
  status: SeatStatus;
  price: number;
  type: "seater" | "sleeper";
}

function generateSeats(totalSeats: number, busType: string): Seat[] {
  const seats: Seat[] = [];
  const isSleeper = busType.toLowerCase().includes("sleeper");
  const cols = isSleeper ? 4 : 5;
  const rows = Math.ceil(totalSeats / cols);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seatNum = r * cols + c + 1;
      if (seatNum > totalSeats) break;

      let status: SeatStatus = "available";
      if (seatNum % 7 === 0) status = "booked";
      if (seatNum % 11 === 0) status = "ladies";

      seats.push({
        id: `${isSleeper ? "B" : "S"}${seatNum}`,
        row: r,
        col: c,
        status,
        price: 0,
        type: isSleeper ? "sleeper" : "seater",
      });
    }
  }
  return seats;
}

// SVG seat icon
function SeaterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor">
      <rect x="6" y="4" width="20" height="4" rx="2" opacity="0.6" />
      <rect x="8" y="8" width="16" height="14" rx="2" />
      <rect x="5" y="12" width="3" height="8" rx="1.5" opacity="0.5" />
      <rect x="24" y="12" width="3" height="8" rx="1.5" opacity="0.5" />
      <rect x="8" y="22" width="6" height="3" rx="1" opacity="0.4" />
      <rect x="18" y="22" width="6" height="3" rx="1" opacity="0.4" />
    </svg>
  );
}

// SVG sleeper/bed icon
function SleeperIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 24" className={className} fill="currentColor">
      <rect x="1" y="2" width="46" height="20" rx="3" opacity="0.3" />
      <rect x="2" y="3" width="44" height="14" rx="2" />
      <ellipse cx="10" cy="10" rx="4" ry="3" opacity="0.5" />
      <rect x="2" y="17" width="10" height="3" rx="1" opacity="0.4" />
      <rect x="36" y="17" width="10" height="3" rx="1" opacity="0.4" />
    </svg>
  );
}

export function SeatMap({ schedule, onClose, onContinue }: SeatMapProps) {
  const { t } = useLanguage();
  const { speak } = useTTS();
  const busType = (schedule as any).bus?.bus_type || "Seater";
  const totalSeats = (schedule as any).bus?.total_seats || 40;
  const price = schedule.price;
  const isSleeper = busType.toLowerCase().includes("sleeper");

  const [seats] = useState(() => generateSeats(totalSeats, busType));
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  const cols = isSleeper ? 4 : 5;
  const aisleAfter = 2;

  const toggleSeat = (seatId: string) => {
    const seat = seats.find((s) => s.id === seatId);
    if (!seat || seat.status === "booked") return;

    setSelectedSeats((prev) => {
      const isSelected = prev.includes(seatId);
      const next = isSelected ? prev.filter((s) => s !== seatId) : [...prev, seatId];
      speak(isSelected ? `${seatId} ${t("seat.deselected")}` : `${seatId} ${t("seat.selected")}`);
      return next;
    });
  };

  const getSeatColor = (seat: Seat) => {
    if (selectedSeats.includes(seat.id)) return "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30";
    if (seat.status === "booked") return "bg-muted text-muted-foreground border-muted cursor-not-allowed opacity-50";
    if (seat.status === "ladies") return "bg-pink-100 text-pink-700 border-pink-300 hover:bg-pink-200";
    return "bg-card text-foreground border-border hover:border-primary hover:bg-primary/5 cursor-pointer";
  };

  const rows = Math.ceil(seats.length / cols);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-gradient-to-r from-primary/5 to-transparent">
          <div>
            <h3 className="font-display font-semibold text-foreground">{(schedule as any).bus?.name}</h3>
            <p className="text-sm text-muted-foreground">{busType} • ₹{price}/{isSleeper ? "berth" : "seat"}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-border text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded border border-border bg-card" />
            <span>{t("seat.available")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded border border-primary bg-primary" />
            <span>{t("seat.selected")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded border border-muted bg-muted opacity-50" />
            <span>{t("seat.booked")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded border border-pink-300 bg-pink-100" />
            <span>{t("seat.ladies")}</span>
          </div>
        </div>

        {/* Seat Grid */}
        <div className="p-5 overflow-auto max-h-[50vh]">
          {/* Driver */}
          <div className="flex justify-end mb-4">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-lg">
              🚍
            </div>
          </div>

          <div className="space-y-2">
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <div key={rowIdx} className="flex items-center justify-center gap-1.5">
                {Array.from({ length: cols }).map((_, colIdx) => {
                  const seatIdx = rowIdx * cols + colIdx;
                  const seat = seats[seatIdx];
                  if (!seat)
                    return (
                      <div
                        key={colIdx}
                        className={isSleeper ? "w-20 h-12" : "w-11 h-11"}
                      />
                    );

                  return (
                    <div key={seat.id} className="flex items-center">
                      <button
                        onClick={() => toggleSeat(seat.id)}
                        disabled={seat.status === "booked"}
                        className={`relative ${isSleeper ? "w-20 h-12" : "w-11 h-11"} rounded-lg border-2 text-xs font-semibold transition-all ${getSeatColor(seat)}`}
                        title={seat.id}
                      >
                        {isSleeper ? (
                          <SleeperIcon className="absolute inset-1 w-[calc(100%-8px)] h-[calc(100%-8px)]" />
                        ) : (
                          <SeaterIcon className="absolute inset-1 w-[calc(100%-8px)] h-[calc(100%-8px)]" />
                        )}
                        <span className="relative z-10 text-[10px] font-bold">{seat.id}</span>
                      </button>
                      {colIdx === aisleAfter - 1 && <div className="w-5" />}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-4 flex items-center justify-between bg-gradient-to-r from-transparent to-primary/5">
          <div>
            <p className="text-sm text-muted-foreground">
              {selectedSeats.length} {t("booking.seats")} • <span className="font-semibold text-foreground">₹{selectedSeats.length * price}</span>
            </p>
            {selectedSeats.length > 0 && (
              <p className="text-xs text-muted-foreground">{selectedSeats.join(", ")}</p>
            )}
          </div>
          <Button
            onClick={() => {
              speak(t("seat.continue"));
              onContinue(selectedSeats);
            }}
            disabled={selectedSeats.length === 0}
            className="bg-primary hover:bg-primary/90"
          >
            {t("seat.continue")}
          </Button>
        </div>
      </div>
    </div>
  );
}
