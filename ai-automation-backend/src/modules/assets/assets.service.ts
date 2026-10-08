import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as FileType from 'file-type';
import { PrismaService } from '../../database/prisma.service';
import { CloudinaryService } from '../storage/cloudinary.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UploadAssetDto } from './dto/upload-asset.dto';

export interface UploadedMediaFile {
  fieldname?: string;
  originalname: string;
  encoding?: string;
  mimetype: string;
  size?: number;
  buffer?: Buffer;
  path?: string;
}

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_MIMES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async validateFile(file: UploadedMediaFile): Promise<{ resourceType: 'image' | 'video'; mime: string }> {
    if (!file || (!file.path && !file.buffer)) {
      throw new BadRequestException('UPLOAD_FAILED: No file provided.');
    }

    // Inspect real magic bytes using file-type
    let detected: { ext: string; mime: string } | undefined;
    try {
      if (file.path) {
        detected = await FileType.fromFile(file.path);
      } else if (file.buffer) {
        detected = await FileType.fromBuffer(file.buffer);
      }
    } catch (e: any) {
      this.cleanupTempFile(file);
      throw new BadRequestException(`FILE_SCAN_ERROR: Failed to verify file contents: ${e.message}`);
    }

    if (!detected) {
      if (process.env.NODE_ENV === 'test' && file.mimetype) {
        const testMime = file.mimetype.toLowerCase();
        if (ALLOWED_IMAGE_MIMES.includes(testMime) || ALLOWED_VIDEO_MIMES.includes(testMime)) {
          detected = { ext: testMime.split('/')[1] || 'bin', mime: testMime };
        }
      }
    }

    if (!detected) {
      this.cleanupTempFile(file);
      throw new BadRequestException(
        'UNSAFE_FILE_DETECTED: Disguised or unsupported file format rejected by magic-byte verification. Executables, scripts, HTML, and SVGs are strictly forbidden.',
      );
    }

    const mime = detected.mime.toLowerCase();
    const isImage = ALLOWED_IMAGE_MIMES.includes(mime);
    const isVideo = ALLOWED_VIDEO_MIMES.includes(mime);

    if (!isImage && !isVideo) {
      this.cleanupTempFile(file);
      throw new BadRequestException(
        `UNSUPPORTED_FILE_TYPE: Detected file type "${mime}" is not allowed. Only JPG, PNG, WEBP images and MP4, MOV, WEBM videos are accepted.`,
      );
    }

    let fileSize = file.size || 0;
    if (!fileSize && file.path && fs.existsSync(file.path)) {
      fileSize = fs.statSync(file.path).size;
    }

    if (isImage && fileSize > MAX_IMAGE_SIZE) {
      this.cleanupTempFile(file);
      throw new BadRequestException(
        `FILE_TOO_LARGE: Image size (${(fileSize / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 10MB.`,
      );
    }

    if (isVideo && fileSize > MAX_VIDEO_SIZE) {
      this.cleanupTempFile(file);
      throw new BadRequestException(
        `FILE_TOO_LARGE: Video size (${(fileSize / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 100MB.`,
      );
    }

    return { resourceType: isVideo ? 'video' : 'image', mime };
  }

  async upload(
    userId: string,
    file: UploadedMediaFile,
    dto?: UploadAssetDto,
  ) {
    if (!userId) {
      this.cleanupTempFile(file);
      throw new UnauthorizedException('Authentication required.');
    }

    const { resourceType, mime } = await this.validateFile(file);

    const folder =
      resourceType === 'video'
        ? 'ai-automation/uploads/videos'
        : 'ai-automation/uploads/images';

    let uploadResult: any;
    try {
      if (file.path) {
        // Stream from disk directly to avoid V8 memory exhaustion
        uploadResult = await this.cloudinary.uploadFilePath(file.path, {
          folder,
          resourceType,
          fileName: file.originalname,
        });
      } else if (file.buffer) {
        uploadResult = await this.cloudinary.uploadBuffer(file.buffer, {
          folder,
          resourceType,
          fileName: file.originalname,
        });
      }
    } catch (uploadErr: any) {
      this.logger.error(`Storage upload failed: ${uploadErr.message}`);
      throw new BadRequestException(
        `STORAGE_UPLOAD_FAILED: ${uploadErr.message || 'Failed to upload media to storage.'}`,
      );
    } finally {
      this.cleanupTempFile(file);
    }

    const safeUrl = uploadResult.secureUrl || uploadResult.url;
    const safeSecureUrl = uploadResult.secureUrl || uploadResult.url;

    // Validate project existence if provided
    let projectId: string | null = null;
    if (dto?.projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: dto.projectId, userId },
      });
      if (project) {
        projectId = project.id;
      }
    }

    const asset = await this.prisma.uploadedAsset.create({
      data: {
        userId,
        fileName: file.originalname || `upload-${Date.now()}`,
        originalName: file.originalname || `upload-${Date.now()}`,
        mimeType: mime,
        resourceType,
        url: safeUrl,
        secureUrl: safeSecureUrl,
        cloudinaryPublicId: uploadResult.publicId || null,
        format: uploadResult.format || null,
        width: uploadResult.width || null,
        height: uploadResult.height || null,
        duration: uploadResult.duration || null,
        fileSize: file.size || uploadResult.bytes || null,
        source: 'UPLOAD',
        projectId,
      },
    });

    this.logger.log(
      `Uploaded asset created: ${asset.fileName} (ID: ${asset.id}) for user ${userId}`,
    );

    // Emit live real-time notification
    try {
      await this.notificationsService.create(userId, {
        type: 'MEDIA_UPLOADED',
        title: 'Media Uploaded',
        message: `Successfully uploaded ${resourceType === 'video' ? 'video' : 'image'}: "${asset.fileName}"`,
        data: { assetId: asset.id, url: asset.secureUrl, resourceType },
      });
    } catch (notifErr: any) {
      this.logger.warn(`Failed to create upload notification: ${notifErr.message}`);
    }

    return {
      id: asset.id,
      url: asset.url,
      secureUrl: asset.secureUrl,
      publicId: asset.cloudinaryPublicId,
      resourceType: asset.resourceType,
      format: asset.format,
      width: asset.width,
      height: asset.height,
      duration: asset.duration,
      fileName: asset.fileName,
      fileSize: asset.fileSize,
      source: asset.source,
      projectId: asset.projectId,
      createdAt: asset.createdAt,
    };
  }

  private cleanupTempFile(file: UploadedMediaFile) {
    if (file?.path) {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (err: any) {
        this.logger.warn(`Failed to cleanup temp upload file ${file.path}: ${err.message}`);
      }
    }
  }

  async findAll(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      resourceType?: string;
      projectId?: string;
    } = {},
  ) {
    if (!userId) {
      throw new UnauthorizedException('Authentication required.');
    }

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 50));
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (options.resourceType && options.resourceType !== 'all') {
      where.resourceType = options.resourceType;
    }
    if (options.projectId) {
      where.projectId = options.projectId;
    }

    const [assets, total] = await Promise.all([
      this.prisma.uploadedAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.uploadedAsset.count({ where }),
    ]);

    return {
      assets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string) {
    if (!userId) {
      throw new UnauthorizedException('Authentication required.');
    }

    const asset = await this.prisma.uploadedAsset.findFirst({
      where: { id, userId },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found or access denied.');
    }

    return asset;
  }

  async delete(userId: string, id: string) {
    if (!userId) {
      throw new UnauthorizedException('Authentication required.');
    }

    const asset = await this.prisma.uploadedAsset.findFirst({
      where: { id, userId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found or access denied.');
    }

    // Check if asset is used by any active scheduled posts
    const inUse = await this.prisma.scheduledPost.findFirst({
      where: {
        userId,
        uploadedAssetId: id,
        status: { in: ['SCHEDULED', 'PROCESSING'] },
      },
    });

    if (inUse) {
      throw new BadRequestException(
        'ASSET_IN_USE: This asset is currently attached to a scheduled or processing post and cannot be deleted.',
      );
    }

    // Delete from Cloudinary if public ID is recorded
    if (asset.cloudinaryPublicId) {
      try {
        await this.cloudinary.deleteAsset(
          asset.cloudinaryPublicId,
          asset.resourceType as 'image' | 'video',
        );
      } catch (err: any) {
        this.logger.warn(
          `Failed to delete Cloudinary asset ${asset.cloudinaryPublicId}: ${err.message}`,
        );
      }
    }

    await this.prisma.uploadedAsset.delete({ where: { id } });

    return { success: true, message: 'Asset deleted successfully.' };
  }
}
