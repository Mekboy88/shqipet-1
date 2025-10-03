-- Create all remaining missing tables that are referenced in the code

-- Create app_settings table
create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

create policy "Admins can manage app settings"
  on public.app_settings for all
  using (public.current_user_is_admin() or public.is_platform_owner(auth.uid()));

-- Create analytics_events table
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  event_data jsonb,
  created_at timestamptz not null default now()
);

alter table public.analytics_events enable row level security;

create policy "Users can insert their own analytics"
  on public.analytics_events for insert
  with check (user_id = auth.uid() or user_id is null);

create policy "Admins can view all analytics"
  on public.analytics_events for select
  using (public.current_user_is_admin() or public.is_platform_owner(auth.uid()));

-- Create security_events table
create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  event_description text,
  risk_level text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.security_events enable row level security;

create policy "Admins can manage security events"
  on public.security_events for all
  using (public.current_user_is_admin() or public.is_platform_owner(auth.uid()));

-- Create system_issues table
create table if not exists public.system_issues (
  id uuid primary key default gen_random_uuid(),
  issue_type text not null,
  severity text not null,
  issue_description text,
  status text default 'open',
  metadata jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.system_issues enable row level security;

create policy "Admins can manage system issues"
  on public.system_issues for all
  using (public.current_user_is_admin() or public.is_platform_owner(auth.uid()));

-- Create brute_force_alerts table
create table if not exists public.brute_force_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  alert_type text not null,
  ip_address text,
  attempt_count integer,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.brute_force_alerts enable row level security;

create policy "Admins can view brute force alerts"
  on public.brute_force_alerts for select
  using (public.current_user_is_admin() or public.is_platform_owner(auth.uid()));

-- Create triggers
create trigger handle_app_settings_updated_at
before update on public.app_settings
for each row execute function public.handle_updated_at();

-- Create indexes for performance
create index if not exists idx_app_settings_key on public.app_settings(key);
create index if not exists idx_analytics_events_user_id on public.analytics_events(user_id);
create index if not exists idx_analytics_events_created_at on public.analytics_events(created_at desc);
create index if not exists idx_security_events_created_at on public.security_events(created_at desc);
create index if not exists idx_security_events_risk_level on public.security_events(risk_level);
create index if not exists idx_system_issues_severity on public.system_issues(severity);
create index if not exists idx_system_issues_status on public.system_issues(status);
create index if not exists idx_brute_force_alerts_created_at on public.brute_force_alerts(created_at desc);

-- Enable realtime for critical tables
alter publication supabase_realtime add table public.security_events;
alter publication supabase_realtime add table public.system_issues;