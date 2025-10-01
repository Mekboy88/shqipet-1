-- Create trigger to auto-create profiles on auth user signup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Create admin_actions table for auditing admin operations
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_admin_actions_actor_id ON public.admin_actions(actor_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_user_id ON public.admin_actions(target_user_id);

-- Enable RLS and policies
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Allow admins to insert their own actions
DROP POLICY IF EXISTS "Users can log their admin actions" ON public.admin_actions;
CREATE POLICY "Users can log their admin actions"
  ON public.admin_actions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = actor_id);

-- Allow actors and targets to view relevant logs (optional, safe default)
DROP POLICY IF EXISTS "Users can view own related admin actions" ON public.admin_actions;
CREATE POLICY "Users can view own related admin actions"
  ON public.admin_actions
  FOR SELECT TO authenticated
  USING (auth.uid() = actor_id OR auth.uid() = target_user_id);

COMMENT ON TABLE public.admin_actions IS 'Audit log of administrative actions (password resets, role changes, etc.)';