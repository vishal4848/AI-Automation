import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScheduledPost, SocialAccount } from '@prisma/client';
import { SocialPublisher } from './social-publisher.interface';
import { decrypt } from '../../../common/utils/encryption.util';

@Injectable()
export class FacebookPublisher implements SocialPublisher {
  private readonly logger = new Logger(FacebookPublisher.name);

  constructor(private readonly configService: ConfigService) {}

  async validate(account: SocialAccount, post: ScheduledPost): Promise<boolean> {
    if (!account) {
      throw new Error('FACEBOOK_NOT_CONNECTED: No Facebook Page connected.');
    }
    const pageId = account.pageId || account.platformUserId;
    if (!pageId) {
      throw new Error('FACEBOOK_PAGE_NOT_FOUND: Missing Facebook Page ID.');
    }
    if (!account.accessTokenEncrypted) {
      throw new Error('FACEBOOK_TOKEN_EXPIRED: Missing access token. Please reconnect your Facebook Page.');
    }
    if (!post.mediaUrl || typeof post.mediaUrl !== 'string') {
      throw new Error('FACEBOOK_MEDIA_INVALID: Media URL is required.');
    }
    if (post.mediaUrl.includes('localhost') || post.mediaUrl.includes('127.0.0.1')) {
      throw new Error('FACEBOOK_MEDIA_INVALID: Localhost URLs cannot be accessed by Facebook. Please use a public Cloudinary URL.');
    }
    if (!post.mediaUrl.startsWith('https://') && !post.mediaUrl.startsWith('http://') && !post.mediaUrl.startsWith('data:')) {
      throw new Error('FACEBOOK_MEDIA_INVALID: Media URL must be a valid public HTTPS link or data URI.');
    }
    return true;
  }

  async publish(account: SocialAccount, post: ScheduledPost): Promise<string> {
    await this.validate(account, post);

    const version = this.configService.get<string>('META_API_VERSION') || 'v20.0';
    const encryptionKey = this.configService.get<string>('TOKEN_ENCRYPTION_KEY') || 'dev-token-encryption-key-32-chars-long';

    let pageAccessToken: string;
    try {
      pageAccessToken = decrypt(account.accessTokenEncrypted, encryptionKey);
    } catch {
      throw new Error('FACEBOOK_TOKEN_EXPIRED: Failed to decrypt Page access token. Please reconnect your Facebook Page.');
    }

    const pageId = account.pageId || account.platformUserId;
    const isVideo = this.isVideoUrl(post.mediaUrl);

    try {
      if (isVideo) {
        // ─── PUBLISH VIDEO TO FACEBOOK PAGE ───
        const videoUrl = `https://graph.facebook.com/${version}/${pageId}/videos`;
        let response: Response;

        if (post.mediaUrl.startsWith('data:')) {
          const match = post.mediaUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (!match) {
            throw new Error('FACEBOOK_MEDIA_INVALID: Malformed data URI.');
          }
          const contentType = match[1];
          const buffer = Buffer.from(match[2], 'base64');
          const formData = new FormData();
          formData.append('source', new Blob([buffer], { type: contentType }), 'media-asset.mp4');
          formData.append('description', post.caption || '');
          formData.append('access_token', pageAccessToken);
          response = await fetch(videoUrl, {
            method: 'POST',
            body: formData,
          });
        } else {
          response = await fetch(videoUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file_url: post.mediaUrl,
              description: post.caption || '',
              access_token: pageAccessToken,
            }),
          });
        }

        const data = await response.json();

        if (data.error) {
          this.handleMetaError(data.error);
        }

        const externalPostId = data.id || data.post_id;
        if (!externalPostId) {
          throw new Error('FACEBOOK_PUBLISH_FAILED: No post ID returned from Facebook Graph API.');
        }

        this.logger.log(`Published video to Facebook Page ${pageId} successfully. Post ID: ${externalPostId}`);
        return externalPostId;
      } else {
        // ─── PUBLISH PHOTO TO FACEBOOK PAGE ───
        const photoUrl = `https://graph.facebook.com/${version}/${pageId}/photos`;
        let response: Response;

        if (post.mediaUrl.startsWith('data:')) {
          const match = post.mediaUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (!match) {
            throw new Error('FACEBOOK_MEDIA_INVALID: Malformed data URI.');
          }
          const contentType = match[1];
          const buffer = Buffer.from(match[2], 'base64');
          const formData = new FormData();
          formData.append('source', new Blob([buffer], { type: contentType }), 'media-asset.png');
          formData.append('caption', post.caption || '');
          formData.append('access_token', pageAccessToken);
          response = await fetch(photoUrl, {
            method: 'POST',
            body: formData,
          });
        } else {
          response = await fetch(photoUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: post.mediaUrl,
              caption: post.caption || '',
              access_token: pageAccessToken,
            }),
          });
        }

        const data = await response.json();

        if (data.error) {
          this.handleMetaError(data.error);
        }

        const externalPostId = data.post_id || data.id;
        if (!externalPostId) {
          throw new Error('FACEBOOK_PUBLISH_FAILED: No post ID returned from Facebook Graph API.');
        }

        this.logger.log(`Published photo to Facebook Page ${pageId} successfully. Post ID: ${externalPostId}`);
        return externalPostId;
      }
    } catch (error: any) {
      const sanitized = this.sanitize(error.message);
      this.logger.error(`Failed to publish to Facebook Page: ${sanitized}`);
      throw new Error(sanitized);
    }
  }

  private isVideoUrl(url: string): boolean {
    const cleanUrl = url.toLowerCase().split('?')[0];
    return (
      cleanUrl.endsWith('.mp4') ||
      cleanUrl.endsWith('.mov') ||
      cleanUrl.endsWith('.webm') ||
      cleanUrl.endsWith('.avi') ||
      cleanUrl.includes('/video/upload/') ||
      cleanUrl.includes('/videos/')
    );
  }

  private handleMetaError(error: any): never {
    const errorMsg = error.message || 'Facebook publishing failed';
    const errorCode = error.code;
    const errorSubcode = error.error_subcode;

    if (errorCode === 190) {
      throw new Error(`FACEBOOK_TOKEN_EXPIRED: ${errorMsg}`);
    }
    if (errorCode === 200 || errorCode === 10 || errorCode === 283 || errorSubcode === 458) {
      throw new Error(`FACEBOOK_PERMISSION_DENIED: ${errorMsg}`);
    }
    if (errorCode === 36003 || errorCode === 100 || errorMsg.toLowerCase().includes('media')) {
      throw new Error(`FACEBOOK_MEDIA_INVALID: ${errorMsg}`);
    }
    if (errorCode === 4 || errorCode === 17 || errorCode === 32) {
      throw new Error(`FACEBOOK_RATE_LIMITED: ${errorMsg}`);
    }
    throw new Error(`FACEBOOK_PUBLISH_FAILED: ${errorMsg}`);
  }

  private sanitize(message: string): string {
    if (!message) return 'Unknown Facebook publishing error';
    return message
      .replace(/EA[A-Za-z0-9]+/g, '[REDACTED_TOKEN]')
      .replace(/access_token=[^&]+/gi, 'access_token=[REDACTED]');
  }
}
