-- Fix function search path for generate_address_number
CREATE OR REPLACE FUNCTION generate_address_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_address TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    new_address := UPPER(
      SUBSTR(MD5(RANDOM()::TEXT), 1, 4) || '-' || 
      SUBSTR(MD5(RANDOM()::TEXT), 1, 4)
    );
    
    SELECT EXISTS(SELECT 1 FROM profiles WHERE address_number = new_address) INTO exists_check;
    
    IF NOT exists_check THEN
      RETURN new_address;
    END IF;
  END LOOP;
END;
$$;