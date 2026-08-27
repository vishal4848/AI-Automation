import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScheduledPost, SocialAccount } from '@prisma/client';
import { SocialPublisher } from './social-publisher.interface';
import { decrypt } from '../../../common/utils/encryption.util';

const SUPPORTED_VERSIONS = ['202601', '202603', '202503'];

@Injectable()
export class LinkedInPublisher implements SocialPublisher {
  private readonly logger = new Logger(LinkedInPublisher.name);

  constructor(private readonly configService: ConfigService) {}

  async validate(account: SocialAccount, post: ScheduledPost): Promise<boolean> {
    if (!account) {
      throw new Error('LINKEDIN_NOT_CONNECTED: No LinkedIn account connected.');
    }
    const accountId = account.platformUserId || account.pageId;
    if (!accountId) {
      throw new Error('LINKEDIN_ACCOUNT_NOT_FOUND: Missing LinkedIn member or organization ID.');
    }
    if (!account.accessTokenEncrypted) {
      throw new Error('LINKEDIN_TOKEN_EXPIRED: Missing access token. Please reconnect your LinkedIn account.');
    }
    if (post.mediaUrl && typeof post.mediaUrl === 'string') {
      if (post.mediaUrl.includes('localhost') || post.mediaUrl.includes('127.0.0.1')) {
        throw new Error('LINKEDIN_MEDIA_INVALID: Localhost URLs cannot be accessed by LinkedIn.');
      }
      if (
        !post.mediaUrl.startsWith('https://') &&
        !post.mediaUrl.startsWith('http://') &&
        !post.mediaUrl.startsWith('data:')
      ) {
        throw new Error('LINKEDIN_MEDIA_INVALID: Media URL must be a valid HTTPS link or data URI.');
      }
    }
    return true;
  }

  async publish(account: SocialAccount, post: ScheduledPost): Promise<string> {
    await this.validate(account, post);

    const configuredVersion = this.configService.get<string>('LINKEDIN_API_VERSION');
    const primaryVersion = configuredVersion && configuredVersion !== '202401' ? configuredVersion : '202601';
    const versionsToTry = [primaryVersion, ...SUPPORTED_VERSIONS.filter((v) => v !== primaryVersion)];

    const encryptionKey = this.configService.get<string>('TOKEN_ENCRYPTION_KEY') || 'dev-token-encryption-key-32-chars-long';

    let accessToken: string;
    try {
      accessToken = decrypt(account.accessTokenEncrypted, encryptionKey);
    } catch {
      throw new Error('LINKEDIN_TOKEN_EXPIRED: Failed to decrypt LinkedIn access token. Please reconnect your LinkedIn account.');
    }

    const authorUrn = this.resolveAuthorUrn(account);
    const hasMedia = Boolean(post.mediaUrl && post.mediaUrl.trim());
    const isVideo = hasMedia && this.isVideoUrl(post.mediaUrl);

    let lastError: any = null;

    for (const version of versionsToTry) {
      try {
        if (!hasMedia) {
          return await this.publishTextPost(authorUrn, accessToken, version, post);
        } else if (isVideo) {
          return await this.publishVideoPost(authorUrn, accessToken, version, post);
        } else {
          return await this.publishImagePost(authorUrn, accessToken, version, post);
        }
      } catch (error: any) {
        lastError = error;
        // If the error is an inactive version (426), try next active version in fallback list
        if (error.message && error.message.includes('not active')) {
          this.logger.warn(`LinkedIn version ${version} not active; attempting fallback version...`);
          continue;
        }
        // For other errors, don't loop endlessly
        break;
      }
    }

    const sanitized = this.sanitize(lastError?.message || 'LinkedIn publishing failed');
    this.logger.error(`Failed to publish to LinkedIn: ${sanitized}`);
    throw new Error(sanitized);
  }

