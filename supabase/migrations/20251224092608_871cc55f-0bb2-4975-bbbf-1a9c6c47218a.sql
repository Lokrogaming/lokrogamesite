-- Create rank type enum
CREATE TYPE public.user_rank AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'queen', 'king', 'legend');

-- Add rank column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rank user_rank DEFAULT 'bronze';

-- Create credit vouchers table
CREATE TABLE public.credit_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  code TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  is_redeemed BOOLEAN DEFAULT false,
  redeemed_by UUID,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on vouchers
ALTER TABLE public.credit_vouchers ENABLE ROW LEVEL SECURITY;

-- RLS policies for vouchers
CREATE POLICY "Users can view own created vouchers"
ON public.credit_vouchers
FOR SELECT
USING (auth.uid() = creator_id);

CREATE POLICY "Users can create vouchers"
ON public.credit_vouchers
FOR INSERT
WITH CHECK (auth.uid() = creator_id);

-- Function to create a voucher (deducts credits + 10% tax)
CREATE OR REPLACE FUNCTION public.create_voucher(
  _amount INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _current_credits INTEGER;
  _total_cost INTEGER;
  _voucher_code TEXT;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF _amount < 10 OR _amount > 10000 THEN
    RAISE EXCEPTION 'Amount must be between 10 and 10000';
  END IF;
  
  -- Calculate total cost with 10% tax
  _total_cost := _amount + CEIL(_amount * 0.1);
  
  -- Lock row and get current balance
  SELECT credits INTO _current_credits
  FROM public.profiles
  WHERE user_id = _user_id
  FOR UPDATE;
  
  IF _current_credits < _total_cost THEN
    RAISE EXCEPTION 'Insufficient credits. You need % credits (including 10%% tax)', _total_cost;
  END IF;
  
  -- Generate unique code
  _voucher_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
  
  -- Deduct credits
  UPDATE public.profiles
  SET credits = credits - _total_cost, updated_at = now()
  WHERE user_id = _user_id;
  
  -- Create voucher
  INSERT INTO public.credit_vouchers (creator_id, code, amount)
  VALUES (_user_id, _voucher_code, _amount);
  
  RETURN _voucher_code;
END;
$$;

-- Function to redeem a voucher
CREATE OR REPLACE FUNCTION public.redeem_voucher(
  _code TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _voucher_id UUID;
  _voucher_amount INTEGER;
  _creator_id UUID;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_voucher TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_voucher TO authenticated;