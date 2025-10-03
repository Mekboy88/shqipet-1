-- Fix missing columns that are being referenced in the code
-- Add auth_user_id column to profiles table
alter table public.profiles add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

-- Add is_active column to user_roles table
alter table public.user_roles add column if not exists is_active boolean not null default true;

-- Update existing profiles to set auth_user_id = id where it's null
update public.profiles set auth_user_id = id where auth_user_id is null;

-- Create index for performance
create index if not exists idx_profiles_auth_user_id on public.profiles(auth_user_id);
create index if not exists idx_user_roles_is_active on public.user_roles(is_active);