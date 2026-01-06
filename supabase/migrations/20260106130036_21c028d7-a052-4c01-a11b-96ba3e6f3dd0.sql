-- Create support tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_to UUID
);

-- Create support messages table
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  is_staff BOOLEAN NOT NULL DEFAULT false,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for support_tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all tickets" ON public.support_tickets
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Staff can update tickets" ON public.support_tickets
  FOR UPDATE USING (is_staff(auth.uid()));

-- RLS policies for support_messages
CREATE POLICY "Users can view messages in own tickets" ON public.support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t 
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to own tickets" ON public.support_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.support_tickets t 
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view all messages" ON public.support_messages
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Staff can send messages" ON public.support_messages
  FOR INSERT WITH CHECK (is_staff(auth.uid()) AND is_staff = true);

-- Create system_messages table for welcome messages etc
CREATE TABLE public.system_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.system_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own system messages" ON public.system_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own system messages" ON public.system_messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert messages" ON public.system_messages
  FOR INSERT WITH CHECK (true);

-- Enable realtime for support messages and system messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_messages;

-- Function to send welcome message on profile creation
CREATE OR REPLACE FUNCTION public.send_welcome_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.system_messages (user_id, title, content)
  VALUES (
    NEW.user_id,
    'Welcome to LokroGames! 🎮',
    E'Hey there, welcome to LokroGames!\n\nWe''re excited to have you join our gaming community. Here''s what you can do:\n\n• Play 14+ free browser games and earn credits\n• Complete daily challenges for bonus rewards\n• Chat with other players in the global chat\n• Add friends and send direct messages\n• Open support tickets if you need help\n\nStart by exploring our games and have fun! If you have any questions, don''t hesitate to open a support ticket.\n\n- The LokroGames Team'
  );
  RETURN NEW;
END;
$$;

-- Trigger to send welcome message when profile is created
CREATE TRIGGER on_profile_created_welcome
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_message();