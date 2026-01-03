-- ============================================
-- FIX 1: Profile Data Exposure
-- ============================================

-- Create public profile view with only safe fields
CREATE VIEW public.public_profiles AS
SELECT 
  user_id,
  username,
  avatar_url,
  rank,
  description,
  tag,
  favorite_game,
  social_link,
  xp,
  created_at
FROM public.profiles;

-- Grant access to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated can view public profile data" ON public.profiles;

-- Create restricted policies - users can only view their own full profile
CREATE POLICY "Users view own full profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = user_id);

-- ============================================
-- FIX 2: Voucher Brute Force Protection
-- ============================================

-- Create redemption attempts tracking table
CREATE TABLE public.voucher_redemption_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  attempt_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  code_attempted TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false
);

-- Add index for efficient rate limit queries
CREATE INDEX idx_voucher_attempts_user_time 
  ON public.voucher_redemption_attempts(user_id, attempt_time DESC);

-- Enable RLS
ALTER TABLE public.voucher_redemption_attempts ENABLE ROW LEVEL SECURITY;

-- Only allow system to insert (via security definer functions)
CREATE POLICY "System can insert attempts"
  ON public.voucher_redemption_attempts FOR INSERT
  WITH CHECK (true);

-- Staff can view all attempts for monitoring
CREATE POLICY "Staff can view attempts"
  ON public.voucher_redemption_attempts FOR SELECT
  USING (is_staff(auth.uid()));

-- Update redeem_voucher function with rate limiting
CREATE OR REPLACE FUNCTION public.redeem_voucher(_code TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _recent_attempts INTEGER;
  _voucher_id UUID;
  _voucher_amount INTEGER;
  _creator_id UUID;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check rate limit: max 3 attempts per minute
  SELECT COUNT(*) INTO _recent_attempts
  FROM public.voucher_redemption_attempts
  WHERE user_id = _user_id 
    AND attempt_time > NOW() - INTERVAL '1 minute';
  
  IF _recent_attempts >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait before trying again.';
  END IF;
  
  -- Log this attempt
  INSERT INTO public.voucher_redemption_attempts (user_id, code_attempted, success)
  VALUES (_user_id, upper(_code), false);
  
  -- Find and lock voucher
  SELECT id, amount, creator_id INTO _voucher_id, _voucher_amount, _creator_id
  FROM public.credit_vouchers
  WHERE code = upper(_code) AND is_redeemed = false
  FOR UPDATE;
  
  IF _voucher_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or already redeemed voucher code';
  END IF;
  
  IF _creator_id = _user_id THEN
    RAISE EXCEPTION 'You cannot redeem your own voucher';
  END IF;
  
  -- Mark attempt as successful
  UPDATE public.voucher_redemption_attempts
  SET success = true
  WHERE user_id = _user_id 
    AND code_attempted = upper(_code)
    AND attempt_time = (
      SELECT MAX(attempt_time) 
      FROM public.voucher_redemption_attempts 
      WHERE user_id = _user_id AND code_attempted = upper(_code)
    );
  
  -- Mark voucher as redeemed
  UPDATE public.credit_vouchers
  SET is_redeemed = true, redeemed_by = _user_id, redeemed_at = now()
  WHERE id = _voucher_id;
  
  -- Add credits to user
  UPDATE public.profiles
  SET credits = LEAST(credits + _voucher_amount, 100000), updated_at = now()
  WHERE user_id = _user_id;
  
  RETURN _voucher_amount;
END;
$$;

-- Update redeem_special_voucher function with rate limiting
CREATE OR REPLACE FUNCTION public.redeem_special_voucher(_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _recent_attempts INTEGER;
  _voucher RECORD;
  _already_redeemed BOOLEAN;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check rate limit: max 3 attempts per minute
  SELECT COUNT(*) INTO _recent_attempts
  FROM public.voucher_redemption_attempts
  WHERE user_id = _user_id 
    AND attempt_time > NOW() - INTERVAL '1 minute';
  
  IF _recent_attempts >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait before trying again.';
  END IF;
  
  -- Log this attempt
  INSERT INTO public.voucher_redemption_attempts (user_id, code_attempted, success)
  VALUES (_user_id, upper(_code), false);
  
  -- Find voucher
  SELECT * INTO _voucher
  FROM public.special_vouchers
  WHERE code = upper(_code) AND is_active = true
  FOR UPDATE;
  
  IF _voucher IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive voucher code';
  END IF;
  
  -- Check expiration
  IF _voucher.expires_at IS NOT NULL AND _voucher.expires_at < now() THEN
    RAISE EXCEPTION 'Voucher has expired';
  END IF;
  
  -- Check max uses
  IF _voucher.max_uses IS NOT NULL AND _voucher.current_uses >= _voucher.max_uses THEN
    RAISE EXCEPTION 'Voucher has reached maximum uses';
  END IF;
  
  -- Check one use per user
  IF _voucher.one_use_per_user THEN
    SELECT EXISTS(
      SELECT 1 FROM public.special_voucher_redemptions
      WHERE voucher_id = _voucher.id AND user_id = _user_id
    ) INTO _already_redeemed;
    
    IF _already_redeemed THEN
      RAISE EXCEPTION 'You have already redeemed this voucher';
    END IF;
  END IF;
  
  -- Mark attempt as successful
  UPDATE public.voucher_redemption_attempts
  SET success = true
  WHERE user_id = _user_id 
    AND code_attempted = upper(_code)
    AND attempt_time = (
      SELECT MAX(attempt_time) 
      FROM public.voucher_redemption_attempts 
      WHERE user_id = _user_id AND code_attempted = upper(_code)
    );
  
  -- Record redemption
  INSERT INTO public.special_voucher_redemptions (voucher_id, user_id)
  VALUES (_voucher.id, _user_id);
  
  -- Update use count
  UPDATE public.special_vouchers
  SET current_uses = current_uses + 1
  WHERE id = _voucher.id;
  
  -- Add credits if any
  IF _voucher.credits_amount > 0 THEN
    UPDATE public.profiles
    SET credits = LEAST(credits + _voucher.credits_amount, 100000), updated_at = now()
    WHERE user_id = _user_id;
  END IF;
  
  -- Add XP if any
  IF _voucher.xp_amount > 0 THEN
    UPDATE public.profiles
    SET xp = xp + _voucher.xp_amount, updated_at = now()
    WHERE user_id = _user_id;
  END IF;
  
  RETURN jsonb_build_object(
    'credits', _voucher.credits_amount,
    'xp', _voucher.xp_amount
  );
END;
$$;

-- Clean up old attempts periodically (keep last 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_voucher_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.voucher_redemption_attempts
  WHERE attempt_time < NOW() - INTERVAL '24 hours';
END;
$$;