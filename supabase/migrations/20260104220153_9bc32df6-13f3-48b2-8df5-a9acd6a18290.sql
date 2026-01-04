-- Function to award items to a user (stacks with existing)
CREATE OR REPLACE FUNCTION public.award_item(_user_id uuid, _item_type_id uuid, _quantity integer DEFAULT 1)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_inventory (user_id, item_type_id, quantity)
  VALUES (_user_id, _item_type_id, _quantity)
  ON CONFLICT (user_id, item_type_id) 
  DO UPDATE SET quantity = user_inventory.quantity + _quantity, updated_at = now();
  
  RETURN true;
END;
$$;