import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScheduledPost, SocialAccount } from '@prisma/client';
import { SocialPublisher } from './social-publisher.interface';
import { decrypt } from '../../../common/utils/encryption.util';

@Injectable()
export class InstagramPublisher implements SocialPublisher {
  private readonly logger = new Logger(InstagramPublisher.name);

  constructor(private readonly configService: ConfigService) {}

  async validate(account: SocialAccount, post: ScheduledPost): Promise<boolean> {
    if (!account) {
      throw new Error('INSTAGRAM_NOT_CONNECTED: No Instagram account connected.');
    }
    if (!account.platformUserId) {
      throw new Error('INSTAGRAM_ACCOUNT_NOT_ELIGIBLE: Missing Instagram Account ID.');
    }
    if (!account.accessTokenEncrypted) {
      throw new Error('INSTAGRAM_TOKEN_EXPIRED: Missing access token. Please reconnect Instagram.');
    }
    if (!post.mediaUrl || typeof post.mediaUrl !== 'string') {
      throw new Error('INSTAGRAM_MEDIA_INVALID: Media URL is required.');
    }
    if (post.mediaUrl.includes('localhost') || post.mediaUrl.includes('127.0.0.1')) {
      throw new Error('INSTAGRAM_MEDIA_INVALID: Localhost URLs cannot be accessed by Instagram. Please use a public Cloudinary URL.');
    }
    if (!post.mediaUrl.startsWith('https://') && !post.mediaUrl.startsWith('http://')) {
      throw new Error('INSTAGRAM_MEDIA_INVALID: Media URL must be a valid public HTTPS link.');
    }
    return true;
  }

  async publish(account: SocialAccount, post: ScheduledPost): Promise<string> {
    await this.validate(account, post);

    const version = this.configService.get<string>('META_API_VERSION') || 'v20.0';
    const encryptionKey = this.configService.get<string>('TOKEN_ENCRYPTION_KEY') || 'dev-token-encryption-key-32-chars-long';

    let accessToken: string;
    try {
      accessToken = decrypt(account.accessTokenEncrypted, encryptionKey);
    } catch {
      throw new Error('INSTAGRAM_TOKEN_EXPIRED: Failed to decrypt access token. Please reconnect Instagram.');
    }

    const igAccountId = account.platformUserId;

    // ─── STEP 1: CREATE MEDIA CONTAINER ───
    let creationId: string | null = null;
    let lastError: string | null = null;

    // Try graph.instagram.com first (Instagram API with Instagram Login)
    const hostEndpoints = [
      `https://graph.instagram.com/${version}`,
      `https://graph.facebook.com/${version}`,
    ];

    let workingHost = hostEndpoints[0];

    const isVideo = this.isVideoUrl(post.mediaUrl);

    for (const host of hostEndpoints) {
      try {
        const containerUrl = `${host}/${igAccountId}/media`;
        const payload: Record<string, any> = {
          caption: post.caption || '',
          access_token: accessToken,
        };

        if (isVideo) {
          payload.media_type = 'REELS';
          payload.video_url = post.mediaUrl;
        } else {
          payload.image_url = post.mediaUrl;
        }

        const containerResponse = await fetch(containerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const containerData = await containerResponse.json();

        if (containerData.id) {
          creationId = containerData.id;
          workingHost = host;
          break;
        }

        if (containerData.error) {
          const errorMsg = containerData.error.message || 'Container creation failed';
          const errorCode = containerData.error.code;
          lastError = errorMsg;

          if (errorCode === 190) {
            throw new Error(`INSTAGRAM_TOKEN_EXPIRED: ${errorMsg}`);
          }
          if (errorCode === 36003 || errorMsg.toLowerCase().includes('media')) {
            throw new Error(`INSTAGRAM_MEDIA_INVALID: ${errorMsg}`);
          }
        }
      } catch (err: any) {
        if (err.message.includes('INSTAGRAM_TOKEN_EXPIRED') || err.message.includes('INSTAGRAM_MEDIA_INVALID')) {
          throw err;
        }
        lastError = err.message;
      }
    }

    if (!creationId) {
      const sanitized = this.sanitize(lastError || 'No container ID returned from Meta API');
      this.logger.error(`Failed to create Instagram media container: ${sanitized}`);
      throw new Error(`INSTAGRAM_PUBLISH_FAILED: ${sanitized}`);
    }

    // ─── STEP 2: POLL CONTAINER READINESS ───
    let isReady = false;
    let pollAttempts = 0;
    const maxPolls = 6;

    while (!isReady && pollAttempts < maxPolls) {
      pollAttempts++;
      try {
        const statusUrl = `${workingHost}/${creationId}?fields=status_code,status&access_token=${accessToken}`;
        const statusRes = await fetch(statusUrl);
        const statusData = await statusRes.json();

        if (statusData.status_code === 'FINISHED') {
          isReady = true;
          break;
        } else if (statusData.status_code === 'ERROR') {
          throw new Error('INSTAGRAM_MEDIA_INVALID: Media processing failed on Meta servers.');
        } else if (statusData.status_code === 'EXPIRED') {
          throw new Error('INSTAGRAM_MEDIA_INVALID: Media container expired before publishing.');
        }

        // Wait 2 seconds before polling again
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (err: any) {
        if (err.message.includes('INSTAGRAM_MEDIA_INVALID')) {
          throw err;
        }
        // If status query is not supported for image container, proceed to publish
        isReady = true;
      }
    }

    // ─── STEP 3: PUBLISH MEDIA CONTAINER ───
    try {
      const publishUrl = `${workingHost}/${igAccountId}/media_publish`;
      const publishResponse = await fetch(publishUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: accessToken,
        }),
      });

      const publishData = await publishResponse.json();

      if (publishData.error) {
        const errorMsg = publishData.error.message || 'Media publish failed';
        const errorCode = publishData.error.code;
        if (errorCode === 190) {
          throw new Error(`INSTAGRAM_TOKEN_EXPIRED: ${errorMsg}`);
        }
        if (errorCode === 4 || errorCode === 17 || errorCode === 32) {
          throw new Error(`INSTAGRAM_RATE_LIMITED: ${errorMsg}`);
        }
        throw new Error(`INSTAGRAM_PUBLISH_FAILED: ${errorMsg}`);
      }

      const instagramMediaId = publishData.id;
      if (!instagramMediaId) {
        throw new Error('INSTAGRAM_PUBLISH_FAILED: No Instagram Media ID returned.');
      }

      this.logger.log(`Published to Instagram successfully. Media ID: ${instagramMediaId}`);
      return instagramMediaId;
    } catch (error: any) {
      const sanitized = this.sanitize(error.message);
      this.logger.error(`Failed to publish Instagram media: ${sanitized}`);
      throw new Error(sanitized);
    }
  }

  private isVideoUrl(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    return (
      lower.endsWith('.mp4') ||
      lower.endsWith('.mov') ||
      lower.endsWith('.webm') ||
      lower.includes('/video/upload/') ||
      lower.includes('.mp4?') ||
      lower.includes('.mov?') ||
      lower.includes('.webm?')
    );
  }

  private sanitize(message: string): string {
    if (!message) return 'Unknown Instagram publishing error';
    // Strip any possible access token or secrets from error output
    return message
      .replace(/EA[A-Za-z0-9]+/g, '[REDACTED_TOKEN]')
      .replace(/access_token=[^&]+/gi, 'access_token=[REDACTED]');
  }
}
