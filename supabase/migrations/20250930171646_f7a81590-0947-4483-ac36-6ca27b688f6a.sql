-- Fix function search path for handle_updated_at with CASCADE
drop function if exists public.handle_updated_at() cascade;

create function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Recreate the trigger
create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();