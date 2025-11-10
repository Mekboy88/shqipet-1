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
  private readonly MIN_RESOLUTION = 200; // Minimum 200x200px
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  /**
   * Validate image meets quality standards
   */
  async validate(file: File): Promise<void> {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File too large. Maximum size is 5MB.`);
    }

    // Check format
    if (!this.ALLOWED_FORMATS.includes(file.type)) {
      throw new Error(`Invalid format. Use JPEG, PNG, or WebP only.`);
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

    // Upload to Wasabi via edge function
    const { data, error } = await supabase.functions.invoke('wasabi-upload', {
      body: {
        file: await this.fileToBase64(file),
        fileName: file.name,
        mimeType: file.type,
        mediaType: 'avatar',
        userId: userId
      }
    });

    if (error) throw error;
    if (!data?.key) throw new Error('Upload failed - no key returned');

    console.log('✅ Avatar uploaded successfully:', data.key);

    // Update user profile with new avatar
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: data.key })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update profile:', updateError);
      throw updateError;
    }

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

  /**
   * Convert file to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const avatarUploadService = new AvatarUploadService();
