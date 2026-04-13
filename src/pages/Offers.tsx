import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Tag, Copy, Check, Percent, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";

export default function Offers() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: offers = [] } = useQuery({
    queryKey: ["offers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("offers")
        .select("*")
        .eq("is_active", true)
        .order("discount_percent", { ascending: false });
      return data || [];
    },
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const gradients = [
    "from-primary/10 to-accent/10",
    "from-success/10 to-primary/10",
    "from-accent/10 to-destructive/10",
    "from-primary/10 to-success/10",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header onVoiceOpen={() => {}} />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/")} className="rounded-lg p-2 hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-2xl font-bold">{t("offers.title")}</h1>
        </div>

        <div className="space-y-4">
          {offers.map((offer: any, i: number) => (
            <div
              key={offer.id}
              className={`rounded-2xl border border-border p-5 bg-gradient-to-br ${gradients[i % gradients.length]} space-y-3`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Percent className="h-5 w-5 text-primary" />
                    <h3 className="font-display text-lg font-semibold text-foreground">{offer.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{offer.description}</p>
                </div>
                <div className="text-right">
                  <span className="font-display text-3xl font-bold text-primary">{offer.discount_percent}%</span>
                  <p className="text-xs text-muted-foreground">OFF</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {t("offers.minAmount")}: ₹{offer.min_amount}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {t("offers.validTill")}: {offer.valid_until}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border-2 border-dashed border-primary/30 bg-card px-4 py-2">
                  <span className="font-mono font-bold text-primary tracking-wider">{offer.code}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyCode(offer.code)}
                  className={copiedCode === offer.code ? "text-success border-success" : ""}
                >
                  {copiedCode === offer.code ? (
                    <><Check className="h-4 w-4 mr-1" /> {t("offers.copied")}</>
                  ) : (
                    <><Copy className="h-4 w-4 mr-1" /> {t("offers.copy")}</>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
