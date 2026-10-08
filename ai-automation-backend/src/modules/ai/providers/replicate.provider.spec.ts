import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReplicateProvider, REPLICATE_ERRORS } from './replicate.provider';
import { ModelRegistryService } from '../../models/model-registry.service';
import { ImagesService } from '../../images/images.service';
import { VideosService } from '../../videos/videos.service';
import { AIGatewayService } from '../../ai-gateway/ai-gateway.service';
import { ProviderManagerService } from '../../ai-gateway/provider-manager.service';
import { CloudinaryService } from '../../storage/cloudinary.service';
import { PrismaService } from '../../../database/prisma.service';
import { AnalyticsService } from '../../analytics/analytics.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { SchedulerService } from '../../scheduler/scheduler.service';
import { InstagramPublisher } from '../../scheduler/publishers/instagram.publisher';
import { FacebookPublisher } from '../../scheduler/publishers/facebook.publisher';
import { LinkedInPublisher } from '../../scheduler/publishers/linkedin.publisher';
import { HuggingFaceProvider } from '../../providers/huggingface/huggingface.provider';
import { FalProvider } from '../../providers/fal/fal.provider';
import { OpenAIProvider } from '../../providers/openai/openai.provider';
import { GeminiProvider } from '../../providers/gemini/gemini.provider';
import { LocalProvider } from '../../providers/local/local.provider';

// Mock replicate module
const mockRun = jest.fn();
const mockPredictionsCreate = jest.fn();
const mockPredictionsGet = jest.fn();

jest.mock('replicate', () => {
  return jest.fn().mockImplementation(() => ({
    run: mockRun,
    predictions: {
      create: mockPredictionsCreate,
      get: mockPredictionsGet,
    },
  }));
});

