-- Create admin_notifications table used across the app for admin-wide alerts
create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text,
  notification_type text,
  read boolean not null default false,
  user_id uuid references public.profiles(id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.admin_notifications enable row level security;

-- RLS Policies: restrict to admins/platform owners
create policy "Admins can view admin notifications"
  on public.admin_notifications for select
  using (public.current_user_is_admin() or public.is_platform_owner(auth.uid()));

create policy "Admins can insert admin notifications"
  on public.admin_notifications for insert
  with check (public.current_user_is_admin() or public.is_platform_owner(auth.uid()));

create policy "Admins can update admin notifications"
  on public.admin_notifications for update
  using (public.current_user_is_admin() or public.is_platform_owner(auth.uid()))
  with check (public.current_user_is_admin() or public.is_platform_owner(auth.uid()));

create policy "Admins can delete admin notifications"
  on public.admin_notifications for delete
  using (public.current_user_is_admin() or public.is_platform_owner(auth.uid()));

-- Keep updated_at in sync
create trigger handle_admin_notifications_updated_at
before update on public.admin_notifications
for each row execute function public.handle_updated_at();

-- Helpful indexes
create index if not exists idx_admin_notifications_created_at on public.admin_notifications(created_at desc);
create index if not exists idx_admin_notifications_type on public.admin_notifications(notification_type);
create index if not exists idx_admin_notifications_read on public.admin_notifications(read);

-- Enable realtime
alter publication supabase_realtime add table public.admin_notifications;