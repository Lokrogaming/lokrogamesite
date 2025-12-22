-- Create global chat messages table
CREATE TABLE public.global_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    reply_to_id UUID REFERENCES public.global_messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.global_messages ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view messages
CREATE POLICY "Authenticated users can view messages"
ON public.global_messages
FOR SELECT
TO authenticated
USING (true);

-- Users can insert their own messages
CREATE POLICY "Users can insert own messages"
ON public.global_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can soft-delete their own messages
CREATE POLICY "Users can update own messages"
ON public.global_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Staff can update any message (for moderation)
CREATE POLICY "Staff can update any message"
ON public.global_messages
FOR UPDATE
TO authenticated
USING (is_staff(auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_messages;