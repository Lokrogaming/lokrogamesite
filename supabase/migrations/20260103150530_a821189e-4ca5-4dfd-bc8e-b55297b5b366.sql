-- Update is_staff function to include owner role
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role IN ('staff', 'admin', 'moderator', 'owner')
    )
$$;

-- Create function to check if user is owner
CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = 'owner'
    )
$$;

-- Create rank_configs table for custom ranks (owner-managed)
CREATE TABLE IF NOT EXISTS public.rank_configs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rank_key text NOT NULL UNIQUE,
    display_name text NOT NULL,
    xp_threshold integer NOT NULL,
    color_class text NOT NULL DEFAULT 'bg-gray-500/20 text-gray-500 border-gray-500/30',
    icon_name text NOT NULL DEFAULT 'Medal',
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on rank_configs
ALTER TABLE public.rank_configs ENABLE ROW LEVEL SECURITY;

-- Anyone can view rank configs
CREATE POLICY "Anyone can view rank configs"
ON public.rank_configs
FOR SELECT
USING (true);

-- Only owners can manage rank configs
CREATE POLICY "Owners can manage rank configs"
ON public.rank_configs
FOR ALL
USING (is_owner(auth.uid()));

-- Insert default ranks
INSERT INTO public.rank_configs (rank_key, display_name, xp_threshold, color_class, icon_name, sort_order) VALUES
('bronze', 'Bronze', 0, 'bg-amber-900/20 text-amber-700 border-amber-700/30', 'Medal', 1),
('silver', 'Silver', 500, 'bg-slate-300/20 text-slate-400 border-slate-400/30', 'Medal', 2),
('gold', 'Gold', 2000, 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30', 'Trophy', 3),
('platinum', 'Platinum', 5000, 'bg-cyan-400/20 text-cyan-400 border-cyan-400/30', 'Gem', 4),
('diamond', 'Diamond', 10000, 'bg-blue-400/20 text-blue-400 border-blue-400/30', 'Gem', 5),
('master', 'Master', 25000, 'bg-purple-500/20 text-purple-500 border-purple-500/30', 'Crown', 6),
('queen', 'Queen', 50000, 'bg-pink-500/20 text-amber-500 border-gold/30', 'Crown', 7),
('king', 'King', 75000, 'bg-gold/20 text-gold border-gold/30', 'Crown', 8),
('legend', 'Legend', 100000, 'bg-gradient-to-r from-amber-500/20 via-red-500/20 to-purple-500/20 text-amber-400 border-amber-400/30', 'Sparkles', 9)
ON CONFLICT (rank_key) DO NOTHING;

-- Allow owners to delete any profile
CREATE POLICY "Owners can delete profiles"
ON public.profiles
FOR DELETE
USING (is_owner(auth.uid()));

-- Allow owners to update any profile (including credits)
CREATE POLICY "Owners can update any profile"
ON public.profiles
FOR UPDATE
USING (is_owner(auth.uid()));

-- Allow owners to view all profiles
CREATE POLICY "Owners can view all profiles"
ON public.profiles
FOR SELECT
USING (is_owner(auth.uid()));

-- Create function for owners to update user credits directly
CREATE OR REPLACE FUNCTION public.owner_set_credits(_target_user_id uuid, _new_credits integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if caller is owner
  IF NOT is_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Only owners can set credits directly';
  END IF;
  
  -- Validate credits range
  IF _new_credits < 0 OR _new_credits > 1000000 THEN
    RAISE EXCEPTION 'Credits must be between 0 and 1,000,000';
  END IF;
  
  UPDATE public.profiles
  SET credits = _new_credits, updated_at = now()
  WHERE user_id = _target_user_id;
  
  RETURN TRUE;
END;
$$;