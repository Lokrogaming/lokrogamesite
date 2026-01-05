-- Add internal address number to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_number TEXT UNIQUE;

-- Create function to generate unique address numbers
CREATE OR REPLACE FUNCTION generate_address_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_address TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate format: XXXX-XXXX (8 chars with hyphen)
    new_address := UPPER(
      SUBSTR(MD5(RANDOM()::TEXT), 1, 4) || '-' || 
      SUBSTR(MD5(RANDOM()::TEXT), 1, 4)
    );
    
    -- Check if exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE address_number = new_address) INTO exists_check;
    
    IF NOT exists_check THEN
      RETURN new_address;
    END IF;
  END LOOP;
END;
$$;

-- Create trigger to auto-generate address on profile creation
CREATE OR REPLACE FUNCTION set_address_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.address_number IS NULL THEN
    NEW.address_number := generate_address_number();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_address_number ON profiles;
CREATE TRIGGER trigger_set_address_number
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_address_number();

-- Update existing profiles with address numbers
UPDATE profiles SET address_number = generate_address_number() WHERE address_number IS NULL;

-- Friendships table
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  addressee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friendships they're part of"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can delete own friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Direct messages table
CREATE TABLE public.direct_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON public.direct_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON public.direct_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages"
  ON public.direct_messages FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Message requests table (for non-friends)
CREATE TABLE public.message_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

ALTER TABLE public.message_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own message requests"
  ON public.message_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send message requests"
  ON public.message_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can update message requests"
  ON public.message_requests FOR UPDATE
  USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete own message requests"
  ON public.message_requests FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Function to check if two users are friends
CREATE OR REPLACE FUNCTION are_friends(_user1 UUID, _user2 UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM friendships 
    WHERE status = 'accepted'
    AND ((requester_id = _user1 AND addressee_id = _user2) 
      OR (requester_id = _user2 AND addressee_id = _user1))
  );
END;
$$;

-- Function to check if message request is accepted
CREATE OR REPLACE FUNCTION has_message_access(_sender UUID, _receiver UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Check if friends
  IF are_friends(_sender, _receiver) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if message request accepted
  RETURN EXISTS(
    SELECT 1 FROM message_requests 
    WHERE status = 'accepted'
    AND ((sender_id = _sender AND receiver_id = _receiver) 
      OR (sender_id = _receiver AND receiver_id = _sender))
  );
END;
$$;

-- Enable realtime for direct messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_requests;