ALTER TYPE public.user_rank ADD VALUE IF NOT EXISTS 'queen' AFTER 'master';
ALTER TYPE public.user_rank ADD VALUE IF NOT EXISTS 'king' AFTER 'queen';
