-- Update the handle_new_user function to include birthday
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, birthday)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data ->> 'username', new.raw_user_meta_data ->> 'full_name'),
    CASE 
      WHEN new.raw_user_meta_data ->> 'birthday' IS NOT NULL 
      THEN (new.raw_user_meta_data ->> 'birthday')::date 
      ELSE NULL 
    END
  );
  RETURN new;
EXCEPTION WHEN unique_violation THEN
  -- Profile already exists, update it instead
  UPDATE public.profiles 
  SET username = COALESCE(new.raw_user_meta_data ->> 'username', new.raw_user_meta_data ->> 'full_name', profiles.username),
      birthday = COALESCE(profiles.birthday, (new.raw_user_meta_data ->> 'birthday')::date)
  WHERE user_id = new.id;
  RETURN new;
END;
$$;