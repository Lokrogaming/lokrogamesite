
-- Add RLS policies for owners to manage all invite links
CREATE POLICY "Owners can view all invite links"
  ON public.invite_links FOR SELECT
  USING (is_owner(auth.uid()));

CREATE POLICY "Owners can update all invite links"
  ON public.invite_links FOR UPDATE
  USING (is_owner(auth.uid()));

CREATE POLICY "Owners can delete all invite links"
  ON public.invite_links FOR DELETE
  USING (is_owner(auth.uid()));

-- Add RLS policies for owners to view all invite redemptions
CREATE POLICY "Owners can view all invite redemptions"
  ON public.invite_redemptions FOR SELECT
  USING (is_owner(auth.uid()));
