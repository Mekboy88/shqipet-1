-- Create enum for permission types
CREATE TYPE public.permission_type AS ENUM (
  'camera',
  'photo_library',
  'location',
  'notifications',
  'microphone',
  'storage',
  'contacts',
  'calendar'
);

-- Create enum for permission status
CREATE TYPE public.permission_status AS ENUM (
  'granted',
  'denied',
  'pending',
  'not_requested'
);

-- Create enum for device types
CREATE TYPE public.device_type AS ENUM (
  'mobile_ios',
  'mobile_android',
  'mobile_web',
  'desktop',
  'laptop',
  'tablet'
);

-- Create user_permissions table
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission_type permission_type NOT NULL,
  status permission_status NOT NULL DEFAULT 'not_requested',
  device_type device_type NOT NULL,
  granted_at TIMESTAMPTZ,
  denied_at TIMESTAMPTZ,
  last_requested_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission_type, device_type)
);

-- Enable RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can manage their own permissions
CREATE POLICY "Users can view own permissions"
ON public.user_permissions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own permissions"
ON public.user_permissions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own permissions"
ON public.user_permissions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all permissions"
ON public.user_permissions
FOR SELECT
USING (current_user_is_admin() OR is_platform_owner(auth.uid()));

-- Create function to check if user has permission
CREATE OR REPLACE FUNCTION public.has_permission(
  _user_id UUID,
  _permission_type permission_type,
  _device_type device_type DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_permissions
    WHERE user_id = _user_id
      AND permission_type = _permission_type
      AND status = 'granted'
      AND (_device_type IS NULL OR device_type = _device_type)
  )
$$;

-- Create function to request permission
CREATE OR REPLACE FUNCTION public.request_permission(
  _permission_type permission_type,
  _device_type device_type,
  _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  permission_id UUID;
BEGIN
  -- Insert or update permission request
  INSERT INTO public.user_permissions (
    user_id,
    permission_type,
    device_type,
    status,
    last_requested_at,
    metadata
  )
  VALUES (
    auth.uid(),
    _permission_type,
    _device_type,
    'pending',
    now(),
    _metadata
  )
  ON CONFLICT (user_id, permission_type, device_type)
  DO UPDATE SET
    last_requested_at = now(),
    status = 'pending',
    metadata = _metadata,
    updated_at = now()
  RETURNING id INTO permission_id;
  
  RETURN permission_id;
END;
$$;

-- Create function to grant permission
CREATE OR REPLACE FUNCTION public.grant_permission(
  _permission_type permission_type,
  _device_type device_type,
  _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  permission_id UUID;
BEGIN
  INSERT INTO public.user_permissions (
    user_id,
    permission_type,
    device_type,
    status,
    granted_at,
    metadata
  )
  VALUES (
    auth.uid(),
    _permission_type,
    _device_type,
    'granted',
    now(),
    _metadata
  )
  ON CONFLICT (user_id, permission_type, device_type)
  DO UPDATE SET
    status = 'granted',
    granted_at = now(),
    metadata = _metadata,
    updated_at = now()
  RETURNING id INTO permission_id;
  
  RETURN permission_id;
END;
$$;

-- Create function to deny permission
CREATE OR REPLACE FUNCTION public.deny_permission(
  _permission_type permission_type,
  _device_type device_type,
  _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  permission_id UUID;
BEGIN
  INSERT INTO public.user_permissions (
    user_id,
    permission_type,
    device_type,
    status,
    denied_at,
    metadata
  )
  VALUES (
    auth.uid(),
    _permission_type,
    _device_type,
    'denied',
    now(),
    _metadata
  )
  ON CONFLICT (user_id, permission_type, device_type)
  DO UPDATE SET
    status = 'denied',
    denied_at = now(),
    metadata = _metadata,
    updated_at = now()
  RETURNING id INTO permission_id;
  
  RETURN permission_id;
END;
$$;

-- Create trigger to update timestamp
CREATE TRIGGER update_user_permissions_updated_at
BEFORE UPDATE ON public.user_permissions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster queries
CREATE INDEX idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX idx_user_permissions_status ON public.user_permissions(status);
CREATE INDEX idx_user_permissions_type_device ON public.user_permissions(permission_type, device_type);