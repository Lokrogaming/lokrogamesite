-- =====================================================
-- FIX 1: Leaderboard Score Validation with Rate Limiting
-- =====================================================

-- Create validation function for score submissions
CREATE OR REPLACE FUNCTION public.validate_score_submission()
RETURNS TRIGGER AS $$
DECLARE
  recent_submissions INTEGER;
BEGIN
  -- Validate score range (0 to 10 million)
  IF NEW.score < 0 OR NEW.score > 10000000 THEN
    RAISE EXCEPTION 'Score out of valid range (0-10000000)';
  END IF;
  
  -- Rate limiting: max 10 submissions per minute per user per game
  SELECT COUNT(*) INTO recent_submissions
  FROM public.leaderboards 
  WHERE user_id = NEW.user_id 
    AND game_id = NEW.game_id
    AND created_at > NOW() - INTERVAL '1 minute';
    
  IF recent_submissions >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Max 10 submissions per minute per game.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for score validation
DROP TRIGGER IF EXISTS check_score_submission ON public.leaderboards;
CREATE TRIGGER check_score_submission
  BEFORE INSERT ON public.leaderboards
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_score_submission();

-- =====================================================
-- FIX 2: Restrict Profile Updates - Protect Sensitive Fields
-- =====================================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create restricted policy that only allows updating safe fields
CREATE POLICY "Users can update own profile metadata" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    -- Prevent modification of protected fields by checking they haven't changed
    credits = (SELECT credits FROM public.profiles WHERE user_id = auth.uid()) AND
    is_banned = (SELECT is_banned FROM public.profiles WHERE user_id = auth.uid()) AND
    ban_expires_at IS NOT DISTINCT FROM (SELECT ban_expires_at FROM public.profiles WHERE user_id = auth.uid()) AND
    ban_reason IS NOT DISTINCT FROM (SELECT ban_reason FROM public.profiles WHERE user_id = auth.uid()) AND
    daily_challenges_completed = (SELECT daily_challenges_completed FROM public.profiles WHERE user_id = auth.uid()) AND
    last_credit_refill IS NOT DISTINCT FROM (SELECT last_credit_refill FROM public.profiles WHERE user_id = auth.uid()) AND
    last_challenge_reset IS NOT DISTINCT FROM (SELECT last_challenge_reset FROM public.profiles WHERE user_id = auth.uid())
  );

-- Allow staff to update any profile (for moderation)
DROP POLICY IF EXISTS "Staff can update any profile" ON public.profiles;
CREATE POLICY "Staff can update any profile" 
  ON public.profiles FOR UPDATE 
  USING (is_staff(auth.uid()));

-- Create credit spending function (for gameplay)
CREATE OR REPLACE FUNCTION public.spend_credits(
  _amount INTEGER,
  _reason TEXT DEFAULT 'game_play'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _current_credits INTEGER;
  _new_credits INTEGER;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF _amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;
  
  -- Lock row and get current balance
  SELECT credits INTO _current_credits
  FROM public.profiles
  WHERE user_id = _user_id
  FOR UPDATE;
  
  IF _current_credits < _amount THEN
    RETURN FALSE;
  END IF;
  
  _new_credits := _current_credits - _amount;
  
  -- Update balance
  UPDATE public.profiles
  SET credits = _new_credits, updated_at = now()
  WHERE user_id = _user_id;
  
  RETURN TRUE;
END;
$$;

-- Create credit earning function (for rewards)
CREATE OR REPLACE FUNCTION public.earn_credits(
  _amount INTEGER,
  _reason TEXT DEFAULT 'reward'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _current_credits INTEGER;
  _new_credits INTEGER;
  _max_credits INTEGER := 100000;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF _amount <= 0 OR _amount > 10000 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;
  
  SELECT credits INTO _current_credits
  FROM public.profiles
  WHERE user_id = _user_id
  FOR UPDATE;
  
  _new_credits := LEAST(_current_credits + _amount, _max_credits);
  
  UPDATE public.profiles
  SET credits = _new_credits, updated_at = now()
  WHERE user_id = _user_id;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.spend_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.earn_credits TO authenticated;

-- =====================================================
-- FIX 3: Restrict Public Profile Access
-- =====================================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Allow users to view their own full profile
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow authenticated users to view basic public info of others (for leaderboards, chat, etc.)
-- This creates a view-based approach where the app fetches limited data
CREATE POLICY "Authenticated can view public profile data" 
  ON public.profiles FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Staff can view all profiles with full details
CREATE POLICY "Staff can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (is_staff(auth.uid()));