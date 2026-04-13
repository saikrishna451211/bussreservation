import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CreditCard, Smartphone, Wallet, Building, Tag, Check, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type PayMethod = "upi" | "card" | "wallet" | "netbanking";

export default function Payment() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as any;

  const [payMethod, setPayMethod] = useState<PayMethod>("upi");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

  if (!state?.schedule || !state?.seats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No booking data found.</p>
          <Button onClick={() => navigate("/")} className="mt-4">{t("common.back")}</Button>
        </div>
      </div>
    );
  }

  const { schedule, seats, fromCity, toCity, travelDate } = state;
  const baseFare = schedule.price * seats.length;
  const tax = Math.round(baseFare * 0.05);
  const total = baseFare + tax - discount;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    const { data } = await supabase
      .from("offers")
      .select("*")
      .eq("code", couponCode.toUpperCase())
      .eq("is_active", true)
      .single();

    if (data && baseFare >= (data.min_amount || 0)) {
      const disc = Math.min(
        Math.round(baseFare * (data.discount_percent / 100)),
        data.max_discount || 500
      );
      setDiscount(disc);
      setCouponApplied(true);
      toast({ title: "🎉 Coupon applied!", description: `You saved ₹${disc}` });
    } else {
      toast({ variant: "destructive", title: "Invalid coupon", description: "This coupon is not valid." });
    }
  };

  const handlePay = async () => {
    setProcessing(true);
    try {
      // Simulate payment delay
      await new Promise((r) => setTimeout(r, 2000));

      const { data, error } = await supabase
        .from("bookings")
        .insert({
          schedule_id: schedule.id,
          passenger_name: user?.user_metadata?.full_name || "Guest",
          passenger_email: user?.email,
          passenger_phone: "",
          travel_date: travelDate || new Date().toISOString().split("T")[0],
          seats_booked: seats.length,
          total_amount: total,
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      setBookingRef(data.booking_ref);
      setSuccess(true);
    } catch (err: any) {
      toast({ variant: "destructive", title: t("common.error"), description: err.message });
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-card rounded-2xl p-8 text-center space-y-4 animate-in zoom-in-95">
          <div className="mx-auto h-20 w-20 rounded-full bg-success/10 flex items-center justify-center">
            <Check className="h-10 w-10 text-success" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">{t("pay.success")}</h1>
          <p className="text-muted-foreground">
            {fromCity} → {toCity}
          </p>
          <div className="rounded-xl bg-secondary p-4">
            <p className="text-sm text-muted-foreground">{t("booking.ref")}</p>
            <p className="font-display text-xl font-bold text-primary">{bookingRef}</p>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{seats.length} {t("booking.seats")} • {seats.join(", ")}</p>
            <p>{t("pay.total")}: ₹{total}</p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => navigate("/bookings")} variant="outline" className="flex-1">
              {t("nav.myBookings")}
            </Button>
            <Button onClick={() => navigate("/")} className="flex-1 bg-primary hover:bg-primary/90">
              {t("nav.home")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const methods = [
    { key: "upi" as const, icon: Smartphone, label: t("pay.upi") },
    { key: "card" as const, icon: CreditCard, label: t("pay.card") },
    { key: "wallet" as const, icon: Wallet, label: t("pay.wallet") },
    { key: "netbanking" as const, icon: Building, label: t("pay.netBanking") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 glass-card border-b border-border">
        <div className="container mx-auto flex h-14 items-center px-4 gap-3">
          <button onClick={() => navigate(-1)} className="rounded-lg p-2 hover:bg-secondary">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="font-display text-lg font-semibold">{t("pay.title")}</h1>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-success">
            <Shield className="h-3.5 w-3.5" />
            {t("trust.secure")}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-4 max-w-lg">
        {/* Trip Summary */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="font-display font-semibold text-sm text-muted-foreground mb-2">{t("pay.summary")}</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">{schedule.bus?.name}</p>
              <p className="text-sm text-muted-foreground">{fromCity} → {toCity}</p>
              <p className="text-sm text-muted-foreground">
                {schedule.departure_time?.slice(0, 5)} - {schedule.arrival_time?.slice(0, 5)} • {schedule.bus?.bus_type}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{seats.length} {t("booking.seats")}</p>
              <p className="text-xs text-muted-foreground">{seats.join(", ")}</p>
            </div>
          </div>
        </div>

        {/* Coupon */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("pay.enterCoupon")}
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                disabled={couponApplied}
                className="pl-9 bg-background"
              />
            </div>
            <Button
              onClick={applyCoupon}
              disabled={couponApplied || !couponCode}
              variant={couponApplied ? "outline" : "default"}
              className={couponApplied ? "text-success" : "bg-primary hover:bg-primary/90"}
            >
              {couponApplied ? <Check className="h-4 w-4" /> : t("pay.applyCoupon")}
            </Button>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="glass-card rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("pay.baseFare")} ({seats.length} × ₹{schedule.price})</span>
            <span className="text-foreground">₹{baseFare}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("pay.tax")}</span>
            <span className="text-foreground">₹{tax}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-success">{t("pay.discount")}</span>
              <span className="text-success">-₹{discount}</span>
            </div>
          )}
          <div className="border-t border-border pt-2 flex justify-between font-semibold">
            <span>{t("pay.total")}</span>
            <span className="font-display text-xl text-primary">₹{total}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="glass-card rounded-xl p-4 space-y-3">
          {methods.map((m) => (
            <button
              key={m.key}
              onClick={() => setPayMethod(m.key)}
              className={`w-full flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                payMethod === m.key ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <m.icon className={`h-5 w-5 ${payMethod === m.key ? "text-primary" : "text-muted-foreground"}`} />
              <span className="font-medium text-foreground">{m.label}</span>
              {payMethod === m.key && (
                <div className="ml-auto h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Pay Button */}
        <Button
          onClick={handlePay}
          disabled={processing}
          className="w-full h-14 text-lg bg-primary hover:bg-primary/90"
        >
          {processing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            `${t("pay.payNow")} • ₹${total}`
          )}
        </Button>
      </div>
    </div>
  );
}
