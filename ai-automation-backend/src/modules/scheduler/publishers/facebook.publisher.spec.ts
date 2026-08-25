import { Test, TestingModule } from '@nestjs/testing';
import { FacebookPublisher } from './facebook.publisher';
import { ConfigService } from '@nestjs/config';
import { encrypt } from '../../../common/utils/encryption.util';

describe('FacebookPublisher', () => {
  let publisher: FacebookPublisher;
  let config: ConfigService;
  const encryptionKey = 'test-32-char-encryption-key-12345';

  const mockConfig = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'META_API_VERSION') return 'v20.0';
      if (key === 'TOKEN_ENCRYPTION_KEY') return encryptionKey;
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacebookPublisher,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    publisher = module.get<FacebookPublisher>(FacebookPublisher);
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should reject when account has no access token', async () => {
      const account: any = { platformUserId: 'fb-page-123', pageId: 'fb-page-123', accessTokenEncrypted: null };
      const post: any = { mediaUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' };

      await expect(publisher.validate(account, post)).rejects.toThrow('FACEBOOK_TOKEN_EXPIRED');
    });

    it('should reject localhost media URLs', async () => {
      const encryptedToken = encrypt('EAABmocktoken', encryptionKey);
      const account: any = { platformUserId: 'fb-page-123', pageId: 'fb-page-123', accessTokenEncrypted: encryptedToken };
      const post: any = { mediaUrl: 'http://localhost:3000/images/demo.png' };

      await expect(publisher.validate(account, post)).rejects.toThrow('FACEBOOK_MEDIA_INVALID');
    });

    it('should accept valid public HTTPS Cloudinary URLs', async () => {
      const encryptedToken = encrypt('EAABmocktoken', encryptionKey);
      const account: any = { platformUserId: 'fb-page-123', pageId: 'fb-page-123', accessTokenEncrypted: encryptedToken };
      const post: any = { mediaUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' };

      const result = await publisher.validate(account, post);
      expect(result).toBe(true);
    });
  });

  describe('publish photo', () => {
    it('should call Meta Graph API /photos endpoint and return post ID', async () => {
      const encryptedToken = encrypt('EAABmockpagetoken', encryptionKey);
      const account: any = {
        platform: 'Facebook',
        platformUserId: '100200300',
        pageId: '100200300',
        accessTokenEncrypted: encryptedToken,
      };
      const post: any = {
        mediaUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        caption: 'Test post caption',
      };

      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({ id: 'photo_999', post_id: '100200300_999' }),
      } as any);

      const result = await publisher.publish(account, post);

      expect(result).toBe('100200300_999');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v20.0/100200300/photos',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            caption: 'Test post caption',
            access_token: 'EAABmockpagetoken',
          }),
        })
      );
    });
  });

  describe('publish video', () => {
    it('should call Meta Graph API /videos endpoint for video URLs', async () => {
      const encryptedToken = encrypt('EAABmockpagetoken', encryptionKey);
      const account: any = {
        platform: 'Facebook',
        platformUserId: '100200300',
        pageId: '100200300',
        accessTokenEncrypted: encryptedToken,
      };
      const post: any = {
        mediaUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
        caption: 'Test video caption',
      };

      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({ id: 'video_post_888' }),
      } as any);

      const result = await publisher.publish(account, post);

      expect(result).toBe('video_post_888');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v20.0/100200300/videos',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            file_url: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
            description: 'Test video caption',
            access_token: 'EAABmockpagetoken',
          }),
        })
      );
    });
  });
});
