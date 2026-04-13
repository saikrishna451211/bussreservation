
-- Cities table
CREATE TABLE public.cities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Routes table
CREATE TABLE public.routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_city_id UUID NOT NULL REFERENCES public.cities(id),
  to_city_id UUID NOT NULL REFERENCES public.cities(id),
  distance_km INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_city_id, to_city_id)
);

-- Buses table
CREATE TABLE public.buses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  operator TEXT NOT NULL,
  bus_type TEXT NOT NULL CHECK (bus_type IN ('AC Sleeper', 'AC Seater', 'Non-AC Sleeper', 'Non-AC Seater', 'Volvo AC', 'Semi-Sleeper')),
  total_seats INTEGER NOT NULL DEFAULT 40,
  amenities TEXT[] DEFAULT '{}',
  rating NUMERIC(2,1) DEFAULT 4.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Schedules table
CREATE TABLE public.schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID NOT NULL REFERENCES public.routes(id),
  bus_id UUID NOT NULL REFERENCES public.buses(id),
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  duration_hours NUMERIC(4,1) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  available_seats INTEGER NOT NULL DEFAULT 40,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES public.schedules(id),
  passenger_name TEXT NOT NULL,
  passenger_email TEXT,
  passenger_phone TEXT NOT NULL,
  travel_date DATE NOT NULL,
  seats_booked INTEGER NOT NULL DEFAULT 1,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  booking_ref TEXT NOT NULL UNIQUE DEFAULT 'BB-' || substr(gen_random_uuid()::text, 1, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Cities, routes, buses, schedules are publicly readable
CREATE POLICY "Cities are publicly readable" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Routes are publicly readable" ON public.routes FOR SELECT USING (true);
CREATE POLICY "Buses are publicly readable" ON public.buses FOR SELECT USING (true);
CREATE POLICY "Schedules are publicly readable" ON public.schedules FOR SELECT USING (true);

-- Bookings: anyone can insert, readable by all for MVP
CREATE POLICY "Anyone can create bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Bookings are readable" ON public.bookings FOR SELECT USING (true);

-- Create indexes
CREATE INDEX idx_routes_from_city ON public.routes(from_city_id);
CREATE INDEX idx_routes_to_city ON public.routes(to_city_id);
CREATE INDEX idx_schedules_route ON public.schedules(route_id);
CREATE INDEX idx_schedules_bus ON public.schedules(bus_id);
CREATE INDEX idx_bookings_schedule ON public.bookings(schedule_id);
CREATE INDEX idx_bookings_ref ON public.bookings(booking_ref);
