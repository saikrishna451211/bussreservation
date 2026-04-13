import { ArrowRight, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const popularRoutes = [
  { from: "Chennai", to: "Bangalore", price: "₹450" },
  { from: "Mumbai", to: "Pune", price: "₹500" },
  { from: "Bangalore", to: "Hyderabad", price: "₹800" },
  { from: "Chennai", to: "Hyderabad", price: "₹700" },
  { from: "Mumbai", to: "Goa", price: "₹1800" },
  { from: "Bangalore", to: "Mysore", price: "₹350" },
];

interface PopularRoutesProps {
  onRouteClick: (from: string, to: string) => void;
}

export function PopularRoutes({ onRouteClick }: PopularRoutesProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-accent" />
        <h2 className="font-display text-xl font-semibold">{t("popular.title")}</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {popularRoutes.map((route) => (
          <button
            key={`${route.from}-${route.to}`}
            onClick={() => onRouteClick(route.from, route.to)}
            className="glass-card rounded-xl p-4 text-left transition-all hover:shadow-lg hover:-translate-y-0.5 group"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span>{route.from}</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span>{route.to}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("popular.startingFrom")} <span className="font-semibold text-primary">{route.price}</span>
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
