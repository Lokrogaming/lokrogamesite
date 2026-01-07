-- Allow owners to manage special vouchers (in addition to admins)
CREATE POLICY "Owners can manage special vouchers"
ON public.special_vouchers
FOR ALL
USING (is_owner(auth.uid()))
WITH CHECK (is_owner(auth.uid()));