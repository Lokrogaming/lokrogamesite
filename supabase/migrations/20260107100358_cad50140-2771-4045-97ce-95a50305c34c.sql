-- Drop existing view
DROP VIEW IF EXISTS public_profiles;

-- Recreate view with SECURITY DEFINER to allow public access
CREATE OR REPLACE VIEW public_profiles 
WITH (security_invoker = false)
AS
SELECT 
  user_id,
  username,
  avatar_url,
  rank,
  description,
  tag,
  favorite_game,
  social_link,
  xp,
  created_at
FROM profiles;

-- Grant SELECT access to anonymous users
GRANT SELECT ON public_profiles TO anon;
GRANT SELECT ON public_profiles TO authenticated;