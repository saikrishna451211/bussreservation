import { X, Bus, MapPin, Calendar, Clock, User, Mail, Phone, CreditCard, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateCity } from "@/i18n/translations";

interface TicketModalProps {
  booking: any;
  onClose: () => void;
}

export function TicketModal({ booking, onClose }: TicketModalProps) {
  const { t, lang } = useLanguage();

  const schedule = booking.schedule;
  const bus = schedule?.bus;
  const route = schedule?.route;
  const fromCity = translateCity(route?.from_city?.name || "", lang);
  const toCity = translateCity(route?.to_city?.name || "", lang);
  const baseFare = Math.round(booking.total_amount / 1.05);
  const gst = booking.total_amount - baseFare;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-primary px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary-foreground">
            <Ticket className="h-5 w-5" />
            <h2 className="font-display text-lg font-bold">{t("booking.ticket")}</h2>
          </div>
          <button onClick={onClose} className="text-primary-foreground/80 hover:text-primary-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Booking Ref */}
        <div className="px-5 py-3 border-b border-dashed border-border bg-secondary/30 text-center">
          <p className="text-xs text-muted-foreground">{t("booking.ref")}</p>
          <p className="font-mono text-xl font-bold text-primary">{booking.booking_ref}</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            booking.status === "confirmed"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}>
            {booking.status === "confirmed" ? t("booking.confirmed") : t("booking.cancelled")}
          </span>
        </div>

        {/* Route & Time */}
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-xs text-muted-foreground">{t("booking.departure")}</p>
              <p className="text-lg font-bold text-foreground">{schedule?.departure_time?.slice(0, 5)}</p>
              <p className="text-sm font-medium text-foreground">{fromCity}</p>
            </div>
            <div className="flex flex-col items-center px-3">
              <div className="flex items-center gap-1 text-muted-foreground">
                <div className="h-px w-8 bg-border" />
                <Bus className="h-4 w-4 text-primary" />
                <div className="h-px w-8 bg-border" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{schedule?.duration_hours}h</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-xs text-muted-foreground">{t("booking.arrival")}</p>
              <p className="text-lg font-bold text-foreground">{schedule?.arrival_time?.slice(0, 5)}</p>
              <p className="text-sm font-medium text-foreground">{toCity}</p>
            </div>
          </div>

          {/* Bus & Date */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Bus className="h-3.5 w-3.5 text-primary" />
              <div>
                <p className="font-medium text-foreground">{bus?.name}</p>
                <p className="text-xs text-muted-foreground">{bus?.bus_type}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <div>
                <p className="font-medium text-foreground">{booking.travel_date}</p>
                <p className="text-xs text-muted-foreground">{booking.seats_booked} {t("booking.seats")}</p>
              </div>
            </div>
          </div>

          {/* Operator */}
          <div className="text-xs text-muted-foreground">
            {t("booking.operator")}: <span className="text-foreground font-medium">{bus?.operator}</span>
          </div>
        </div>

        {/* Passenger Details */}
        <div className="px-5 py-3 border-t border-border bg-secondary/20 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">{t("booking.passenger")}</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-foreground">{booking.passenger_name}</span>
            </div>
            {booking.passenger_email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-foreground">{booking.passenger_email}</span>
              </div>
            )}
            {booking.passenger_phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-foreground">{booking.passenger_phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="px-5 py-3 border-t border-border space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("booking.baseFare")}</span>
            <span className="text-foreground">₹{baseFare}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("booking.gst")}</span>
            <span className="text-foreground">₹{gst}</span>
          </div>
          <div className="flex justify-between font-bold border-t border-border pt-1.5">
            <span className="text-foreground">{t("pay.total")}</span>
            <span className="text-primary text-lg">₹{booking.total_amount}</span>
          </div>
        </div>

        {/* Close */}
        <div className="px-5 py-4 border-t border-border">
          <Button onClick={onClose} className="w-full bg-primary hover:bg-primary/90">
            {t("common.close")}
          </Button>
        </div>
      </div>
    </div>
  );
}
