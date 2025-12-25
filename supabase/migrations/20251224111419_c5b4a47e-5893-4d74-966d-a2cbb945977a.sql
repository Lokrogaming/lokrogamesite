-- Add XP column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0;

-- Create function to add XP and auto-update rank
CREATE OR REPLACE FUNCTION public.add_chat_xp()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _xp_gained INTEGER;
  _new_xp INTEGER;
  _new_rank user_rank;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Random XP between 1 and 10
  _xp_gained := floor(random() * 10 + 1)::INTEGER;
  
  -- Update XP and get new total
  UPDATE public.profiles
  SET xp = xp + _xp_gained, updated_at = now()
  WHERE user_id = _user_id
  RETURNING xp INTO _new_xp;
  
  -- Determine rank based on XP thresholds
  _new_rank := CASE
    WHEN _new_xp >= 50000 THEN 'legend'::user_rank
    WHEN _new_xp >= 40000 THEN 'king'::user_rank
    WHEN _new_xp >= 30000 THEN 'queen'::user_rank
    WHEN _new_xp >= 25000 THEN 'master'::user_rank
    WHEN _new_xp >= 10000 THEN 'diamond'::user_rank
    WHEN _new_xp >= 5000 THEN 'platinum'::user_rank
    WHEN _new_xp >= 2000 THEN 'gold'::user_rank
    WHEN _new_xp >= 500 THEN 'silver'::user_rank
    ELSE 'bronze'::user_rank
  END;
  
  -- Update rank if changed
  UPDATE public.profiles
  SET rank = _new_rank
  WHERE user_id = _user_id AND (rank IS NULL OR rank != _new_rank);
  
  RETURN _xp_gained;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.add_chat_xp() TO authenticated;