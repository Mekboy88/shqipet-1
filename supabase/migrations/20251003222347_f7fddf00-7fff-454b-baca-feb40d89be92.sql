-- Create notifications table to support notification features
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  type text not null default 'info',
  priority text not null default 'medium',
  status text not null default 'unread',
  source text,
  linked_module text,
  linked_scan_id uuid,
  tags text[],
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policies
create policy "Users can view their own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Admins can view all notifications"
  on public.notifications for select
  using (public.current_user_is_admin() or public.is_platform_owner(auth.uid()));

create policy "Users can insert their own notifications"
  on public.notifications for insert
  with check (user_id = auth.uid());

create policy "Admins can insert notifications"
  on public.notifications for insert
  with check (public.current_user_is_admin() or public.is_platform_owner(auth.uid()));

create policy "Users can update their own notifications"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admins can update any notifications"
  on public.notifications for update
  using (public.current_user_is_admin() or public.is_platform_owner(auth.uid()))
  with check (true);

create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (user_id = auth.uid());

create policy "Admins can delete any notifications"
  on public.notifications for delete
  using (public.current_user_is_admin() or public.is_platform_owner(auth.uid()));

-- Trigger to keep updated_at current
create trigger handle_notifications_updated_at
before update on public.notifications
for each row execute function public.handle_updated_at();

-- Helpful indexes
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_status on public.notifications(status);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);