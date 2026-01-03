-- Add king and queen to user_rank if not exists (handled by previous migration)
-- Create special_vouchers table for admin vouchers
CREATE TABLE public.special_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL,
    code TEXT NOT NULL UNIQUE,
    credits_amount INTEGER NOT NULL DEFAULT 0,
    xp_amount INTEGER NOT NULL DEFAULT 0,
    max_uses INTEGER DEFAULT NULL,
    current_uses INTEGER NOT NULL DEFAULT 0,
    one_use_per_user BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Track who redeemed special vouchers
CREATE TABLE public.special_voucher_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id UUID NOT NULL REFERENCES public.special_vouchers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(voucher_id, user_id)
);

-- Enable RLS
ALTER TABLE public.special_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_voucher_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for special_vouchers
CREATE POLICY "Admins can manage special vouchers"
ON public.special_vouchers
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active special vouchers for redemption"
ON public.special_vouchers
FOR SELECT
USING (is_active = true);

-- RLS policies for special_voucher_redemptions
CREATE POLICY "Users can view own redemptions"
ON public.special_voucher_redemptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert redemptions"
ON public.special_voucher_redemptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all redemptions"
ON public.special_voucher_redemptions
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create function to redeem special voucher
CREATE OR REPLACE FUNCTION public.redeem_special_voucher(_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _voucher RECORD;
  _already_redeemed BOOLEAN;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
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

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.redeem_special_voucher(TEXT) TO authenticated;

-- Create automod_logs table to track flagged messages
CREATE TABLE public.automod_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES public.global_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    original_content TEXT NOT NULL,
    flagged_reason TEXT NOT NULL,
    action_taken TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.automod_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view automod logs"
ON public.automod_logs
FOR SELECT
USING (is_staff(auth.uid()));

CREATE POLICY "System can insert automod logs"
ON public.automod_logs
FOR INSERT
WITH CHECK (true);

-- Enable realtime for automod_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.automod_logs;