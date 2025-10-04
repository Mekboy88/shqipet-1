-- Migrate hobbies column to text[] and ensure upsert works reliably
begin;

-- Ensure one row per user for stable upserts
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'personal_introduction_user_id_unique'
  ) then
    alter table public.personal_introduction
      add constraint personal_introduction_user_id_unique unique (user_id);
  end if;
end $$;

-- Convert hobbies from text to text[] if currently text
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'personal_introduction'
      and column_name = 'hobbies'
      and udt_name in ('text')
  ) then
    alter table public.personal_introduction
      alter column hobbies type text[]
      using case 
        when hobbies is null or btrim(hobbies) = '' then '{}'::text[]
        else string_to_array(hobbies, ',')::text[]
      end;
  end if;
end $$;

-- Add updated_at trigger if missing
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_personal_introduction_updated_at'
  ) then
    create trigger trg_personal_introduction_updated_at
    before update on public.personal_introduction
    for each row execute function public.handle_updated_at();
  end if;
end $$;

commit;