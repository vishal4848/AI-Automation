import { Test, TestingModule } from '@nestjs/testing';
import { LinkedInPublisher } from './linkedin.publisher';
import { ConfigService } from '@nestjs/config';
import { encrypt } from '../../../common/utils/encryption.util';

describe('LinkedInPublisher', () => {
  let publisher: LinkedInPublisher;
  let config: ConfigService;
  const encryptionKey = 'test-32-char-encryption-key-12345';

  const mockConfig = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'LINKEDIN_API_VERSION') return '202601';
      if (key === 'TOKEN_ENCRYPTION_KEY') return encryptionKey;
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkedInPublisher,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    publisher = module.get<LinkedInPublisher>(LinkedInPublisher);
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should reject when account has no access token', async () => {
      const account: any = { platformUserId: 'urn:li:person:12345', accessTokenEncrypted: null };
      const post: any = { mediaUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' };

      await expect(publisher.validate(account, post)).rejects.toThrow('LINKEDIN_TOKEN_EXPIRED');
    });

    it('should reject localhost media URLs', async () => {
      const encryptedToken = encrypt('AQX_mock_token', encryptionKey);
      const account: any = { platformUserId: 'urn:li:person:12345', accessTokenEncrypted: encryptedToken };
      const post: any = { mediaUrl: 'http://localhost:3000/images/demo.png' };

      await expect(publisher.validate(account, post)).rejects.toThrow('LINKEDIN_MEDIA_INVALID');
    });

    it('should accept valid public HTTPS Cloudinary URLs', async () => {
      const encryptedToken = encrypt('AQX_mock_token', encryptionKey);
      const account: any = { platformUserId: 'urn:li:person:12345', accessTokenEncrypted: encryptedToken };
      const post: any = { mediaUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' };

      const result = await publisher.validate(account, post);
      expect(result).toBe(true);
    });
  });

  describe('publish image', () => {
    it('should initialize upload, upload binary, and create post with x-restli-id header', async () => {
      const encryptedToken = encrypt('AQX_mock_token', encryptionKey);
      const account: any = {
        platform: 'LinkedIn',
        platformUserId: 'urn:li:person:782bb4',
        accessTokenEncrypted: encryptedToken,
      };
      const post: any = {
        mediaUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        caption: 'Building with AI on LinkedIn',
      };

      // Mock fetch sequence:
      // 1. Initialize image upload
      // 2. Fetch media from Cloudinary
      // 3. PUT binary to uploadUrl
      // 4. POST /rest/posts
      const mockFetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            value: {
              uploadUrl: 'https://media.licdn.com/upload-target',
              image: 'urn:li:image:D5122AQ_TEST_IMG',
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: { get: () => 'image/jpeg' },
          arrayBuffer: async () => new ArrayBuffer(1024),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          headers: {
            get: (h: string) => (h.toLowerCase() === 'x-restli-id' ? 'urn:li:share:99887766' : null),
          },
          json: async () => ({ id: 'urn:li:share:99887766' }),
        });

      global.fetch = mockFetch as any;

      const result = await publisher.publish(account, post);

      expect(result).toBe('urn:li:share:99887766');
      expect(mockFetch).toHaveBeenCalledTimes(4);
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'https://api.linkedin.com/rest/images?action=initializeUpload',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer AQX_mock_token',
            'LinkedIn-Version': '202601',
          }),
        })
      );
      expect(mockFetch).toHaveBeenNthCalledWith(
        4,
        'https://api.linkedin.com/rest/posts',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            author: 'urn:li:person:782bb4',
            commentary: 'Building with AI on LinkedIn',
            visibility: 'PUBLIC',
            distribution: {
              feedDistribution: 'MAIN_FEED',
              targetEntities: [],
              thirdPartyDistributionChannels: [],
            },
            content: {
              media: {
                title: 'AI Generated Media',
                id: 'urn:li:image:D5122AQ_TEST_IMG',
              },
            },
            lifecycleState: 'PUBLISHED',
            isReshareDisabledByAuthor: false,
          }),
        })
      );
    });
  });

  describe('publish video', () => {
    it('should initialize video upload, upload binary, poll status, and create post', async () => {
      const encryptedToken = encrypt('AQX_mock_token', encryptionKey);
      const account: any = {
        platform: 'LinkedIn',
        platformUserId: 'urn:li:person:782bb4',
        accessTokenEncrypted: encryptedToken,
      };
      const post: any = {
        mediaUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
        caption: 'AI Video on LinkedIn',
      };

      const mockFetch = jest.fn()
        // 1. Fetch video from Cloudinary
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: { get: () => 'video/mp4' },
          arrayBuffer: async () => new ArrayBuffer(2048),
        })
        // 2. Initialize video upload
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            value: {
              uploadInstructions: [{ uploadUrl: 'https://media.licdn.com/upload-video-target' }],
              video: 'urn:li:video:D5122AQ_TEST_VID',
            },
          }),
        })
        // 3. PUT binary to uploadUrl
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
        })
        // 4. Poll status
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ status: 'AVAILABLE' }),
        })
        // 5. POST /rest/posts
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          headers: {
            get: (h: string) => (h.toLowerCase() === 'x-restli-id' ? 'urn:li:share:11223344' : null),
          },
          json: async () => ({ id: 'urn:li:share:11223344' }),
        });

      global.fetch = mockFetch as any;

      const result = await publisher.publish(account, post);

      expect(result).toBe('urn:li:share:11223344');
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });
  });
});
