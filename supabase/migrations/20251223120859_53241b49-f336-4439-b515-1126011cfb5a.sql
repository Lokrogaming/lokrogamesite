-- Add new profile fields for enhanced profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS tag TEXT,
ADD COLUMN IF NOT EXISTS favorite_game TEXT,
ADD COLUMN IF NOT EXISTS social_link TEXT;

-- Add constraint for description length
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_description_length CHECK (description IS NULL OR LENGTH(description) <= 500);

-- Add constraint for tag length
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_tag_length CHECK (tag IS NULL OR LENGTH(tag) <= 30);