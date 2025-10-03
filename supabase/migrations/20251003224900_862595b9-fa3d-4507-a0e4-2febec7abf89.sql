-- Create missing upload configuration functions that are being called in the code

-- Create upload_configuration table if it doesn't exist
create table if not exists public.upload_configuration (
  id uuid primary key default gen_random_uuid(),
  configuration_data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.upload_configuration enable row level security;

-- Only admins can access upload configuration
create policy "Admins can manage upload configuration"
  on public.upload_configuration for all
  using (public.current_user_is_admin() or public.is_platform_owner(auth.uid()));

-- Create get_upload_configuration function
create or replace function public.get_upload_configuration()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  config_data jsonb;
begin
  -- Get the most recent configuration
  select configuration_data into config_data
  from public.upload_configuration
  order by updated_at desc
  limit 1;
  
  -- Return default configuration if none exists
  if config_data is null then
    config_data := '{
      "file_upload_enabled": true,
      "video_upload_enabled": true,
      "max_image_size": 10485760,
      "max_video_size": 104857600,
      "allowed_extensions": "jpg,jpeg,png,gif,mp4,mov,avi",
      "malware_scanning": false,
      "uuid_filenames": true
    }';
    
    -- Insert default configuration
    insert into public.upload_configuration (configuration_data)
    values (config_data);
  end if;
  
  return config_data;
end;
$$;

-- Create update_upload_configuration function
create or replace function public.update_upload_configuration(config_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result_data jsonb;
begin
  -- Update or insert configuration
  insert into public.upload_configuration (configuration_data)
  values (config_data)
  on conflict (id) do update set
    configuration_data = excluded.configuration_data,
    updated_at = now();
    
  -- Return the updated configuration
  select configuration_data into result_data
  from public.upload_configuration
  order by updated_at desc
  limit 1;
  
  return result_data;
end;
$$;

-- Create upload_configuration_status table
create table if not exists public.upload_configuration_status (
  id uuid primary key default gen_random_uuid(),
  service_name text not null,
  status text not null,
  response_time_ms integer,
  error_details jsonb,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.upload_configuration_status enable row level security;

-- Only admins can access
create policy "Admins can manage upload configuration status"
  on public.upload_configuration_status for all
  using (public.current_user_is_admin() or public.is_platform_owner(auth.uid()));

-- Create update_upload_configuration_status function
create or replace function public.update_upload_configuration_status(
  p_service_name text,
  p_status text,
  p_response_time_ms integer default null,
  p_error_details jsonb default null,
  p_metadata jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.upload_configuration_status (
    service_name,
    status,
    response_time_ms,
    error_details,
    metadata
  ) values (
    p_service_name,
    p_status,
    p_response_time_ms,
    p_error_details,
    p_metadata
  );
end;
$$;

-- Create get_upload_analytics function
create or replace function public.get_upload_analytics(p_time_window text default '24h')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Return mock analytics data for now
  return '{
    "total_uploads": 0,
    "successful_uploads": 0,
    "failed_uploads": 0,
    "average_upload_time": 0,
    "storage_used": 0
  }';
end;
$$;

-- Create trigger for upload_configuration updated_at
create trigger handle_upload_configuration_updated_at
before update on public.upload_configuration
for each row execute function public.handle_updated_at();

-- Create trigger for upload_configuration_status updated_at
create trigger handle_upload_configuration_status_updated_at
before update on public.upload_configuration_status
for each row execute function public.handle_updated_at();

-- Create indexes
create index if not exists idx_upload_configuration_updated_at on public.upload_configuration(updated_at desc);
create index if not exists idx_upload_configuration_status_service on public.upload_configuration_status(service_name);
create index if not exists idx_upload_configuration_status_updated_at on public.upload_configuration_status(updated_at desc);