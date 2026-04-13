import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Users, AlertCircle, XCircle, Clock, Loader2, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateCity } from "@/i18n/translations";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { TicketModal } from "@/components/TicketModal";

export default function BookingHistory() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select(`*, schedule:schedules(*, bus:buses(*), route:routes(*, from_city:cities!routes_from_city_id_fkey(*), to_city:cities!routes_to_city_id_fkey(*)))`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast({ title: t("booking.cancelled") });
    },
  });

  const canCancel = (travelDate: string) => {
    const travel = new Date(travelDate);
    const now = new Date();
    const hoursLeft = (travel.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursLeft > 8;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onVoiceOpen={() => {}} />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/")} className="rounded-lg p-2 hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-2xl font-bold">{t("booking.history")}</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{t("booking.noBookings")}</p>
            <Button onClick={() => navigate("/")} className="mt-4 bg-primary hover:bg-primary/90">
              {t("hero.manualSearch")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking: any) => {
              const fromCity = translateCity(booking.schedule?.route?.from_city?.name || "", lang);
              const toCity = translateCity(booking.schedule?.route?.to_city?.name || "", lang);

              return (
                <div key={booking.id} className="glass-card rounded-xl p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-semibold text-foreground">
                          {booking.schedule?.bus?.name || "Bus"}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          booking.status === "confirmed"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {booking.status === "confirmed" ? t("booking.confirmed") : t("booking.cancelled")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {booking.schedule?.bus?.bus_type} • {booking.schedule?.bus?.operator}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{t("booking.ref")}</p>
                      <p className="font-mono text-sm font-semibold text-primary">{booking.booking_ref}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>{fromCity}</span>
                    <span className="text-muted-foreground">→</span>
                    <span>{toCity}</span>
                  </div>

                  {/* Journey timing */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      {booking.schedule?.departure_time?.slice(0, 5)} - {booking.schedule?.arrival_time?.slice(0, 5)}
                    </div>
                    <span className="text-xs">({booking.schedule?.duration_hours}h)</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {booking.travel_date}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {booking.seats_booked} {t("booking.seats")}
                    </div>
                    <span className="font-semibold text-foreground">₹{booking.total_amount}</span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedBooking(booking)}
                      className="text-primary border-primary/30 hover:bg-primary/5"
                    >
                      <Ticket className="h-4 w-4 mr-1.5" />
                      {t("booking.viewTicket")}
                    </Button>

                    {booking.status === "confirmed" && canCancel(booking.travel_date) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelMutation.mutate(booking.id)}
                        disabled={cancelMutation.isPending}
                        className="text-destructive border-destructive/30 hover:bg-destructive/5"
                      >
                        <XCircle className="h-4 w-4 mr-1.5" />
                        {t("booking.cancel")}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedBooking && (
        <TicketModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      )}
    </div>
  );
}
