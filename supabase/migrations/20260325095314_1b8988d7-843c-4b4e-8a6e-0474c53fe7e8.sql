
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  email text,
  preferred_language text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS category text DEFAULT 'seater';

UPDATE public.buses SET category = 'sleeper' WHERE bus_type ILIKE '%sleeper%';
UPDATE public.buses SET category = 'seater' WHERE bus_type ILIKE '%seater%' AND bus_type NOT ILIKE '%sleeper%';

CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  discount_percent integer NOT NULL DEFAULT 10,
  min_amount numeric DEFAULT 0,
  max_discount numeric DEFAULT 500,
  valid_until date,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Offers are publicly readable" ON public.offers FOR SELECT USING (true);

INSERT INTO public.offers (code, title, description, discount_percent, min_amount, max_discount, valid_until) VALUES
  ('FIRST50', 'First Ride Discount', 'Get 50% off on your first booking', 50, 200, 500, '2026-12-31'),
  ('SAVE20', 'Save 20%', 'Flat 20% off on all routes', 20, 300, 300, '2026-06-30'),
  ('SUMMER10', 'Summer Special', '10% off on summer travel', 10, 100, 200, '2026-05-31'),
  ('WEEKEND15', 'Weekend Getaway', '15% off on weekend bookings', 15, 250, 400, '2026-12-31');

CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Bookings are readable" ON public.bookings;

CREATE POLICY "Users can read own bookings" ON public.bookings
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
CREATE POLICY "Authenticated users can create bookings" ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
