
-- Draws table
CREATE TABLE public.lottery_draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | completed
  pot INTEGER NOT NULL DEFAULT 5000,
  winning_numbers INTEGER[],
  winner_user_ids UUID[],
  prize_per_winner INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
GRANT SELECT ON public.lottery_draws TO authenticated, anon;
GRANT ALL ON public.lottery_draws TO service_role;
ALTER TABLE public.lottery_draws ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view draws" ON public.lottery_draws FOR SELECT USING (true);

-- Tickets table
CREATE TABLE public.lottery_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES public.lottery_draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numbers INTEGER[] NOT NULL,
  matches INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.lottery_tickets TO authenticated;
GRANT ALL ON public.lottery_tickets TO service_role;
ALTER TABLE public.lottery_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own tickets" ON public.lottery_tickets FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_owner(auth.uid()));
CREATE POLICY "No direct inserts" ON public.lottery_tickets FOR INSERT TO authenticated WITH CHECK (false);

CREATE INDEX lottery_tickets_draw_idx ON public.lottery_tickets(draw_id);
CREATE INDEX lottery_tickets_user_idx ON public.lottery_tickets(user_id);

-- Helper: next Sunday 12:00 UTC
CREATE OR REPLACE FUNCTION public.next_lottery_date()
RETURNS TIMESTAMPTZ
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT date_trunc('day', now())
    + ((7 - EXTRACT(DOW FROM now())::int) % 7) * INTERVAL '1 day'
    + INTERVAL '12 hours'
    + CASE
        WHEN date_trunc('day', now())
             + ((7 - EXTRACT(DOW FROM now())::int) % 7) * INTERVAL '1 day'
             + INTERVAL '12 hours' <= now()
        THEN INTERVAL '7 days'
        ELSE INTERVAL '0'
      END;
$$;

-- Ensure a pending draw exists; returns its id
CREATE OR REPLACE FUNCTION public.ensure_pending_lottery_draw()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id UUID;
BEGIN
  SELECT id INTO _id FROM public.lottery_draws WHERE status = 'pending' ORDER BY draw_date ASC LIMIT 1;
  IF _id IS NULL THEN
    INSERT INTO public.lottery_draws (draw_date, pot, status)
    VALUES (public.next_lottery_date(), 5000, 'pending')
    RETURNING id INTO _id;
  END IF;
  RETURN _id;
END;
$$;

-- Buy a ticket: validates 6 distinct numbers 1..49, charges 100, adds 100 to pot
CREATE OR REPLACE FUNCTION public.buy_lottery_ticket(_numbers INTEGER[])
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _draw_id UUID;
  _credits INTEGER;
  _ticket_id UUID;
  _n INTEGER;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _numbers IS NULL OR array_length(_numbers, 1) <> 6 THEN
    RAISE EXCEPTION 'Pick exactly 6 numbers';
  END IF;
  IF (SELECT COUNT(DISTINCT x) FROM unnest(_numbers) x) <> 6 THEN
    RAISE EXCEPTION 'Numbers must be unique';
  END IF;
  FOREACH _n IN ARRAY _numbers LOOP
    IF _n < 1 OR _n > 49 THEN
      RAISE EXCEPTION 'Numbers must be between 1 and 49';
    END IF;
  END LOOP;

  _draw_id := public.ensure_pending_lottery_draw();

  SELECT credits INTO _credits FROM public.profiles WHERE user_id = _user_id FOR UPDATE;
  IF _credits < 100 THEN
    RAISE EXCEPTION 'Insufficient credits (need 100)';
  END IF;

  UPDATE public.profiles SET credits = credits - 100, updated_at = now() WHERE user_id = _user_id;
  UPDATE public.lottery_draws SET pot = pot + 100 WHERE id = _draw_id;

  INSERT INTO public.lottery_tickets (draw_id, user_id, numbers)
  VALUES (_draw_id, _user_id, (SELECT array_agg(x ORDER BY x) FROM unnest(_numbers) x))
  RETURNING id INTO _ticket_id;

  RETURN _ticket_id;
END;
$$;

-- Run the draw: pick 6 numbers, find tickets matching all 6, split pot, seed next draw
CREATE OR REPLACE FUNCTION public.run_lottery_draw()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _draw RECORD;
  _winning INTEGER[];
  _winners UUID[];
  _winner_count INTEGER;
  _prize INTEGER;
  _w UUID;
  _remaining INTEGER;
  _chunk INTEGER;
BEGIN
  -- Get the oldest pending draw whose draw_date has passed
  SELECT * INTO _draw FROM public.lottery_draws
   WHERE status = 'pending' AND draw_date <= now()
   ORDER BY draw_date ASC LIMIT 1
   FOR UPDATE;

  IF _draw IS NULL THEN
    RETURN jsonb_build_object('ran', false, 'reason', 'No pending draw due');
  END IF;

  -- Pick 6 unique numbers 1..49
  SELECT array_agg(n ORDER BY n) INTO _winning FROM (
    SELECT n FROM generate_series(1,49) n ORDER BY random() LIMIT 6
  ) s;

  -- Tag matches on tickets
  UPDATE public.lottery_tickets t
     SET matches = (
       SELECT COUNT(*) FROM unnest(t.numbers) x WHERE x = ANY(_winning)
     )
   WHERE draw_id = _draw.id;

  -- Find winners (all 6 match)
  SELECT array_agg(DISTINCT user_id) INTO _winners
    FROM public.lottery_tickets
   WHERE draw_id = _draw.id AND matches = 6;

  _winner_count := COALESCE(array_length(_winners, 1), 0);

  IF _winner_count > 0 THEN
    _prize := _draw.pot / _winner_count;
    FOREACH _w IN ARRAY _winners LOOP
      -- earn_credits caps at 10000 per call and 100000 balance; bypass by direct update with cap 1,000,000
      UPDATE public.profiles
         SET credits = LEAST(credits + _prize, 1000000), updated_at = now()
       WHERE user_id = _w;
    END LOOP;
  ELSE
    _prize := 0;
  END IF;

  UPDATE public.lottery_draws
     SET status = 'completed',
         winning_numbers = _winning,
         winner_user_ids = _winners,
         prize_per_winner = _prize,
         completed_at = now()
   WHERE id = _draw.id;

  -- Seed next draw with 5000
  INSERT INTO public.lottery_draws (draw_date, pot, status)
  VALUES (public.next_lottery_date(), 5000, 'pending');

  RETURN jsonb_build_object(
    'ran', true,
    'draw_id', _draw.id,
    'winning_numbers', _winning,
    'winners', _winner_count,
    'prize_per_winner', _prize,
    'pot', _draw.pot
  );
END;
$$;

-- Seed first pending draw
SELECT public.ensure_pending_lottery_draw();
