import { useLanguage } from "@/contexts/LanguageContext";

interface BusFiltersProps {
  activeType: string;
  onTypeChange: (type: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const busTypes = [
  { key: "all", labelKey: "filter.all" },
  { key: "AC", labelKey: "filter.ac" },
  { key: "Non-AC", labelKey: "filter.nonAc" },
  { key: "Sleeper", labelKey: "filter.sleeper" },
  { key: "Seater", labelKey: "filter.seater" },
  { key: "Volvo", labelKey: "filter.volvo" },
];

const sortOptions = [
  { key: "price_asc", labelKey: "filter.priceLow" },
  { key: "price_desc", labelKey: "filter.priceHigh" },
  { key: "rating", labelKey: "filter.rating" },
  { key: "departure", labelKey: "filter.departure" },
  { key: "duration", labelKey: "filter.duration" },
];

export function BusFilters({ activeType, onTypeChange, sortBy, onSortChange }: BusFiltersProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-3">
      {/* Bus Type Filters */}
      <div className="flex flex-wrap gap-2">
        {busTypes.map((bt) => (
          <button
            key={bt.key}
            onClick={() => onTypeChange(bt.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              activeType === bt.key
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {t(bt.labelKey)}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t("filter.sortBy")}:</span>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
        >
          {sortOptions.map((opt) => (
            <option key={opt.key} value={opt.key}>{t(opt.labelKey)}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
