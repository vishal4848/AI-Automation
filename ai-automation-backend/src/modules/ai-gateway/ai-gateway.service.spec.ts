import { Test, TestingModule } from '@nestjs/testing';
import { AIGatewayService } from './ai-gateway.service';
import { ProviderManagerService } from './provider-manager.service';
import { ConfigService } from '@nestjs/config';

describe('AIGatewayService', () => {
  let service: AIGatewayService;
  let providerManager: ProviderManagerService;

  const mockProvider = {
    name: 'huggingface',
    generateImage: jest.fn(),
    generateVideo: jest.fn(),
    enhancePrompt: jest.fn(),
    isAvailable: jest.fn().mockReturnValue(true),
  };

  const mockProviderManager = {
    getProvider: jest.fn().mockReturnValue(mockProvider),
    getProviderForModel: jest.fn().mockReturnValue(mockProvider),
    getAvailableProviders: jest.fn().mockReturnValue(['huggingface']),
    getAllProviders: jest.fn().mockReturnValue([mockProvider]),
  };

  const mockConfig = {
    get: jest.fn().mockReturnValue('test-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIGatewayService,
        { provide: ProviderManagerService, useValue: mockProviderManager },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AIGatewayService>(AIGatewayService);
    providerManager = module.get<ProviderManagerService>(ProviderManagerService);
    jest.clearAllMocks();
  });

  describe('generateImage', () => {
    it('should successfully return generated image from routed provider', async () => {
      mockProvider.generateImage.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/image.png' },
        provider: 'huggingface',
        model: 'flux-schnell',
        latencyMs: 850,
      });

      const result = await service.generateImage({
        prompt: 'A futuristic city',
        model: 'flux-schnell',
      });

      expect(result.success).toBe(true);
      expect(result.data?.url).toBe('https://example.com/image.png');
      expect(mockProviderManager.getProviderForModel).toHaveBeenCalledWith('flux-schnell');
    });

    it('should not retry if provider returns unconfigured error code', async () => {
      mockProvider.generateImage.mockResolvedValue({
        success: false,
        error: 'Provider not configured',
        errorCode: 'PROVIDER_NOT_CONFIGURED',
        provider: 'huggingface',
        model: 'flux-schnell',
        latencyMs: 10,
      });

      const result = await service.generateImage({
        prompt: 'A futuristic city',
        model: 'flux-schnell',
      });

      expect(result.success).toBe(false);
      expect(mockProvider.generateImage).toHaveBeenCalledTimes(1);
    });

    it('should retry on transient failures up to maxRetries', async () => {
      mockProvider.generateImage
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({
          success: true,
          data: { url: 'https://example.com/retry-success.png' },
          provider: 'huggingface',
          model: 'flux-schnell',
          latencyMs: 1200,
        });

      const result = await service.generateImage(
        { prompt: 'A futuristic city', model: 'flux-schnell' },
        { maxRetries: 1 }
      );

      expect(result.success).toBe(true);
      expect(mockProvider.generateImage).toHaveBeenCalledTimes(2);
    });
  });

  describe('enhancePrompt', () => {
    it('should return enhanced prompt from provider', async () => {
      mockProvider.enhancePrompt.mockResolvedValue({
        success: true,
        data: 'A futuristic city, neon cyberpunk style, 8k resolution',
      });

      const result = await service.enhancePrompt({
        prompt: 'A futuristic city',
        category: 'image',
      });

      expect(result).toBe('A futuristic city, neon cyberpunk style, 8k resolution');
    });

    it('should fallback to original prompt on provider failure', async () => {
      mockProvider.enhancePrompt.mockRejectedValue(new Error('API error'));

      const result = await service.enhancePrompt({
        prompt: 'Original Prompt',
        category: 'image',
      });

      expect(result).toBe('Original Prompt');
    });
  });
});
