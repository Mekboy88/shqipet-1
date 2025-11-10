-- Populate upload_configuration with secure format validation rules
-- This ensures all format restrictions are stored in the database for admin management

-- Clear existing configuration
DELETE FROM public.upload_configuration;

-- Insert comprehensive secure format configuration
INSERT INTO public.upload_configuration (configuration_data) VALUES (
  jsonb_build_object(
    'file_upload_enabled', true,
    'video_upload_enabled', true,
    'uuid_filenames', true,
    'malware_scanning', true,
    
    -- ALLOWED IMAGE FORMATS (Industry Standard Safe Only)
    'allowed_image_extensions', ARRAY['.jpg', '.jpeg', '.png', '.webp', '.avif', '.heic'],
    'allowed_image_mime_types', ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'],
    
    -- ALLOWED VIDEO FORMATS (Industry Standard Safe Only)
    'allowed_video_extensions', ARRAY['.mp4', '.webm', '.mov'],
    'allowed_video_mime_types', ARRAY['video/mp4', 'video/webm', 'video/quicktime'],
    
    -- BLOCKED DANGEROUS IMAGE FORMATS
    'blocked_image_extensions', ARRAY['.bmp', '.tiff', '.tif', '.gif', '.svg', '.ico', '.nef', '.cr2', '.arw', '.dng', '.raw', '.orf', '.rw2'],
    'blocked_image_mime_types', ARRAY['image/bmp', 'image/x-ms-bmp', 'image/tiff', 'image/x-tiff', 'image/gif', 'image/svg+xml', 'image/x-icon'],
    
    -- BLOCKED DANGEROUS VIDEO FORMATS
    'blocked_video_extensions', ARRAY['.mkv', '.avi', '.wmv', '.flv', '.mpeg', '.mpg', '.ogv', '.3gp', '.m4v'],
    'blocked_video_mime_types', ARRAY['video/x-matroska', 'video/x-msvideo', 'video/x-ms-wmv', 'video/x-flv', 'video/mpeg', 'video/ogg', 'video/3gpp'],
    
    -- SIZE LIMITS (in bytes)
    'max_avatar_size', 5242880,      -- 5 MB
    'max_cover_size', 10485760,      -- 10 MB
    'max_post_image_size', 20971520, -- 20 MB
    'max_post_video_size', 52428800, -- 50 MB
    
    -- SECURITY RULES
    'allow_video_avatars', false,
    'exif_stripping_enabled', true,
    'auto_compress_images', true,
    'generate_avatar_variants', true,
    'avatar_variant_sizes', ARRAY[80, 160, 320, 640],
    
    -- VALIDATION SETTINGS
    'strict_mime_validation', true,
    'strict_extension_validation', true,
    'content_type_matching_required', true,
    
    -- ERROR MESSAGES
    'error_message_dangerous_format', 'File type not allowed for security reasons. Only safe formats: JPG, PNG, WEBP, AVIF, HEIC for images; MP4, WEBM, MOV for videos.',
    'error_message_size_exceeded', 'File too large. Maximum size for {type}: {maxSize}MB',
    'error_message_video_avatar', 'Video avatars are not allowed. Please use an image file.',
    
    -- METADATA
    'configuration_version', '2.0',
    'last_security_update', now(),
    'security_level', 'MAXIMUM',
    'compliance_standard', 'Industry Standard Safe Formats'
  )
);

-- Create index for faster configuration retrieval
CREATE INDEX IF NOT EXISTS idx_upload_configuration_updated 
ON public.upload_configuration(updated_at DESC);

-- Add helpful comment
COMMENT ON TABLE public.upload_configuration IS 'Stores secure media format validation rules. Only industry-standard safe formats are allowed: JPG, PNG, WEBP, AVIF, HEIC for images; MP4, WEBM, MOV for videos. Dangerous formats (GIF, SVG, BMP, TIFF, AVI, MKV, etc.) are blocked for security.';
