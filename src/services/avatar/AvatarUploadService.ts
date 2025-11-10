/**
 * Crystal-Clear Avatar Upload Service
 * 
 * Protection mechanisms:
 * 1. Minimum resolution validation (prevents low-quality uploads)
 * 2. Format validation (JPEG, PNG, WebP only)
 * 3. Size validation (max 5MB for avatars)
 * 4. Direct upload without compression (preserves quality)
 */

import { supabase } from '@/integrations/supabase/client';

interface UploadResult {
  key: string;
  url: string;
  success: boolean;
}

class AvatarUploadService {
  private readonly MIN_RESOLUTION = 400; // Minimum 400x400px to match backend
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per project policy
  private readonly ALLOWED_FORMATS = [
    'image/jpeg', 'image/jpg', 'image/pjpeg', 'image/jfif',
    'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'
  ];

  /**
   * Validate image meets quality standards
   */
  async validate(file: File): Promise<void> {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      const maxMb = (this.MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
      throw new Error(`File too large. Maximum size is ${maxMb}MB.`);
    }

    // Check format (tolerate unknown MIME on some devices by falling back to extension)
    const nameExt = (file.name.split('.').pop() || '').toLowerCase();
    const allowedExts = ['jpg','jpeg','jfif','pjpeg','png','webp','avif','heic','heif'];
    const mimeOk = this.ALLOWED_FORMATS.includes(file.type);
    const extOk = allowedExts.includes(nameExt);
    if (!mimeOk && !extOk) {
      throw new Error(`Invalid format. Allowed: JPG, PNG, WEBP, AVIF, HEIC.`);
    }

    // Check resolution
    const dimensions = await this.getImageDimensions(file);
    if (dimensions.width < this.MIN_RESOLUTION || dimensions.height < this.MIN_RESOLUTION) {
      throw new Error(`Image too small. Minimum resolution is ${this.MIN_RESOLUTION}x${this.MIN_RESOLUTION}px to prevent blur.`);
    }

    console.log('✅ Avatar validation passed:', {
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      format: file.type,
      dimensions: `${dimensions.width}x${dimensions.height}px`
    });
  }

  /**
   * Upload avatar with quality protection
   */
  async upload(file: File, userId: string): Promise<UploadResult> {
    // Validate first
    await this.validate(file);

    console.log('🚀 Uploading high-quality avatar...');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Authentication required');
    }

    // Create FormData for wasabi-upload edge function
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mediaType', 'avatar');
    formData.append('userId', userId);
    formData.append('updateProfile', 'true');

    // Upload to Wasabi via edge function (use full functions URL)
    const response = await fetch(
      `https://uaiwjxojbpeljzxcvgof.functions.supabase.co/wasabi-upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${errorText}`);
    }

    const data = await response.json();
    if (!data?.key) throw new Error('Upload failed - no key returned');

    console.log('✅ Avatar uploaded successfully:', data.key);

    // Profile is updated by the backend (updateProfile=true); no client-side update needed

    return {
      key: data.key,
      url: data.url || data.key,
      success: true
    };
  }

  /**
   * Get image dimensions
   */
  private getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

}

export const avatarUploadService = new AvatarUploadService();
