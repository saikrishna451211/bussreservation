import { useState, useCallback } from "react";
import { Mic, Bus, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { SearchForm } from "@/components/SearchForm";
import { BusResults } from "@/components/BusResults";
import { PopularRoutes } from "@/components/PopularRoutes";
import { BusFilters } from "@/components/BusFilters";
import { SeatMap } from "@/components/SeatMap";
import { BusDetailModal } from "@/components/BusDetailModal";
import { fetchCities, searchBuses } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Schedule } from "@/types/bus";

const Index = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Schedule[]>([]);
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [travelDate, setTravelDate] = useState<string | undefined>();
  const [isSearching, setIsSearching] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("price_asc");
  const [seatMapSchedule, setSeatMapSchedule] = useState<Schedule | null>(null);
  const [detailSchedule, setDetailSchedule] = useState<Schedule | null>(null);
  const { toast } = useToast();

  const { data: cities = [] } = useQuery({
    queryKey: ["cities"],
    queryFn: fetchCities,
  });

  const handleSearch = useCallback(
    async (from: string, to: string, date?: string) => {
      setIsSearching(true);
      try {
        const results = await searchBuses(from, to);
        setSearchResults(results);
        setFromCity(from);
        setToCity(to);
        setTravelDate(date);
        if (results.length === 0) {
          toast({ title: t("results.noBuses"), description: `${from} → ${to}` });
        }
      } catch {
        toast({ variant: "destructive", title: t("common.error") });
      } finally {
        setIsSearching(false);
      }
    },
    [toast, t]
  );

  const handleVoiceResults = useCallback(
    (results: Schedule[], from: string, to: string) => {
      setSearchResults(results);
      setFromCity(from);
      setToCity(to);
    },
    []
  );

  const handleSelectSeats = useCallback((schedule: Schedule) => {
    setDetailSchedule(null);
    setSeatMapSchedule(schedule);
  }, []);

  const handleViewDetails = useCallback((schedule: Schedule) => {
    setDetailSchedule(schedule);
  }, []);

  const handleSeatContinue = useCallback(
    (seats: string[]) => {
      setSeatMapSchedule(null);
      navigate("/payment", {
        state: {
          schedule: seatMapSchedule,
          seats,
          fromCity,
          toCity,
          travelDate,
        },
      });
    },
    [navigate, seatMapSchedule, fromCity, toCity, travelDate]
  );

  // Filter & sort
  const filteredResults = searchResults
    .filter((s: any) => {
      if (filterType === "all") return true;
      const bt = s.bus?.bus_type?.toLowerCase() || "";
      return bt.includes(filterType.toLowerCase());
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case "price_asc": return a.price - b.price;
        case "price_desc": return b.price - a.price;
        case "rating": return (b.bus?.rating || 0) - (a.bus?.rating || 0);
        case "departure": return (a.departure_time || "").localeCompare(b.departure_time || "");
        case "duration": return a.duration_hours - b.duration_hours;
        default: return 0;
      }
    });

  return (
    <div className="min-h-screen bg-background">
      <Header onVoiceOpen={() => setVoiceOpen(true)} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border" data-section="home">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {t("hero.title1")}
              <br />
              <span className="text-primary">{t("hero.title2")}</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">{t("hero.subtitle")}</p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                onClick={() => setVoiceOpen(true)}
                className="gap-2 bg-primary hover:bg-primary/90 text-lg px-8 h-12"
              >
                <Mic className="h-5 w-5" />
                {t("hero.voiceSearch")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.getElementById("search-section")?.scrollIntoView({ behavior: "smooth" })}
                className="h-12 text-lg px-8"
              >
                {t("hero.manualSearch")}
              </Button>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-success" />
              {t("trust.secure")}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              {t("trust.instant")}
            </div>
            <div className="flex items-center gap-2">
              <Bus className="h-4 w-4 text-accent" />
              {t("trust.operators")}
            </div>
          </div>
        </div>
      </section>

      {/* Search & Results */}
      <section id="search-section" className="container mx-auto px-4 py-10 space-y-6" data-section="search">
        <SearchForm cities={cities} onSearch={handleSearch} isSearching={isSearching} />

        {searchResults.length > 0 && (
          <>
            <BusFilters
              activeType={filterType}
              onTypeChange={setFilterType}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
            <BusResults
              results={filteredResults}
              fromCity={fromCity}
              toCity={toCity}
              onBook={handleSelectSeats}
              onViewDetails={handleViewDetails}
            />
          </>
        )}

        {searchResults.length === 0 && <PopularRoutes onRouteClick={(from, to) => handleSearch(from, to)} />}
      </section>

      {/* Voice Assistant */}
      <VoiceAssistant
        isOpen={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        cities={cities.map((c) => c.name)}
        onSearchResults={handleVoiceResults}
      />

      {/* Bus Detail Modal */}
      {detailSchedule && (
        <BusDetailModal
          schedule={detailSchedule}
          onClose={() => setDetailSchedule(null)}
          onSelectSeats={() => handleSelectSeats(detailSchedule)}
        />
      )}

      {/* Seat Map */}
      {seatMapSchedule && (
        <SeatMap
          schedule={seatMapSchedule}
          onClose={() => setSeatMapSchedule(null)}
          onContinue={handleSeatContinue}
        />
      )}

      {/* Floating Voice Button */}
      {!voiceOpen && (
        <button
          onClick={() => setVoiceOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 md:hidden"
        >
          <Mic className="h-6 w-6" />
        </button>
      )}
    </div>
  );
};

export default Index;
