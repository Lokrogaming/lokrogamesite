-- Create moderation action type enum
CREATE TYPE public.moderation_action AS ENUM ('ban', 'kick', 'timeout', 'unban', 'warn');

-- Create user moderation logs table
CREATE TABLE public.user_moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    moderator_id UUID REFERENCES auth.users(id) NOT NULL,
    action moderation_action NOT NULL,
    reason TEXT NOT NULL,
    duration_minutes INTEGER, -- For timeouts
    expires_at TIMESTAMPTZ, -- When timeout/ban expires (null = permanent)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add ban status to profiles
ALTER TABLE public.profiles 
ADD COLUMN is_banned BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN ban_expires_at TIMESTAMPTZ,
ADD COLUMN ban_reason TEXT;

-- Create staff messages table for internal chat
CREATE TABLE public.staff_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for moderation logs
CREATE POLICY "Staff can view all moderation logs" 
    ON public.user_moderation_logs FOR SELECT 
    USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can create moderation logs" 
    ON public.user_moderation_logs FOR INSERT 
    WITH CHECK (public.is_staff(auth.uid()));

-- RLS Policies for staff messages
CREATE POLICY "Staff can view staff messages" 
    ON public.staff_messages FOR SELECT 
    USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can send staff messages" 
    ON public.staff_messages FOR INSERT 
    WITH CHECK (public.is_staff(auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Staff can delete own messages" 
    ON public.staff_messages FOR DELETE 
    USING (public.is_staff(auth.uid()) AND auth.uid() = user_id);

-- Enable realtime for staff messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_messages;