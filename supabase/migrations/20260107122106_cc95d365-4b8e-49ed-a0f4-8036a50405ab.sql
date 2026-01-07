-- Remove the permissive INSERT policy from automod_logs
-- The edge function uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS,
-- so no INSERT policy is needed for authenticated users
DROP POLICY IF EXISTS "System can insert automod logs" ON public.automod_logs;