  /**
   * Publishes a text-only post to LinkedIn.
   */
  private async publishTextPost(
    authorUrn: string,
    accessToken: string,
    version: string,
    post: ScheduledPost,
  ): Promise<string> {
    const postRes = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'LinkedIn-Version': version,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        author: authorUrn,
        commentary: post.caption || '',
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      }),
    });

    if (!postRes.ok && postRes.status !== 201) {
      const errData = await postRes.json().catch(() => ({}));
      this.handleLinkedInError(errData, postRes.status);
    }

    const externalPostId =
      postRes.headers.get('x-restli-id') || postRes.headers.get('x-linkedin-id') || `urn:li:post:${Date.now()}`;
    this.logger.log(`Published text post to LinkedIn (${authorUrn}) successfully. Post ID: ${externalPostId}`);
    return externalPostId;
  }

  /**
   * Publishes an image post to LinkedIn using the official REST Images and Posts APIs.
   */
  private async publishImagePost(
    authorUrn: string,
    accessToken: string,
    version: string,
    post: ScheduledPost,
  ): Promise<string> {
    // 1. Initialize image upload
    const initRes = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'LinkedIn-Version': version,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: authorUrn,
        },
      }),
    });

    const initData = await initRes.json().catch(() => ({}));
    if (!initRes.ok || initData.error || !initData.value) {
      this.handleLinkedInError(initData, initRes.status);
    }

    const uploadUrl = initData.value?.uploadUrl;
    const imageUrn = initData.value?.image;

    if (!uploadUrl || !imageUrn) {
      throw new Error('LINKEDIN_UPLOAD_FAILED: No upload URL or image URN returned from LinkedIn.');
    }

    // 2. Fetch or extract media binary
    const { buffer: mediaBuffer, contentType } = await this.getMediaBuffer(post.mediaUrl);

    // 3. Upload binary to LinkedIn upload URL
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType || 'image/jpeg',
      },
      body: mediaBuffer as any,
    });

    if (!uploadRes.ok && uploadRes.status !== 201) {
      throw new Error(`LINKEDIN_UPLOAD_FAILED: Failed to upload binary to LinkedIn media server (Status: ${uploadRes.status}).`);
    }

    // 4. Create LinkedIn Post referencing the uploaded image URN
    const postRes = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'LinkedIn-Version': version,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        author: authorUrn,
        commentary: post.caption || '',
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        content: {
          media: {
            title: 'AI Generated Media',
            id: imageUrn,
          },
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      }),
    });

    if (!postRes.ok && postRes.status !== 201) {
      const errData = await postRes.json().catch(() => ({}));
      this.handleLinkedInError(errData, postRes.status);
    }

    const externalPostId =
      postRes.headers.get('x-restli-id') || postRes.headers.get('x-linkedin-id') || imageUrn;
    this.logger.log(`Published image post to LinkedIn (${authorUrn}) successfully. Post ID: ${externalPostId}`);
    return externalPostId;
  }

  /**
   * Publishes a video post to LinkedIn with asynchronous processing status polling.
   */
  private async publishVideoPost(
    authorUrn: string,
    accessToken: string,
    version: string,
    post: ScheduledPost,
  ): Promise<string> {
    // 1. Fetch video binary
    const { buffer: mediaBuffer } = await this.getMediaBuffer(post.mediaUrl);

    // 2. Initialize video upload
    const initRes = await fetch('https://api.linkedin.com/rest/videos?action=initializeUpload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'LinkedIn-Version': version,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: authorUrn,
          fileSizeBytes: mediaBuffer.byteLength,
          uploadCaptions: false,
          uploadThumbnail: false,
        },
      }),
    });

    const initData = await initRes.json().catch(() => ({}));
    if (!initRes.ok || initData.error || !initData.value) {
      this.handleLinkedInError(initData, initRes.status);
    }

    const uploadInstructions = initData.value?.uploadInstructions;
    const videoUrn = initData.value?.video;

    if (!uploadInstructions || uploadInstructions.length === 0 || !videoUrn) {
      throw new Error('LINKEDIN_UPLOAD_FAILED: Missing video upload instructions from LinkedIn.');
    }

    const uploadUrl = uploadInstructions[0].uploadUrl;

    // 3. Upload binary to LinkedIn video upload URL
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
      },
      body: mediaBuffer as any,
    });

    if (!uploadRes.ok && uploadRes.status !== 201) {
      throw new Error(`LINKEDIN_UPLOAD_FAILED: Failed to upload video binary (Status: ${uploadRes.status}).`);
    }

    // 4. Poll video processing state until AVAILABLE (max 45 seconds)
    const maxAttempts = 15;
    let videoReady = false;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const statusRes = await fetch(`https://api.linkedin.com/rest/videos/${encodeURIComponent(videoUrn)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'LinkedIn-Version': version,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      });

      if (statusRes.ok) {
        const statusData = await statusRes.json().catch(() => ({}));
        if (statusData.status === 'AVAILABLE') {
          videoReady = true;
          break;
        } else if (statusData.status === 'PROCESSING_FAILED') {
          throw new Error('LINKEDIN_MEDIA_INVALID: LinkedIn video processing failed.');
        }
      }
    }

    if (!videoReady) {
      this.logger.warn(`LinkedIn video processing not finalized after polling; attempting post creation with URN ${videoUrn}`);
    }

    // 5. Create LinkedIn Post referencing the uploaded video URN
    const postRes = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'LinkedIn-Version': version,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        author: authorUrn,
        commentary: post.caption || '',
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        content: {
          media: {
            title: 'AI Generated Video',
            id: videoUrn,
          },
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      }),
    });

    if (!postRes.ok && postRes.status !== 201) {
      const errData = await postRes.json().catch(() => ({}));
      this.handleLinkedInError(errData, postRes.status);
    }

    const externalPostId =
      postRes.headers.get('x-restli-id') || postRes.headers.get('x-linkedin-id') || videoUrn;
    this.logger.log(`Published video post to LinkedIn (${authorUrn}) successfully. Post ID: ${externalPostId}`);
    return externalPostId;
  }

  private async getMediaBuffer(mediaUrl: string): Promise<{ buffer: Buffer; contentType: string }> {
    if (mediaUrl.startsWith('data:')) {
      const match = mediaUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        return {
          contentType: match[1],
          buffer: Buffer.from(match[2], 'base64'),
        };
      }
    }

    const mediaRes = await fetch(mediaUrl);
    if (!mediaRes.ok) {
      throw new Error(`LINKEDIN_MEDIA_INVALID: Failed to fetch media from URL (Status: ${mediaRes.status}).`);
    }

    const arrayBuf = await mediaRes.arrayBuffer();
    return {
      contentType:
        mediaRes.headers.get('content-type') ||
        (this.isVideoUrl(mediaUrl) ? 'video/mp4' : 'image/jpeg'),
      buffer: Buffer.from(arrayBuf),
    };
  }

  private resolveAuthorUrn(account: SocialAccount): string {
    const rawId = account.platformUserId || account.pageId || '';
    if (rawId.startsWith('urn:li:')) {
      return rawId;
    }
    if (account.pageId) {
      return `urn:li:organization:${account.pageId}`;
    }
    return `urn:li:person:${rawId}`;
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

  private handleLinkedInError(errorData: any, statusCode: number): never {
    const errorMsg =
      errorData?.message ||
      errorData?.error?.message ||
      errorData?.description ||
      `LinkedIn API error (Status: ${statusCode})`;

    if (
      statusCode === 401 ||
      errorMsg.toLowerCase().includes('token') ||
      errorMsg.toLowerCase().includes('expired')
    ) {
      throw new Error(`LINKEDIN_TOKEN_EXPIRED: ${errorMsg}`);
    }
    if (
      statusCode === 403 ||
      errorMsg.toLowerCase().includes('permission') ||
      errorMsg.toLowerCase().includes('access denied')
    ) {
      throw new Error(`LINKEDIN_PERMISSION_DENIED: ${errorMsg}`);
    }
    if (statusCode === 429 || errorMsg.toLowerCase().includes('rate limit')) {
      throw new Error(`LINKEDIN_RATE_LIMIT: ${errorMsg}`);
    }
    if (statusCode === 400 || errorMsg.toLowerCase().includes('invalid')) {
      throw new Error(`LINKEDIN_MEDIA_INVALID: ${errorMsg}`);
    }
    throw new Error(`LINKEDIN_PUBLISH_FAILED: ${errorMsg}`);
  }

  private sanitize(message: string): string {
    if (!message) return 'Unknown LinkedIn publishing error';
    return message
      .replace(/AQ[A-Za-z0-9_-]{20,}/g, '[REDACTED_TOKEN]')
      .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]');
  }
}
