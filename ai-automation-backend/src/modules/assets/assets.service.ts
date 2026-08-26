import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CloudinaryService } from '../storage/cloudinary.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UploadAssetDto } from './dto/upload-asset.dto';

export interface UploadedMediaFile {
  fieldname?: string;
  originalname: string;
  encoding?: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_MIMES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  'video/mpeg',
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

  validateFile(file: UploadedMediaFile): { resourceType: 'image' | 'video' } {
    if (!file || !file.buffer) {
      throw new BadRequestException('UPLOAD_FAILED: No file provided.');
    }

    const mime = (file.mimetype || '').toLowerCase();
    const originalName = (file.originalname || '').toLowerCase();

    const isImage =
      ALLOWED_IMAGE_MIMES.includes(mime) ||
      /\.(jpe?g|png|webp)$/i.test(originalName);

    const isVideo =
      ALLOWED_VIDEO_MIMES.includes(mime) ||
      /\.(mp4|mov|webm|mkv|avi)$/i.test(originalName);

    if (!isImage && !isVideo) {
      throw new BadRequestException(
        'UNSUPPORTED_FILE_TYPE: Only JPG, PNG, WEBP images and MP4, MOV, WEBM videos are supported.',
      );
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      throw new BadRequestException(
        `FILE_TOO_LARGE: Image size (${(file.size / (1024 * 1024)).toFixed(
          1,
        )}MB) exceeds maximum limit of 10MB.`,
      );
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      throw new BadRequestException(
        `FILE_TOO_LARGE: Video size (${(file.size / (1024 * 1024)).toFixed(
          1,
        )}MB) exceeds maximum limit of 100MB.`,
      );
    }

    return { resourceType: isVideo ? 'video' : 'image' };
  }

  async upload(
    userId: string,
    file: UploadedMediaFile,
    dto?: UploadAssetDto,
  ) {
    if (!userId) {
      throw new UnauthorizedException('Authentication required.');
    }

    const { resourceType } = this.validateFile(file);

    const folder =
      resourceType === 'video'
        ? 'ai-automation/uploads/videos'
        : 'ai-automation/uploads/images';

    let uploadResult;
    try {
      uploadResult = await this.cloudinary.uploadBuffer(file.buffer, {
        folder,
        resourceType,
        fileName: file.originalname,
      });
    } catch (uploadErr: any) {
      this.logger.error(`Storage upload failed: ${uploadErr.message}`);
      throw new BadRequestException(
        `STORAGE_UPLOAD_FAILED: ${uploadErr.message || 'Failed to upload media to storage.'}`,
      );
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
        mimeType: file.mimetype || (resourceType === 'video' ? 'video/mp4' : 'image/png'),
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
    if (options.resourceType && ['image', 'video'].includes(options.resourceType)) {
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
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(userId: string, id: string) {
    if (!userId) {
      throw new UnauthorizedException('Authentication required.');
    }

    const asset = await this.prisma.uploadedAsset.findFirst({
      where: { id, userId },
    });

    if (!asset) {
      throw new NotFoundException('ASSET_NOT_FOUND: Asset not found or access denied.');
    }

    return asset;
  }

  async delete(userId: string, id: string) {
    if (!userId) {
      throw new UnauthorizedException('Authentication required.');
    }

    const asset = await this.findOne(userId, id);

    // Check if asset is actively in use by a scheduled post
    const inUse = await this.prisma.scheduledPost.findFirst({
      where: {
        userId,
        status: { in: ['SCHEDULED', 'PROCESSING'] },
        OR: [
          { uploadedAssetId: id },
          { mediaUrl: asset.url },
          { mediaUrl: asset.secureUrl },
        ],
      },
    });

    if (inUse) {
      throw new BadRequestException(
        'ASSET_IN_USE_BY_SCHEDULED_POST: This media is currently being used by a scheduled post and cannot be deleted.',
      );
    }

    // Delete from Cloudinary if public ID exists
    if (asset.cloudinaryPublicId && !asset.cloudinaryPublicId.startsWith('local/')) {
      try {
        await this.cloudinary.deleteAsset(
          asset.cloudinaryPublicId,
          asset.resourceType as 'image' | 'video',
        );
      } catch (cldErr: any) {
        this.logger.warn(`Cloudinary deletion error: ${cldErr.message}`);
      }
    }

    await this.prisma.uploadedAsset.delete({
      where: { id: asset.id },
    });

    this.logger.log(`Uploaded asset deleted: ${asset.fileName} (ID: ${asset.id})`);
    return {
      success: true,
      deleted: true,
      id: asset.id,
      message: 'Asset deleted successfully',
    };
  }
}
