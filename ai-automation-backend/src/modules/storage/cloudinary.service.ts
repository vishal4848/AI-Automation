import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private configured = false;

  constructor(private config: ConfigService) {
    const cloudName = config.get<string>('cloudinary.cloudName');
    const apiKey = config.get<string>('cloudinary.apiKey');
    const apiSecret = config.get<string>('cloudinary.apiSecret');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
      this.configured = true;
      this.logger.log('Cloudinary configured successfully');
    } else {
      this.logger.warn('Cloudinary not configured — using passthrough URL mode');
    }
  }

  async uploadBase64Image(base64: string, folder = 'ai-automation/images'): Promise<UploadResult> {
    if (!this.configured) {
      // Passthrough: return the base64 as-is or generate a placeholder
      return { url: base64, publicId: `local/${Date.now()}` };
    }
    try {
      const result: UploadApiResponse = await cloudinary.uploader.upload(base64, {
        folder,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      });
      return { url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height, format: result.format, bytes: result.bytes };
    } catch (error: any) {
      this.logger.error(`Cloudinary upload failed: ${error.message}`);
      return { url: base64, publicId: `error/${Date.now()}` };
    }
  }

  async uploadVideoUrl(videoUrl: string, folder = 'ai-automation/videos'): Promise<UploadResult> {
    if (!this.configured) return { url: videoUrl, publicId: `local/${Date.now()}` };
    try {
      const result: UploadApiResponse = await cloudinary.uploader.upload(videoUrl, {
        folder, resource_type: 'video',
      });
      return { url: result.secure_url, publicId: result.public_id, bytes: result.bytes };
    } catch (error: any) {
      this.logger.error(`Cloudinary video upload failed: ${error.message}`);
      return { url: videoUrl, publicId: `error/${Date.now()}` };
    }
  }

  async deleteAsset(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<void> {
    if (!this.configured) return;
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (error: any) {
      this.logger.error(`Cloudinary delete failed: ${error.message}`);
    }
  }
}
