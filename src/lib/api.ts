import { supabase } from "@/integrations/supabase/client";
import type { City, Schedule, VoiceIntent } from "@/types/bus";

export async function fetchCities(): Promise<City[]> {
  const { data, error } = await supabase.from("cities").select("*").order("name");
  if (error) throw error;
  return data || [];
}

export async function searchBuses(
  fromCityName: string,
  toCityName: string
): Promise<Schedule[]> {
  // First find city IDs
  const { data: fromCity } = await supabase
    .from("cities")
    .select("id")
    .ilike("name", `%${fromCityName}%`)
    .single();

  const { data: toCity } = await supabase
    .from("cities")
    .select("id")
    .ilike("name", `%${toCityName}%`)
    .single();

  if (!fromCity || !toCity) return [];

  // Find route
  const { data: route } = await supabase
    .from("routes")
    .select("id")
    .eq("from_city_id", fromCity.id)
    .eq("to_city_id", toCity.id)
    .single();

  if (!route) return [];

  // Find schedules with bus info
  const { data: schedules, error } = await supabase
    .from("schedules")
    .select(`
      *,
      bus:buses(*),
      route:routes(
        *,
        from_city:cities!routes_from_city_id_fkey(*),
        to_city:cities!routes_to_city_id_fkey(*)
      )
    `)
    .eq("route_id", route.id)
    .eq("is_active", true)
    .order("price", { ascending: true });

  if (error) throw error;
  return (schedules as any) || [];
}

export async function parseVoiceIntent(
  transcript: string,
  cities: string[],
  language: string = "en"
): Promise<VoiceIntent> {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-intent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ transcript, cities, language }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to parse voice intent");
  }

  return response.json();
}

export async function createBooking(booking: {
  schedule_id: string;
  passenger_name: string;
  passenger_email?: string;
  passenger_phone: string;
  travel_date: string;
  seats_booked: number;
  total_amount: number;
}) {
  const { data, error } = await supabase
    .from("bookings")
    .insert(booking)
    .select()
    .single();

  if (error) throw error;
  return data;
}
