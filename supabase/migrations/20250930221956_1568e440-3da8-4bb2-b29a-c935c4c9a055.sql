-- Add index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_active ON public.user_roles(user_id, is_active) WHERE is_active = true;

-- Ensure primary_role column exists in profiles table (idempotent)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'primary_role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN primary_role text;
  END IF;
END $$;

-- Function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_primary_role(target_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT role 
      FROM public.user_roles 
      WHERE user_id = target_user_id 
        AND is_active = true 
      ORDER BY 
        CASE role
          WHEN 'platform_owner_root' THEN 6
          WHEN 'super_admin' THEN 5
          WHEN 'admin' THEN 4
          WHEN 'moderator' THEN 3
          WHEN 'developer' THEN 2
          WHEN 'support' THEN 2
          ELSE 1
        END DESC
      LIMIT 1
    ),
    (SELECT primary_role FROM public.profiles WHERE id = target_user_id),
    'user'
  );
$$;

-- Function to sync primary_role in profiles table when user_roles changes
CREATE OR REPLACE FUNCTION public.sync_primary_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the profiles table with the highest role
  UPDATE public.profiles
  SET primary_role = public.get_user_primary_role(
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.user_id
      ELSE NEW.user_id
    END
  )
  WHERE id = CASE 
    WHEN TG_OP = 'DELETE' THEN OLD.user_id
    ELSE NEW.user_id
  END;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to auto-sync primary_role
DROP TRIGGER IF EXISTS sync_primary_role_trigger ON public.user_roles;
CREATE TRIGGER sync_primary_role_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_primary_role();

-- Backfill existing primary_role values for all users
UPDATE public.profiles
SET primary_role = public.get_user_primary_role(id)
WHERE id IN (SELECT DISTINCT user_id FROM public.user_roles WHERE is_active = true);