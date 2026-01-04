-- Add birthday field to profiles (cannot be changed once set)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birthday date,
ADD COLUMN IF NOT EXISTS last_birthday_reward date;

-- Create item_types table for boosters and items
CREATE TABLE public.item_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  category text NOT NULL DEFAULT 'booster', -- 'booster', 'cosmetic', 'consumable'
  effect_type text, -- 'credit_multiplier', 'xp_multiplier', 'free_play'
  effect_value numeric, -- e.g., 2 for 2x multiplier
  duration_minutes integer, -- how long the effect lasts when activated
  icon text DEFAULT 'Gift',
  rarity text DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  is_tradeable boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_inventory table
CREATE TABLE public.user_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  item_type_id uuid NOT NULL REFERENCES public.item_types(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type_id)
);

-- Create active_boosters table to track currently active boosters
CREATE TABLE public.active_boosters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  item_type_id uuid NOT NULL REFERENCES public.item_types(id) ON DELETE CASCADE,
  activated_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  is_active boolean DEFAULT true
);

-- Create gift_codes table for item gifts
CREATE TABLE public.gift_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  creator_id uuid NOT NULL,
  items jsonb NOT NULL DEFAULT '[]', -- Array of {item_type_id, quantity}
  message text,
  is_redeemed boolean DEFAULT false,
  redeemed_by uuid,
  redeemed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.item_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_boosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_codes ENABLE ROW LEVEL SECURITY;

-- RLS for item_types (anyone can view)
CREATE POLICY "Anyone can view item types" ON public.item_types FOR SELECT USING (true);
CREATE POLICY "Staff can manage item types" ON public.item_types FOR ALL USING (is_staff(auth.uid()));

-- RLS for user_inventory
CREATE POLICY "Users can view own inventory" ON public.user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own inventory" ON public.user_inventory FOR ALL USING (auth.uid() = user_id);

-- RLS for active_boosters
CREATE POLICY "Users can view own active boosters" ON public.active_boosters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own boosters" ON public.active_boosters FOR ALL USING (auth.uid() = user_id);

-- RLS for gift_codes
CREATE POLICY "Users can view own created gifts" ON public.gift_codes FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Users can create gifts" ON public.gift_codes FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Anyone can view unredeemed gifts for redemption" ON public.gift_codes FOR SELECT USING (is_redeemed = false);

-- Insert default booster types
INSERT INTO public.item_types (name, description, category, effect_type, effect_value, duration_minutes, icon, rarity) VALUES
('2x Credit Booster', 'Double your credit earnings for 30 minutes', 'booster', 'credit_multiplier', 2, 30, 'Coins', 'common'),
('3x Credit Booster', 'Triple your credit earnings for 30 minutes', 'booster', 'credit_multiplier', 3, 30, 'Coins', 'rare'),
('2x XP Booster', 'Double your XP earnings for 30 minutes', 'booster', 'xp_multiplier', 2, 30, 'Zap', 'common'),
('3x XP Booster', 'Triple your XP earnings for 30 minutes', 'booster', 'xp_multiplier', 3, 30, 'Zap', 'rare'),
('Free Play Token', 'Play any game once without spending credits', 'consumable', 'free_play', 1, NULL, 'Ticket', 'common'),
('Lucky Charm', 'Increases win chance slightly for 1 hour', 'booster', 'luck_boost', 1.1, 60, 'Clover', 'epic');

-- Add reward_item_id to daily_challenges
ALTER TABLE public.daily_challenges 
ADD COLUMN IF NOT EXISTS reward_item_id uuid REFERENCES public.item_types(id),
ADD COLUMN IF NOT EXISTS reward_item_quantity integer DEFAULT 1;

-- Function to claim birthday reward
CREATE OR REPLACE FUNCTION public.claim_birthday_reward()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _birthday date;
  _last_reward date;
  _current_year integer := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT birthday, last_birthday_reward INTO _birthday, _last_reward
  FROM profiles WHERE user_id = _user_id;
  
  IF _birthday IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if birthday is today (month and day match)
  IF EXTRACT(MONTH FROM _birthday) != EXTRACT(MONTH FROM CURRENT_DATE) OR
     EXTRACT(DAY FROM _birthday) != EXTRACT(DAY FROM CURRENT_DATE) THEN
    RETURN false;
  END IF;
  
  -- Check if already claimed this year
  IF _last_reward IS NOT NULL AND EXTRACT(YEAR FROM _last_reward) = _current_year THEN
    RETURN false;
  END IF;
  
  -- Give 1000 credits and update last reward date
  UPDATE profiles 
  SET credits = credits + 1000, 
      last_birthday_reward = CURRENT_DATE,
      updated_at = now()
  WHERE user_id = _user_id;
  
  RETURN true;
END;
$$;