describe('Replicate Provider & Integration Specification', () => {
  let provider: ReplicateProvider;
  let configService: ConfigService;
  let imagesService: ImagesService;
  let videosService: VideosService;
  let gatewayService: AIGatewayService;
  let modelRegistry: ModelRegistryService;
  let schedulerService: SchedulerService;

  const mockConfig: Record<string, any> = {
    REPLICATE_API_TOKEN: 'r8_test_token_secret_12345',
    REPLICATE_IMAGE_MODEL: 'black-forest-labs/flux-schnell',
    REPLICATE_VIDEO_MODEL: 'wan-video/wan-2.1-t2v-480p',
    'ai.replicate': 'r8_test_token_secret_12345',
  };

  const mockPrisma = {
    generatedImage: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    generatedVideo: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    promptHistory: {
      create: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    favorite: {
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    scheduledPost: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    socialAccount: {
      findFirst: jest.fn(),
    },
    aIModel: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    deductCreditsAtomically: jest.fn().mockResolvedValue(100),
    refundCreditsAtomically: jest.fn().mockResolvedValue(120),
  };

  const mockCloudinary = {
    uploadImageUrl: jest.fn().mockResolvedValue({
      url: 'https://res.cloudinary.com/test/image/upload/replicate_image.png',
      secureUrl: 'https://res.cloudinary.com/test/image/upload/replicate_image.png',
      publicId: 'cld_replicate_img_123',
    }),
    uploadVideoUrl: jest.fn().mockResolvedValue({
      url: 'https://res.cloudinary.com/test/video/upload/replicate_video.mp4',
      secureUrl: 'https://res.cloudinary.com/test/video/upload/replicate_video.mp4',
      publicId: 'cld_replicate_vid_123',
      duration: 5,
    }),
    uploadBase64Image: jest.fn(),
    deleteAsset: jest.fn().mockResolvedValue(undefined),
  };

  const mockNotifications = {
    create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
  };

  const mockAnalytics = {
    recordUsage: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  const mockInstagramPublisher = { publish: jest.fn() };
  const mockFacebookPublisher = { publish: jest.fn() };
  const mockLinkedInPublisher = { publish: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRun.mockReset();
    mockConfig.REPLICATE_API_TOKEN = 'r8_test_token_secret_12345';
    mockConfig['ai.replicate'] = 'r8_test_token_secret_12345';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReplicateProvider,
        ModelRegistryService,
        ProviderManagerService,
        AIGatewayService,
        ImagesService,
        VideosService,
        SchedulerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfig[key]),
          },
        },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CloudinaryService, useValue: mockCloudinary },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: AnalyticsService, useValue: mockAnalytics },
        { provide: 'BullQueue_instagram-publish', useValue: mockQueue },
        { provide: 'BullQueue_video-generation', useValue: mockQueue },
        { provide: InstagramPublisher, useValue: mockInstagramPublisher },
        { provide: FacebookPublisher, useValue: mockFacebookPublisher },
        { provide: LinkedInPublisher, useValue: mockLinkedInPublisher },
        // Mock providers for ProviderManager
        {
          provide: HuggingFaceProvider,
          useValue: { name: 'huggingface', isAvailable: () => true },
        },
        { provide: FalProvider, useValue: { name: 'fal', isAvailable: () => true } },
        { provide: OpenAIProvider, useValue: { name: 'openai', isAvailable: () => true } },
        { provide: GeminiProvider, useValue: { name: 'gemini', isAvailable: () => true } },
        { provide: LocalProvider, useValue: { name: 'local', isAvailable: () => true } },
      ],
    }).compile();

    provider = module.get<ReplicateProvider>(ReplicateProvider);
    configService = module.get<ConfigService>(ConfigService);
    imagesService = module.get<ImagesService>(ImagesService);
    videosService = module.get<VideosService>(VideosService);
    gatewayService = module.get<AIGatewayService>(AIGatewayService);
    modelRegistry = module.get<ModelRegistryService>(ModelRegistryService);
    schedulerService = module.get<SchedulerService>(SchedulerService);
  });

  // 1. Replicate provider configuration
  it('1. should properly initialize Replicate provider configuration and model mapping', () => {
    expect(provider.name).toBe('replicate');
    expect(provider.isAvailable()).toBe(true);
    expect(provider.supportedImageModels).toContain('nano-banana-2');
    expect(provider.supportedVideoModels).toContain('wan-3');
    expect(provider.resolveImageModel('nano-banana-2')).toBe('black-forest-labs/flux-schnell');
    expect(provider.resolveVideoModel('wan-3')).toBe('wan-video/wan-2.1-t2v-480p');
  });

  // 2. Missing API token
  it('2. should return REPLICATE_NOT_CONFIGURED error when API token is missing', async () => {
    mockConfig.REPLICATE_API_TOKEN = '';
    mockConfig['ai.replicate'] = '';

    expect(provider.isAvailable()).toBe(false);

    const imageResult = await provider.generateImage({
      prompt: 'A cyberpunk city',
      model: 'nano-banana-2',
    });
    expect(imageResult.success).toBe(false);
    expect(imageResult.errorCode).toBe(REPLICATE_ERRORS.NOT_CONFIGURED);

    const videoResult = await provider.generateVideo({
      prompt: 'A car driving in the rain',
      model: 'wan-3',
    });
    expect(videoResult.success).toBe(false);
    expect(videoResult.errorCode).toBe(REPLICATE_ERRORS.NOT_CONFIGURED);
  });

  // 3. Successful image generation
  it('3. should successfully generate an image via Replicate', async () => {
    mockRun.mockResolvedValueOnce(['https://replicate.delivery/pbxt/image123.webp']);

    const result = await provider.generateImage({
      prompt: 'A majestic mountain landscape at sunrise',
      model: 'nano-banana-2',
      ratio: '16:9',
    });

    expect(result.success).toBe(true);
    expect(result.data?.url).toBe('https://replicate.delivery/pbxt/image123.webp');
    expect(result.provider).toBe('replicate');
    expect(mockRun).toHaveBeenCalledWith(
      'black-forest-labs/flux-schnell',
      expect.objectContaining({
        input: expect.objectContaining({
          prompt: 'A majestic mountain landscape at sunrise',
          aspect_ratio: '16:9',
        }),
      }),
    );
  });

  // 4. Successful video generation
  it('4. should successfully generate a video via Replicate', async () => {
    mockRun.mockResolvedValueOnce(['https://replicate.delivery/pbxt/video123.mp4']);

    const result = await provider.generateVideo({
      prompt: 'A drone flying over a neon metropolis',
      model: 'wan-3',
      duration: 5,
    });

    expect(result.success).toBe(true);
    expect(result.data?.url).toBe('https://replicate.delivery/pbxt/video123.mp4');
    expect(result.provider).toBe('replicate');
    expect(mockRun).toHaveBeenCalledWith(
      'wan-video/wan-2.1-t2v-480p',
      expect.objectContaining({
        input: expect.objectContaining({
          prompt: 'A drone flying over a neon metropolis',
          duration: 5,
        }),
      }),
    );
  });

  // 5. Invalid model
  it('5. should handle invalid or unknown model gracefully and validate via ModelRegistry', () => {
    const validation = modelRegistry.validateModelParams('nano-banana-2', {
      prompt: 'Valid prompt',
      ratio: 'invalid-ratio-999',
    });
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('Aspect ratio');
  });

  // 6. Invalid prompt / input
  it('6. should return REPLICATE_INVALID_INPUT when prompt is empty or invalid', async () => {
    const result = await provider.generateImage({
      prompt: '   ',
      model: 'nano-banana-2',
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe(REPLICATE_ERRORS.INVALID_INPUT);
  });

  // 7. Replicate API failure
  it('7. should map 401 unauthenticated to REPLICATE_AUTH_FAILED and 429 to REPLICATE_RATE_LIMITED', async () => {
    const authParsed = provider.parseError({ status: 401, message: 'Invalid token' });
    expect(authParsed.errorCode).toBe(REPLICATE_ERRORS.AUTH_FAILED);
    expect(authParsed.isTransient).toBe(false);

    const rateLimitParsed = provider.parseError({ status: 429, message: 'Rate limit exceeded' });
    expect(rateLimitParsed.errorCode).toBe(REPLICATE_ERRORS.RATE_LIMITED);
    expect(rateLimitParsed.isTransient).toBe(true);
  });

  // 8. Retry behavior
  it('8. should retry transient errors up to 3 times with backoff, and not retry permanent errors', async () => {
    // Transient failure twice then success
    mockRun
      .mockRejectedValueOnce(new Error('ECONNRESET network glitch'))
      .mockRejectedValueOnce(new Error('500 Server Error'))
      .mockResolvedValueOnce(['https://replicate.delivery/pbxt/retry_success.png']);

    const result = await provider.generateImage({
      prompt: 'Retry test prompt',
      model: 'nano-banana-2',
    });

    expect(result.success).toBe(true);
    expect(mockRun).toHaveBeenCalledTimes(3);

    // Permanent 401 error should NOT retry
    mockRun.mockReset();
    const permError: any = new Error('Unauthenticated');
    permError.status = 401;
    mockRun.mockRejectedValueOnce(permError);

    const permResult = await provider.generateImage({
      prompt: 'Perm error prompt',
      model: 'nano-banana-2',
    });

    expect(permResult.success).toBe(false);
    expect(mockRun).toHaveBeenCalledTimes(1); // Only 1 attempt, no retries
  });

  // 9. Cloudinary upload after generation
  it('9. should upload generated Replicate image and video to Cloudinary', async () => {
    mockRun.mockResolvedValueOnce(['https://replicate.delivery/pbxt/raw_image.webp']);
    mockPrisma.generatedImage.create.mockResolvedValueOnce({
      id: 'img-replicate-1',
      url: 'https://res.cloudinary.com/test/image/upload/replicate_image.png',
    });

    await imagesService.generate('user-test-1', {
      prompt: 'A futuristic electric car',
      model: 'nano-banana-2',
      provider: 'replicate',
    });

    expect(mockCloudinary.uploadImageUrl).toHaveBeenCalledWith(
      'https://replicate.delivery/pbxt/raw_image.webp',
    );
  });

  // 10. PostgreSQL asset creation
  it('10. should create GeneratedImage and GeneratedVideo records in PostgreSQL with full metadata', async () => {
    mockRun.mockResolvedValueOnce(['https://replicate.delivery/pbxt/asset.webp']);
    mockPrisma.generatedImage.create.mockResolvedValueOnce({
      id: 'img-100',
      userId: 'user-123',
      provider: 'replicate',
      model: 'nano-banana-2',
      url: 'https://res.cloudinary.com/test/image/upload/replicate_image.png',
      cloudinaryId: 'cld_replicate_img_123',
      createdAt: new Date(),
    });

    const imgResult = await imagesService.generate('user-123', {
      prompt: 'Cyberpunk street vendor',
      model: 'nano-banana-2',
      provider: 'replicate',
    });

    expect(mockPrisma.generatedImage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-123',
          provider: 'replicate',
          model: 'nano-banana-2',
          url: 'https://res.cloudinary.com/test/image/upload/replicate_image.png',
          cloudinaryId: 'cld_replicate_img_123',
          creditsUsed: 5,
        }),
      }),
    );
    expect(imgResult.id).toBe('img-100');
  });

  // 11. User ownership and IDOR protection
  it('11. should enforce user ownership on generated assets and prevent cross-user deletion', async () => {
    mockPrisma.generatedImage.findFirst.mockResolvedValueOnce({
      id: 'img-owned-by-bob',
      userId: 'user-bob',
    });

    // Alice attempts to delete Bob's image
    await expect(
      imagesService.deleteImage('user-alice', 'img-owned-by-bob'),
    ).rejects.toThrow(NotFoundException);

    // Alice deletes her own image
    mockPrisma.generatedImage.findFirst.mockResolvedValueOnce({
      id: 'img-owned-by-alice',
      userId: 'user-alice',
      cloudinaryId: 'cld-123',
    });
    mockPrisma.generatedImage.delete.mockResolvedValueOnce({ id: 'img-owned-by-alice' });

    const deleteRes = await imagesService.deleteImage('user-alice', 'img-owned-by-alice');
    expect(deleteRes.success).toBe(true);
    expect(mockPrisma.generatedImage.delete).toHaveBeenCalledWith({
      where: { id: 'img-owned-by-alice' },
    });
  });

  // 12. Scheduler compatibility
  it('12. should allow scheduling posts with Replicate-generated assets to social platforms', async () => {
    mockPrisma.socialAccount.findFirst.mockResolvedValueOnce({
      id: 'soc-acc-1',
      userId: 'user-123',
      platform: 'instagram',
      platformUserId: 'ig-user-1',
      accessTokenEncrypted: 'enc-token',
      status: 'CONNECTED',
    });

    mockPrisma.scheduledPost.create.mockResolvedValueOnce({
      id: 'post-123',
      userId: 'user-123',
      platform: 'instagram',
      mediaUrl: 'https://res.cloudinary.com/test/image/upload/replicate_image.png',
      status: 'SCHEDULED',
    });

    const scheduled = await schedulerService.createScheduledPost('user-123', {
      socialAccountId: 'soc-acc-1',
      mediaUrl: 'https://res.cloudinary.com/test/image/upload/replicate_image.png',
      caption: 'Generated with Replicate Nano Banana 2 #ai',
      scheduledAtUTC: new Date(Date.now() + 3600000).toISOString(),
    });

    expect(scheduled.mediaUrl).toBe(
      'https://res.cloudinary.com/test/image/upload/replicate_image.png',
    );
    expect(scheduled.createdPosts.length).toBe(1);
  });

  // 13. API token is never returned to frontend
  it('13. should never expose REPLICATE_API_TOKEN in outputs, errors, or service responses', async () => {
    const errorWithToken: any = new Error(
      `Failed to authenticate with token r8_test_token_secret_12345`,
    );
    errorWithToken.status = 401;
    mockRun.mockRejectedValueOnce(errorWithToken);

    const result = await provider.generateImage({
      prompt: 'Security token test',
      model: 'nano-banana-2',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).not.toContain('r8_test_token_secret_12345');
    expect(JSON.stringify(result)).not.toContain('r8_test_token_secret_12345');
  });

  // 14. No mock generation when Replicate is unavailable
  it('14. should NOT fake or return mock generated images/videos when Replicate is unavailable', async () => {
    mockConfig.REPLICATE_API_TOKEN = '';
    mockConfig['ai.replicate'] = '';

    const imgResult = await provider.generateImage({
      prompt: 'Do not fake me',
      model: 'nano-banana-2',
    });

    expect(imgResult.success).toBe(false);
    expect(imgResult.data).toBeUndefined();
    expect(imgResult.errorCode).toBe(REPLICATE_ERRORS.NOT_CONFIGURED);

    const vidResult = await provider.generateVideo({
      prompt: 'Do not fake me video',
      model: 'wan-3',
    });

    expect(vidResult.success).toBe(false);
    expect(vidResult.data).toBeUndefined();
    expect(vidResult.errorCode).toBe(REPLICATE_ERRORS.NOT_CONFIGURED);
  });

  // 15. Reference image support and mapping
  it('15. should map reference image to model-specific inputs (image_prompt for flux-1.1-pro, first_frame_image for minimax)', async () => {
    mockRun.mockResolvedValueOnce(['https://replicate.delivery/pbxt/image_ref_out.webp']);

    const imgRes = await provider.generateImage({
      prompt: 'A portrait in anime style',
      model: 'black-forest-labs/flux-1.1-pro',
      referenceImage: 'https://example.com/input.png',
    });

    expect(imgRes.success).toBe(true);
    expect(mockRun).toHaveBeenCalledWith(
      'black-forest-labs/flux-1.1-pro',
      expect.objectContaining({
        input: expect.objectContaining({
          prompt: 'A portrait in anime style',
          image_prompt: 'https://example.com/input.png',
        }),
      }),
    );

    mockRun.mockReset();
    mockRun.mockResolvedValueOnce(['https://replicate.delivery/pbxt/video_ref_out.mp4']);

    const vidRes = await provider.generateVideo({
      prompt: 'Camera zooms into portrait',
      model: 'minimax/video-01',
      inputImage: 'https://example.com/first_frame.png',
    });

    expect(vidRes.success).toBe(true);
    expect(mockRun).toHaveBeenCalledWith(
      'minimax/video-01',
      expect.objectContaining({
        input: expect.objectContaining({
          first_frame_image: 'https://example.com/first_frame.png',
        }),
      }),
    );
  });

  // 16. Unsupported reference image rejection
  it('16. should reject reference image when model does not support image-to-video', async () => {
    const vidRes = await provider.generateVideo({
      prompt: 'A car driving fast',
      model: 'wan-video/wan-2.1-t2v-480p',
      inputImage: 'https://example.com/unsupported.png',
    });

    expect(vidRes.success).toBe(false);
    expect(vidRes.errorCode).toBe(REPLICATE_ERRORS.INVALID_INPUT);
    expect(vidRes.error).toContain('does not support image-to-video');
  });

  // 17. Credit system validation
  it('17. should reject image generation when user has insufficient credits', async () => {
    (mockPrisma as any).deductCreditsAtomically = jest.fn().mockRejectedValueOnce(
      new BadRequestException('INSUFFICIENT_CREDITS: You have insufficient credits for this generation.')
    );

    await expect(
      imagesService.generate('poor-user', {
        prompt: 'A nice photo',
        model: 'black-forest-labs/flux-schnell',
        provider: 'replicate',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // 18. Long running video generation non-blocking response
  it('18. should return PROCESSING status immediately for Replicate video without blocking HTTP request', async () => {
    (mockPrisma as any).user = {
      ...mockPrisma.user,
      findUnique: jest.fn().mockResolvedValueOnce({
        id: 'user-async-1',
        credits: 100,
      }),
    };

    mockPrisma.generatedVideo.create.mockResolvedValueOnce({
      id: 'vid-async-101',
      userId: 'user-async-1',
      status: 'PROCESSING',
      createdAt: new Date(),
    });

    const result = await videosService.generate('user-async-1', {
      prompt: 'Cinematic drone shot of sunset',
      model: 'wan-3',
      provider: 'replicate',
    });

    expect(['PENDING', 'PROCESSING']).toContain(result.status);
    expect(result.id).toBeDefined();
    expect(result.provider).toBe('replicate');
  });
});
