/**
 * UploadService - Handles all media uploads to Wasabi
 * Validates files and coordinates with Wasabi upload function
 */

import { supabase } from '@/integrations/supabase/client';

export type MediaType = 'avatar' | 'cover' | 'post-image' | 'post-video';

interface UploadResult {
  key: string;
  success: boolean;
}

interface ValidationRules {
  maxSizeMB: number;
  allowedTypes: string[];
  dimensions?: {
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
}

const VALIDATION_RULES: Record<MediaType, ValidationRules> = {
  avatar: {
    maxSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    dimensions: { minWidth: 100, minHeight: 100, maxWidth: 2000, maxHeight: 2000 }
  },
  cover: {
    maxSizeMB: 10,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    dimensions: { minWidth: 800, minHeight: 300, maxWidth: 4000, maxHeight: 4000 }
  },
  'post-image': {
    maxSizeMB: 20,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  },
  'post-video': {
    maxSizeMB: 100,
    allowedTypes: ['video/mp4', 'video/webm', 'video/mov', 'video/avi']
  }
};

class UploadService {
  /**
   * Validate file before upload
   */
  async validate(file: File, mediaType: MediaType): Promise<void> {
    const rules = VALIDATION_RULES[mediaType];
    
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > rules.maxSizeMB) {
      throw new Error(`File too large. Maximum size: ${rules.maxSizeMB}MB`);
    }

    // Check file type
    if (!rules.allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed: ${rules.allowedTypes.join(', ')}`);
    }

    // Check dimensions for images
    if (file.type.startsWith('image/') && rules.dimensions) {
      await this.validateImageDimensions(file, rules.dimensions);
    }
  }

  /**
   * Upload file to Wasabi and return key
   */
  async upload(file: File, mediaType: MediaType): Promise<UploadResult> {
    try {
      // Validate first
      await this.validate(file, mediaType);

      console.log(`📤 Uploading ${mediaType}:`, {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        type: file.type
      });

      // Get authenticated session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Authentication required for upload');
      }

      // Create the body for wasabi-upload
      const body = {
        filename: file.name,
        contentType: file.type,
        folder: this.getFolderForMediaType(mediaType),
        fileSize: file.size
      };

      // Get presigned upload URL from Supabase function
      const { data, error } = await supabase.functions.invoke('wasabi-upload', {
        body
      });

      if (error) {
        console.error('wasabi-upload error:', error);
        throw new Error(`Failed to get upload URL: ${error.message}`);
      }

      // Handle nested response structure from Supabase edge function
      const responseData = data?.data || data;
      
      if (!responseData || responseData.error) {
        console.error('wasabi-upload failed:', { data, responseData });
        throw new Error(`Upload service failed: ${responseData?.error || 'No response'}`);
      }

      // Parse response - handle different possible response formats
      const uploadUrl = responseData.uploadUrl || responseData.presignedUrl || responseData.putUrl || responseData.url;
      const returnedKey = responseData.key || responseData.fileKey || responseData.file_key || responseData.fullKey || responseData.finalKey || responseData.generatedKey || responseData.wasabiKey || responseData.path;

      if (!uploadUrl || !returnedKey) {
        console.error('Missing upload URL or key in response:', { uploadUrl, returnedKey, data });
        throw new Error(`Invalid response from upload service: missing uploadUrl or key`);
      }
      // Upload file to presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      // Ensure we store a full path key (including folder prefix)
      const folder = this.getFolderForMediaType(mediaType);
      const keyFromFn = typeof returnedKey === 'string' ? returnedKey : String(returnedKey);
      const fullKey = keyFromFn.startsWith(`${folder}/`) ? keyFromFn : `${folder}/${keyFromFn}`;

      console.log('✅ Upload successful:', fullKey);

      return {
        key: fullKey,
        success: true
      };

    } catch (error) {
      console.error('❌ Upload failed:', error);
      throw error;
    }
  }

  /**
   * Validate image dimensions
   */
  private async validateImageDimensions(file: File, dimensions: NonNullable<ValidationRules['dimensions']>): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        const { naturalWidth: width, naturalHeight: height } = img;
        
        if (dimensions.minWidth && width < dimensions.minWidth) {
          reject(new Error(`Image width too small. Minimum: ${dimensions.minWidth}px`));
          return;
        }
        
        if (dimensions.minHeight && height < dimensions.minHeight) {
          reject(new Error(`Image height too small. Minimum: ${dimensions.minHeight}px`));
          return;
        }
        
        if (dimensions.maxWidth && width > dimensions.maxWidth) {
          reject(new Error(`Image width too large. Maximum: ${dimensions.maxWidth}px`));
          return;
        }
        
        if (dimensions.maxHeight && height > dimensions.maxHeight) {
          reject(new Error(`Image height too large. Maximum: ${dimensions.maxHeight}px`));
          return;
        }
        
        resolve();
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for validation'));
      };
      
      img.src = url;
    });
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext || 'bin';
  }

  /**
   * Get folder name for media type
   */
  private getFolderForMediaType(mediaType: MediaType): string {
    switch (mediaType) {
      case 'avatar':
        // Use 'uploads' to align with existing signing/proxy functions
        return 'uploads';
      case 'cover':
        return 'covers';
      case 'post-image':
        return 'posts/images';
      case 'post-video':
        return 'posts/videos';
      default:
        return 'uploads';
    }
  }
}

// Export singleton
export const uploadService = new UploadService();