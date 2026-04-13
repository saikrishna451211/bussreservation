import { useState } from "react";
import { ArrowRight, MapPin, Calendar, Search } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { City } from "@/types/bus";

interface SearchFormProps {
  cities: City[];
  onSearch: (from: string, to: string, date?: string) => void;
  isSearching: boolean;
}

export function SearchForm({ cities, onSearch, isSearching }: SearchFormProps) {
  const { t } = useLanguage();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (from && to) onSearch(from, to, date ? format(date, "yyyy-MM-dd") : undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary" />
            {t("search.from")}
          </label>
          <Input
            placeholder={t("search.departureCity")}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            list="from-cities"
            className="bg-background"
            data-gaze-target="from-city"
          />
          <datalist id="from-cities">
            {cities.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>

        <div className="hidden md:flex items-center pb-2">
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-destructive" />
            {t("search.to")}
          </label>
          <Input
            placeholder={t("search.destinationCity")}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            list="to-cities"
            className="bg-background"
            data-gaze-target="to-city"
          />
          <datalist id="to-cities">
            {cities.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>

        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-accent" />
            {t("search.date")}
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-background",
                  !date && "text-muted-foreground"
                )}
                data-gaze-target="travel-date"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : t("search.selectDate")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button
          type="submit"
          disabled={!from || !to || isSearching}
          className="bg-primary hover:bg-primary/90 gap-2 h-10"
          data-gaze-target="search-button"
        >
          <Search className="h-4 w-4" />
          {isSearching ? t("search.searching") : t("search.search")}
        </Button>
      </div>
    </form>
  );
}