-- Function to activate a booster from inventory
CREATE OR REPLACE FUNCTION public.activate_booster(_item_type_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _quantity integer;
  _duration integer;
BEGIN
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user has the item
  SELECT quantity INTO _quantity
  FROM user_inventory
  WHERE user_id = _user_id AND item_type_id = _item_type_id;
  
  IF _quantity IS NULL OR _quantity < 1 THEN
    RETURN false;
  END IF;
  
  -- Get duration
  SELECT duration_minutes INTO _duration
  FROM item_types WHERE id = _item_type_id;
  
  IF _duration IS NULL THEN
    _duration := 30; -- Default 30 minutes
  END IF;
  
  -- Reduce quantity
  UPDATE user_inventory
  SET quantity = quantity - 1, updated_at = now()
  WHERE user_id = _user_id AND item_type_id = _item_type_id;
  
  -- Remove if quantity is 0
  DELETE FROM user_inventory
  WHERE user_id = _user_id AND item_type_id = _item_type_id AND quantity <= 0;
  
  -- Add to active boosters
  INSERT INTO active_boosters (user_id, item_type_id, expires_at)
  VALUES (_user_id, _item_type_id, now() + (_duration || ' minutes')::interval);
  
  RETURN true;
END;
$$;

-- Function to redeem gift code
CREATE OR REPLACE FUNCTION public.redeem_gift_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _gift record;
  _item jsonb;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  SELECT * INTO _gift FROM gift_codes WHERE code = _code AND is_redeemed = false;
  
  IF _gift IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or already redeemed code');
  END IF;
  
  -- Cannot redeem own gift
  IF _gift.creator_id = _user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot redeem your own gift');
  END IF;
  
  -- Add items to inventory
  FOR _item IN SELECT * FROM jsonb_array_elements(_gift.items)
  LOOP
    INSERT INTO user_inventory (user_id, item_type_id, quantity)
    VALUES (_user_id, (_item->>'item_type_id')::uuid, COALESCE((_item->>'quantity')::integer, 1))
    ON CONFLICT (user_id, item_type_id) 
    DO UPDATE SET quantity = user_inventory.quantity + COALESCE((_item->>'quantity')::integer, 1), updated_at = now();
  END LOOP;
  
  -- Mark gift as redeemed
  UPDATE gift_codes 
  SET is_redeemed = true, redeemed_by = _user_id, redeemed_at = now()
  WHERE id = _gift.id;
  
  RETURN jsonb_build_object('success', true, 'message', _gift.message);
END;
$$;

-- Function to create gift code
CREATE OR REPLACE FUNCTION public.create_gift_code(_items jsonb, _message text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _code text;
  _item jsonb;
  _item_type_id uuid;
  _needed_qty integer;
  _current_qty integer;
BEGIN
  IF _user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Verify user has all items in sufficient quantities
  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _item_type_id := (_item->>'item_type_id')::uuid;
    _needed_qty := COALESCE((_item->>'quantity')::integer, 1);
    
    SELECT quantity INTO _current_qty
    FROM user_inventory
    WHERE user_id = _user_id AND item_type_id = _item_type_id;
    
    IF _current_qty IS NULL OR _current_qty < _needed_qty THEN
      RETURN NULL; -- Not enough items
    END IF;
  END LOOP;
  
  -- Deduct items from inventory
  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _item_type_id := (_item->>'item_type_id')::uuid;
    _needed_qty := COALESCE((_item->>'quantity')::integer, 1);
    
    UPDATE user_inventory
    SET quantity = quantity - _needed_qty, updated_at = now()
    WHERE user_id = _user_id AND item_type_id = _item_type_id;
  END LOOP;
  
  -- Remove zero quantity items
  DELETE FROM user_inventory WHERE user_id = _user_id AND quantity <= 0;
  
  -- Generate code
  _code := 'GIFT-' || upper(substring(gen_random_uuid()::text from 1 for 8));
  
  -- Create gift
  INSERT INTO gift_codes (code, creator_id, items, message)
  VALUES (_code, _user_id, _items, _message);
  
  RETURN _code;
END;
$$;

-- Insert sample daily challenges with item rewards
INSERT INTO public.daily_challenges (title, description, reward_credits, challenge_date, reward_item_id, reward_item_quantity)
SELECT 
  'Play 3 Games',
  'Play any 3 games today to earn credits and a booster!',
  50,
  CURRENT_DATE,
  (SELECT id FROM item_types WHERE name = '2x Credit Booster' LIMIT 1),
  1
WHERE NOT EXISTS (SELECT 1 FROM daily_challenges WHERE challenge_date = CURRENT_DATE AND title = 'Play 3 Games');

INSERT INTO public.daily_challenges (title, description, reward_credits, challenge_date, reward_item_id, reward_item_quantity)
SELECT 
  'Win Streak',
  'Win 2 games in a row for bonus rewards',
  75,
  CURRENT_DATE,
  (SELECT id FROM item_types WHERE name = '2x XP Booster' LIMIT 1),
  1
WHERE NOT EXISTS (SELECT 1 FROM daily_challenges WHERE challenge_date = CURRENT_DATE AND title = 'Win Streak');

INSERT INTO public.daily_challenges (title, description, reward_credits, challenge_date, reward_item_id, reward_item_quantity)
SELECT 
  'High Score Hunter',
  'Score over 1000 points in any game',
  100,
  CURRENT_DATE,
  (SELECT id FROM item_types WHERE name = 'Free Play Token' LIMIT 1),
  2
WHERE NOT EXISTS (SELECT 1 FROM daily_challenges WHERE challenge_date = CURRENT_DATE AND title = 'High Score Hunter');