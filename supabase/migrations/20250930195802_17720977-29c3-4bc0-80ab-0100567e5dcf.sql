-- Add username column to profiles table
ALTER TABLE public.profiles
ADD COLUMN username TEXT UNIQUE;

-- Remove full_name column
ALTER TABLE public.profiles
DROP COLUMN full_name;

-- Update the handle_new_user function to use username instead of full_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  insert into public.profiles (id, email, username, first_name, last_name)
  values (
    new.id, 
    new.email,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  return new;
end;
$$;