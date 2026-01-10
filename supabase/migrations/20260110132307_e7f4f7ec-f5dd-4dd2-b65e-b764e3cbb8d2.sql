
-- Create invite_links table
CREATE TABLE public.invite_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  creator_id UUID NOT NULL,
  uses_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invite_links ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own invite links"
  ON public.invite_links FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can create invite links"
  ON public.invite_links FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Anyone can view active invite links for redemption"
  ON public.invite_links FOR SELECT
  USING (is_active = true);

-- Create invite_redemptions table to track who used which invite
CREATE TABLE public.invite_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_link_id UUID NOT NULL REFERENCES public.invite_links(id),
  invited_user_id UUID NOT NULL UNIQUE, -- Each user can only be invited once
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invite_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for redemptions
CREATE POLICY "Users can view own redemptions"
  ON public.invite_redemptions FOR SELECT
  USING (auth.uid() = invited_user_id);

CREATE POLICY "System can insert redemptions"
  ON public.invite_redemptions FOR INSERT
  WITH CHECK (auth.uid() = invited_user_id);

-- Function to generate a random invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Function to create an invite link for the current user
CREATE OR REPLACE FUNCTION public.create_invite_link()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  attempts INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Generate unique code
  LOOP
    new_code := generate_invite_code();
    BEGIN
      INSERT INTO invite_links (code, creator_id)
      VALUES (new_code, auth.uid());
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      attempts := attempts + 1;
      IF attempts > 10 THEN
        RAISE EXCEPTION 'Could not generate unique invite code';
      END IF;
    END;
  END LOOP;

  RETURN new_code;
END;
$$;

-- Function to redeem an invite code (called after user registration)
CREATE OR REPLACE FUNCTION public.redeem_invite_code(_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
  reward_credits INTEGER := 200;
  reward_xp INTEGER := 500;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user already redeemed an invite
  IF EXISTS (SELECT 1 FROM invite_redemptions WHERE invited_user_id = auth.uid()) THEN
    RETURN FALSE;
  END IF;

  -- Find the invite link
  SELECT * INTO invite_record
  FROM invite_links
  WHERE code = _code AND is_active = true;

  IF invite_record IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Don't allow self-referral
  IF invite_record.creator_id = auth.uid() THEN
    RETURN FALSE;
  END IF;

  -- Record the redemption
  INSERT INTO invite_redemptions (invite_link_id, invited_user_id)
  VALUES (invite_record.id, auth.uid());

  -- Update uses count
  UPDATE invite_links
  SET uses_count = uses_count + 1
  WHERE id = invite_record.id;

  -- Reward the invited user (current user)
  UPDATE profiles
  SET credits = credits + reward_credits,
      xp = xp + reward_xp
  WHERE user_id = auth.uid();

  -- Reward the creator
  UPDATE profiles
  SET credits = credits + reward_credits,
      xp = xp + reward_xp
  WHERE user_id = invite_record.creator_id;

  RETURN TRUE;
END;
$$;
