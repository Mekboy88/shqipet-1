-- Add phone_number column first
ALTER TABLE public.profiles
ADD COLUMN phone_number TEXT;

-- In PostgreSQL, we need to recreate the table to reorder columns
-- Create new table with desired column order
CREATE TABLE public.profiles_new (
  id UUID PRIMARY KEY,
  email TEXT,
  phone_number TEXT,
  first_name TEXT,
  last_name TEXT,
  username TEXT UNIQUE,
  date_of_birth DATE,
  bio TEXT,
  gender TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  primary_role TEXT,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Copy all data from old table to new table
INSERT INTO public.profiles_new (
  id, email, phone_number, first_name, last_name, username, 
  date_of_birth, bio, gender, avatar_url, cover_url, 
  primary_role, is_hidden, created_at, updated_at
)
SELECT 
  id, email, phone_number, first_name, last_name, username,
  date_of_birth, bio, gender, avatar_url, cover_url,
  primary_role, is_hidden, created_at, updated_at
FROM public.profiles;

-- Drop old table
DROP TABLE public.profiles;

-- Rename new table
ALTER TABLE public.profiles_new RENAME TO profiles;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Recreate the updated_at trigger
CREATE TRIGGER handle_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Update the handle_new_user function to include phone_number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  insert into public.profiles (id, email, phone_number, username, first_name, last_name)
  values (
    new.id, 
    new.email,
    new.phone,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  return new;
end;
$$;