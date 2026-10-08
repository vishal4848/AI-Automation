import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export interface UploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  duration?: number;
  resourceType?: 'image' | 'video';
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
      return { url: base64, secureUrl: base64, publicId: `local/${Date.now()}` };
    }
    try {
      const result: UploadApiResponse = await cloudinary.uploader.upload(base64, {
        folder,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      });
      return {
        url: result.secure_url || result.url,
        secureUrl: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        resourceType: 'image',
      };
    } catch (error: any) {
      this.logger.error(`Cloudinary upload failed: ${error.message}`);
      return { url: base64, secureUrl: base64, publicId: `error/${Date.now()}` };
    }
  }

  async uploadImageUrl(imageUrl: string, folder = 'ai-automation/images'): Promise<UploadResult> {
    if (!this.configured) {
      return { url: imageUrl, secureUrl: imageUrl, publicId: `local/${Date.now()}` };
    }
    try {
      const result: UploadApiResponse = await cloudinary.uploader.upload(imageUrl, {
        folder,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      });
      return {
        url: result.secure_url || result.url,
        secureUrl: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        resourceType: 'image',
      };
    } catch (error: any) {
      this.logger.error(`Cloudinary image URL upload failed: ${error.message}`);
      return { url: imageUrl, secureUrl: imageUrl, publicId: `error/${Date.now()}` };
    }
  }

  async uploadVideoUrl(videoUrl: string, folder = 'ai-automation/videos'): Promise<UploadResult> {
    if (!this.configured) return { url: videoUrl, secureUrl: videoUrl, publicId: `local/${Date.now()}` };
    try {
      const result: UploadApiResponse = await cloudinary.uploader.upload(videoUrl, {
        folder,
        resource_type: 'video',
      });
      return {
        url: result.secure_url || result.url,
        secureUrl: result.secure_url,
        publicId: result.public_id,
        bytes: result.bytes,
        duration: result.duration,
        resourceType: 'video',
      };
    } catch (error: any) {
      this.logger.error(`Cloudinary video upload failed: ${error.message}`);
      return { url: videoUrl, secureUrl: videoUrl, publicId: `error/${Date.now()}` };
    }
  }

  async uploadBuffer(
    buffer: Buffer,
    options: {
      folder?: string;
      resourceType?: 'image' | 'video' | 'auto';
      fileName?: string;
    } = {},
  ): Promise<UploadResult> {
    const resourceType = options.resourceType || 'auto';
    const folder =
      options.folder ||
      (resourceType === 'video'
        ? 'ai-automation/uploads/videos'
        : 'ai-automation/uploads/images');

    if (!this.configured) {
      const mime = resourceType === 'video' ? 'video/mp4' : 'image/png';
      const base64 = buffer.toString('base64');
      const dataUri = `data:${mime};base64,${base64}`;
      return {
        url: dataUri,
        secureUrl: dataUri,
        publicId: `local-upload/${Date.now()}`,
        bytes: buffer.length,
        resourceType: resourceType === 'video' ? 'video' : 'image',
      };
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          use_filename: Boolean(options.fileName),
          filename_override: options.fileName,
        },
        (error, result) => {
          if (error || !result) {
            this.logger.error(`Cloudinary stream upload failed: ${error?.message}`);
            return reject(error || new Error('Cloudinary upload failed'));
          }
          resolve({
            url: result.secure_url || result.url,
            secureUrl: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
            duration: result.duration,
            resourceType: result.resource_type as 'image' | 'video',
          });
        },
      );
      uploadStream.end(buffer);
    });
  }

  async uploadFilePath(
    filePath: string,
    options: {
      folder?: string;
      resourceType?: 'image' | 'video' | 'auto';
      fileName?: string;
    } = {},
  ): Promise<UploadResult> {
    const resourceType = options.resourceType || 'auto';
    const folder =
      options.folder ||
      (resourceType === 'video'
        ? 'ai-automation/uploads/videos'
        : 'ai-automation/uploads/images');

    if (!this.configured) {
      return {
        url: `https://mock.cdn/uploads/${options.fileName || Date.now()}`,
        secureUrl: `https://mock.cdn/uploads/${options.fileName || Date.now()}`,
        publicId: `local-upload/${Date.now()}`,
        resourceType: resourceType === 'video' ? 'video' : 'image',
      };
    }

    try {
      const result: UploadApiResponse = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: resourceType,
        public_id: options.fileName ? options.fileName.replace(/\.[^/.]+$/, '') : undefined,
      });

      return {
        url: result.secure_url || result.url,
        secureUrl: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        duration: result.duration,
        resourceType: (result.resource_type as any) || resourceType,
      };
    } catch (error: any) {
      this.logger.error(`Cloudinary file path upload failed: ${error.message}`);
      throw error;
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
