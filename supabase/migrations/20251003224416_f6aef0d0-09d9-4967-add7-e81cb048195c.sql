-- Create missing database functions that are referenced in the code

-- Create sync_phone_verification_status function
create or replace function public.sync_phone_verification_status(
  user_uuid uuid,
  phone_number_param text,
  is_verified boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Update the profiles table with phone verification status
  update public.profiles
  set 
    phone_verified = is_verified,
    updated_at = now()
  where auth_user_id = user_uuid or id = user_uuid;
  
  -- Log the sync action
  insert into public.admin_actions (
    actor_id,
    action_type,
    reason
  ) values (
    user_uuid,
    'phone_verification_sync',
    format('Phone verification status synced: %s for %s', is_verified, phone_number_param)
  );
end;
$$;

-- Create sync_user_verification_status function for bulk sync
create or replace function public.sync_user_verification_status()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_record record;
  auth_user_record record;
begin
  -- Sync verification status from auth.users to profiles
  for profile_record in 
    select id, auth_user_id from public.profiles 
    where auth_user_id is not null
  loop
    -- Get auth user data (this is a simplified version - in practice you'd use admin functions)
    select email_confirmed_at, phone_confirmed_at
    into auth_user_record
    from auth.users 
    where id = profile_record.auth_user_id;
    
    if found then
      update public.profiles
      set 
        email_verified = (auth_user_record.email_confirmed_at is not null),
        phone_verified = (auth_user_record.phone_confirmed_at is not null),
        updated_at = now()
      where id = profile_record.id;
    end if;
  end loop;
end;
$$;

-- Create system_health_metrics table that's referenced in the code
create table if not exists public.system_health_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_name text not null,
  metric_value jsonb,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Enable RLS on system_health_metrics
alter table public.system_health_metrics enable row level security;

-- Only admins can access system health metrics
create policy "Admins can access system health metrics"
  on public.system_health_metrics for all
  using (public.current_user_is_admin() or public.is_platform_owner(auth.uid()));

-- Add missing columns to profiles table
alter table public.profiles add column if not exists email_verified boolean default false;
alter table public.profiles add column if not exists phone_verified boolean default false;

-- Create indexes for performance
create index if not exists idx_system_health_metrics_recorded_at on public.system_health_metrics(recorded_at desc);
create index if not exists idx_profiles_verification on public.profiles(email_verified, phone_verified);