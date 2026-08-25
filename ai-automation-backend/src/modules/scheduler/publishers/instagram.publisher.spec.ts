import { Test, TestingModule } from '@nestjs/testing';
import { InstagramPublisher } from './instagram.publisher';
import { ConfigService } from '@nestjs/config';
import { encrypt } from '../../../common/utils/encryption.util';

describe('InstagramPublisher', () => {
  let publisher: InstagramPublisher;
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
        InstagramPublisher,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    publisher = module.get<InstagramPublisher>(InstagramPublisher);
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should reject when account has no access token', async () => {
      const account: any = { platformUserId: 'ig-123', accessTokenEncrypted: null };
      const post: any = { mediaUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' };

      await expect(publisher.validate(account, post)).rejects.toThrow('INSTAGRAM_TOKEN_EXPIRED');
    });

    it('should reject localhost media URLs', async () => {
      const encryptedToken = encrypt('EAABmocktoken', encryptionKey);
      const account: any = { platformUserId: 'ig-123', accessTokenEncrypted: encryptedToken };
      const post: any = { mediaUrl: 'http://localhost:3000/images/demo.png' };

      await expect(publisher.validate(account, post)).rejects.toThrow('INSTAGRAM_MEDIA_INVALID');
    });

    it('should accept valid public HTTPS Cloudinary URLs', async () => {
      const encryptedToken = encrypt('EAABmocktoken', encryptionKey);
      const account: any = { platformUserId: 'ig-123', accessTokenEncrypted: encryptedToken };
      const post: any = { mediaUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' };

      const result = await publisher.validate(account, post);
      expect(result).toBe(true);
    });
  });
});
