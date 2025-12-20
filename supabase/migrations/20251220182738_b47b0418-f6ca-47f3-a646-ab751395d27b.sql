-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'staff', 'user');

-- Create game_category enum
CREATE TYPE public.game_category AS ENUM ('arcade', 'puzzle', 'card', 'casual', 'ai', 'multiplayer', 'community');

-- Create mood enum for AI games
CREATE TYPE public.mood_type AS ENUM ('very_sad', 'sad', 'neutral', 'happy', 'very_happy');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    username TEXT,
    avatar_url TEXT,
    credits INTEGER NOT NULL DEFAULT 100,
    last_credit_refill TIMESTAMPTZ DEFAULT now(),
    daily_challenges_completed INTEGER NOT NULL DEFAULT 0,
    last_challenge_reset TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create games table
CREATE TABLE public.games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category game_category NOT NULL DEFAULT 'arcade',
    icon TEXT,
    path TEXT NOT NULL,
    cost_per_play INTEGER NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_community BOOLEAN NOT NULL DEFAULT false,
    submitted_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create game_submissions table
CREATE TABLE public.game_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    game_name TEXT NOT NULL,
    description TEXT,
    category game_category NOT NULL,
    game_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewer_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ
);

-- Create daily_challenges table
CREATE TABLE public.daily_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    game_id UUID REFERENCES public.games(id),
    target_score INTEGER,
    reward_credits INTEGER NOT NULL DEFAULT 20,
    challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_challenges table
CREATE TABLE public.user_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    challenge_id UUID REFERENCES public.daily_challenges(id) ON DELETE CASCADE NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, challenge_id)
);

-- Create leaderboards table
CREATE TABLE public.leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create multiplayer_sessions table
CREATE TABLE public.multiplayer_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    guest_id UUID REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'waiting',
    game_state JSONB,
    winner_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ai_conversations table for mood games
CREATE TABLE public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    current_mood mood_type NOT NULL DEFAULT 'neutral',
    target_mood mood_type NOT NULL,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_complete BOOLEAN NOT NULL DEFAULT false,
    won BOOLEAN,
    credits_won INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Function to check if user is staff or admin
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role IN ('staff', 'admin', 'moderator')
    )
$$;

-- Profile policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies (only admins can manage)
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Games policies
CREATE POLICY "Anyone can view active games" ON public.games FOR SELECT USING (is_active = true);
CREATE POLICY "Staff can manage games" ON public.games FOR ALL USING (public.is_staff(auth.uid()));

-- Game submissions policies
CREATE POLICY "Users can view own submissions" ON public.game_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create submissions" ON public.game_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff can view all submissions" ON public.game_submissions FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update submissions" ON public.game_submissions FOR UPDATE USING (public.is_staff(auth.uid()));

-- Daily challenges policies
CREATE POLICY "Anyone can view challenges" ON public.daily_challenges FOR SELECT USING (true);
CREATE POLICY "Staff can manage challenges" ON public.daily_challenges FOR ALL USING (public.is_staff(auth.uid()));

-- User challenges policies
CREATE POLICY "Users can view own challenges" ON public.user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own challenges" ON public.user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own challenges" ON public.user_challenges FOR UPDATE USING (auth.uid() = user_id);

-- Leaderboards policies
CREATE POLICY "Anyone can view leaderboards" ON public.leaderboards FOR SELECT USING (true);
CREATE POLICY "Users can insert own scores" ON public.leaderboards FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Multiplayer sessions policies
CREATE POLICY "Anyone can view sessions" ON public.multiplayer_sessions FOR SELECT USING (true);
CREATE POLICY "Users can create sessions" ON public.multiplayer_sessions FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Participants can update sessions" ON public.multiplayer_sessions FOR UPDATE USING (auth.uid() = host_id OR auth.uid() = guest_id);

-- AI conversations policies
CREATE POLICY "Users can view own conversations" ON public.ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own conversations" ON public.ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.ai_conversations FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime for multiplayer
ALTER PUBLICATION supabase_realtime ADD TABLE public.multiplayer_sessions;

-- Create trigger function for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, username)
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'username');
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_multiplayer_sessions_updated_at BEFORE UPDATE ON public.multiplayer_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();