import { Test, TestingModule } from '@nestjs/testing';
import { SocialService } from './social.service';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { createSignedOAuthState } from '../../common/utils/encryption.util';

describe('SocialService', () => {
  let service: SocialService;
  let prisma: PrismaService;
  let config: ConfigService;
  const encryptionKey = 'test-32-char-encryption-key-12345';

  const mockPrisma = {
    socialAccount: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockConfig = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    mockConfig.get.mockImplementation((key: string) => {
      if (key === 'META_APP_ID') return '1234567890';
      if (key === 'META_APP_SECRET') return 'meta_secret_test_key';
      if (key === 'META_REDIRECT_URI') return 'http://localhost:3001/api/v1/social/instagram/callback';
      if (key === 'META_API_VERSION') return 'v20.0';
      if (key === 'TOKEN_ENCRYPTION_KEY') return encryptionKey;
      if (key === 'jwt.secret') return encryptionKey;
      if (key === 'FRONTEND_URL') return 'http://localhost:3000';
      return null;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<SocialService>(SocialService);
    prisma = module.get<PrismaService>(PrismaService);
    config = module.get<ConfigService>(ConfigService);
    jest.clearAllMocks();
  });

  describe('getInstagramConnectUrl', () => {
    it('should generate valid Meta Instagram Login dialog URL with required permissions and signed state', () => {
      const url = service.getInstagramConnectUrl('user-123');

      expect(url).toContain('https://www.facebook.com/v20.0/dialog/oauth');
      expect(url).toContain('client_id=1234567890');
      expect(url).toContain('scope=instagram_basic');
      expect(url).toContain('state=');
      // Verify state has payload and HMAC signature (contains a dot)
      const stateParam = new URL(url).searchParams.get('state');
      expect(stateParam).toContain('.');
    });

    it('should throw BadRequestException if Meta credentials are not configured', () => {
      mockConfig.get.mockReturnValue(null);

      expect(() => {
        service.getInstagramConnectUrl('user-123');
      }).toThrow(BadRequestException);
    });
  });

  describe('handleInstagramCallback state validation', () => {
    it('should reject tampered or invalid state parameter', async () => {
      await expect(
        service.handleInstagramCallback('auth_code_123', 'tampered_state_token')
      ).rejects.toThrow('INSTAGRAM_AUTH_FAILED');
    });

    it('should reject state parameter with forged signature', async () => {
      const validState = createSignedOAuthState('user-123', encryptionKey);
      const forgedState = validState.slice(0, -4) + '0000';

      await expect(
        service.handleInstagramCallback('auth_code_123', forgedState)
      ).rejects.toThrow('INSTAGRAM_AUTH_FAILED');
    });
  });

  describe('getFacebookConnectUrl', () => {
    it('should generate valid Meta Facebook OAuth dialog URL with pages permissions and signed state', () => {
      const url = service.getFacebookConnectUrl('user-123');

      expect(url).toContain('https://www.facebook.com/v20.0/dialog/oauth');
      expect(url).toContain('client_id=1234567890');
      expect(url).toContain('pages_show_list');
      expect(url).toContain('pages_manage_posts');
      expect(url).toContain('pages_read_engagement');
      expect(url).toContain('state=');
      const stateParam = new URL(url).searchParams.get('state');
      expect(stateParam).toContain('.');
    });
  });

  describe('handleFacebookCallback state validation', () => {
    it('should reject tampered or invalid state parameter for Facebook OAuth', async () => {
      await expect(
        service.handleFacebookCallback('auth_code_123', 'tampered_state_token')
      ).rejects.toThrow('FACEBOOK_AUTH_FAILED');
    });
  });

  describe('getLinkedInConnectUrl', () => {
    it('should generate valid LinkedIn OAuth dialog URL with openid and w_member_social scopes and signed state', () => {
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'LINKEDIN_CLIENT_ID') return 'linkedin_client_123';
        if (key === 'LINKEDIN_REDIRECT_URI') return 'http://localhost:3001/api/v1/social/linkedin/callback';
        if (key === 'TOKEN_ENCRYPTION_KEY') return encryptionKey;
        if (key === 'jwt.secret') return encryptionKey;
        return null;
      });

      const url = service.getLinkedInConnectUrl('user-123');

      expect(url).toContain('https://www.linkedin.com/oauth/v2/authorization');
      expect(url).toContain('client_id=linkedin_client_123');
      expect(url).toContain('openid');
      expect(url).toContain('w_member_social');
      expect(url).toContain('state=');
      const stateParam = new URL(url).searchParams.get('state');
      expect(stateParam).toContain('.');
    });
  });

  describe('handleLinkedInCallback state validation', () => {
    it('should reject tampered or invalid state parameter for LinkedIn OAuth', async () => {
      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'LINKEDIN_CLIENT_ID') return 'linkedin_client_123';
        if (key === 'LINKEDIN_CLIENT_SECRET') return 'linkedin_secret_123';
        if (key === 'LINKEDIN_REDIRECT_URI') return 'http://localhost:3001/api/v1/social/linkedin/callback';
        if (key === 'TOKEN_ENCRYPTION_KEY') return encryptionKey;
        return null;
      });

      await expect(
        service.handleLinkedInCallback('auth_code_123', 'tampered_state_token')
      ).rejects.toThrow('LINKEDIN_AUTH_FAILED');
    });
  });

  describe('getAccounts', () => {
    it('should query accounts scoped strictly to the authenticated userId and never return tokens', async () => {
      mockPrisma.socialAccount.findMany.mockResolvedValue([
        {
          id: 'acc-1',
          platform: 'Instagram',
          username: 'creator_studio',
          status: 'CONNECTED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const accounts = await service.getAccounts('user-123');

      expect(accounts).toHaveLength(1);
      expect(accounts[0].username).toBe('creator_studio');
      expect(mockPrisma.socialAccount.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        select: expect.not.objectContaining({ accessTokenEncrypted: true }),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('disconnectAccount', () => {
    it('should prevent User A from disconnecting User B account (IDOR protection)', async () => {
      mockPrisma.socialAccount.findFirst.mockResolvedValue(null);

      await expect(
        service.disconnectAccount('attacker-user', 'victim-account-id')
      ).rejects.toThrow(BadRequestException);
    });

    it('should delete account when owned by authenticated user', async () => {
      mockPrisma.socialAccount.findFirst.mockResolvedValue({
        id: 'acc-1',
        userId: 'user-123',
      });
      mockPrisma.socialAccount.delete.mockResolvedValue({});

      const result = await service.disconnectAccount('user-123', 'acc-1');

      expect(result.success).toBe(true);
      expect(mockPrisma.socialAccount.delete).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
      });
    });
  });
});
