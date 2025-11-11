-- Ensure the trigger function exists and handles all cases
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile for new user, using COALESCE for safe defaults
  INSERT INTO public.profiles (
    id,
    auth_user_id,
    email,
    phone_number,
    first_name,
    last_name,
    username,
    email_verified,
    phone_verified
  )
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    (NEW.email_confirmed_at IS NOT NULL),
    (NEW.phone_confirmed_at IS NOT NULL)
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger to ensure it's active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill missing profiles for existing auth users
INSERT INTO public.profiles (
  id,
  auth_user_id,
  email,
  phone_number,
  first_name,
  last_name,
  username,
  email_verified,
  phone_verified
)
SELECT 
  u.id,
  u.id,
  u.email,
  u.phone,
  COALESCE(u.raw_user_meta_data->>'first_name', ''),
  COALESCE(u.raw_user_meta_data->>'last_name', ''),
  COALESCE(u.raw_user_meta_data->>'username', SPLIT_PART(u.email, '@', 1)),
  (u.email_confirmed_at IS NOT NULL),
  (u.phone_confirmed_at IS NOT NULL)
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL  -- Only insert where profile doesn't exist
ON CONFLICT (id) DO NOTHING;