export interface ReplicateModelConfig {
  provider: 'replicate';
  name: string;
  modelIdentifier: string;
  displayName: string;
  category: 'IMAGE' | 'VIDEO';
  generationType: 'IMAGE' | 'VIDEO';
  isFree: boolean;
  pricePerGeneration: number;
  creditsPerGeneration: number;
  pricingType: 'FREE TIER' | 'PAID' | 'PRO' | 'USAGE-BASED';
  supportsTextToImage?: boolean;
  supportsImageToImage?: boolean;
  supportsTextToVideo?: boolean;
  supportsImageToVideo?: boolean;
  supportsReferenceImage?: boolean;
  supportsNegativePrompt?: boolean;
  supportsSeed?: boolean;
  outputType: string;
  enabled: boolean;
  maxResolution?: string;
  maxDuration?: number;
  description?: string;
  howItWorks?: string;
  bestFor?: string;
  strengths?: string[];
  limitations?: string[];
  inputTypes?: string[];
  outputTypes?: string[];
  supportedCapabilities?: string[];
  pricingReference?: string;
  documentationUrl?: string;
  requiresCredentials?: string;
  qualityScore?: number;
  speedScore?: string;
  costScore?: string;
  examples?: Array<{ title: string; description: string; samplePrompt: string }>;
  capabilities: {
    supportsTextToImage?: boolean;
    supportsImageToImage?: boolean;
    supportsTextToVideo?: boolean;
    supportsImageToVideo?: boolean;
    supportsNegativePrompt?: boolean;
    supportsSeed?: boolean;
    maxResolution?: string;
    maxDuration?: number;
  };
  supportedInputs: {
    aspectRatios?: string[];
    outputFormats?: string[];
    resolutions?: string[];
    durations?: number[];
    supportsReferenceImage?: boolean;
    supportsNegativePrompt?: boolean;
  };
}

export const REPLICATE_MODELS: {
  image: ReplicateModelConfig[];
  video: ReplicateModelConfig[];
} = {
  image: [
    {
      provider: 'replicate',
      name: 'black-forest-labs/flux-1.1-pro',
      modelIdentifier: 'black-forest-labs/flux-1.1-pro',
      displayName: 'FLUX 1.1 Pro (Replicate)',
      category: 'IMAGE',
      generationType: 'IMAGE',
      isFree: false,
      pricePerGeneration: 8,
      creditsPerGeneration: 8,
      pricingType: 'USAGE-BASED',
      supportsTextToImage: true,
      supportsImageToImage: true,
      supportsReferenceImage: true,
      supportsNegativePrompt: false,
      supportsSeed: true,
      outputType: 'image/webp',
      enabled: true,
      maxResolution: '2048x2048',
      description: 'State-of-the-art 12B parameter image generator delivering commercial photorealism, fine typography, and studio lighting.',
      howItWorks: 'Uses rectified flow transformers with high-efficiency 1-pass guidance to synthesize rich, artifact-free textures and coherent geometry.',
      bestFor: 'Commercial campaigns, luxury product staging, architectural visualization, and high-end editorial creatives.',
      strengths: [
        'Exceptional prompt adherence and detail fidelity',
        'Natural skin textures, hair, and complex reflections',
        'Legible typography and sign rendering',
        'Native high resolutions up to 2048x2048'
      ],
      limitations: [
        'Higher latency than draft models (around 8-12 seconds)',
        'Usage-based billing via Replicate API',
        'Does not accept explicit negative prompt inputs'
      ],
      inputTypes: ['Text Prompt', 'Aspect Ratio', 'Seed', 'Output Format'],
      outputTypes: ['Image (WebP / JPEG / PNG)'],
      supportedCapabilities: ['Text-to-Image', 'Image-to-Image', 'Commercial Grade', 'High Resolution'],
      pricingReference: 'Replicate catalog: ~$0.04 per image (8 credits)',
      documentationUrl: 'https://replicate.com/black-forest-labs/flux-1.1-pro',
      requiresCredentials: 'REPLICATE_API_TOKEN',
      qualityScore: 9.8,
      speedScore: 'Moderate (8-12s)',
      costScore: '~$0.04 / gen',
      examples: [
        {
          title: 'Luxury Real Estate',
          description: 'Photorealistic architectural render of modern living spaces with natural light.',
          samplePrompt: 'Modern minimalist penthouse living room with floor-to-ceiling glass windows overlooking misty Vancouver harbor at sunrise, warm oak flooring, soft ambient shadows, ultra-detailed architectural photography, 8k.'
        },
        {
          title: 'Product Staging',
          description: 'Commercial studio cosmetics and luxury accessories showcase.',
          samplePrompt: 'Matte black minimalist cologne bottle standing on dark volcanic rock with subtle morning water mist droplets, dramatic rim lighting, studio depth of field, Vogue advertisement style.'
        }
      ],
      capabilities: {
        supportsTextToImage: true,
        supportsImageToImage: true,
        supportsNegativePrompt: false,
        supportsSeed: true,
        maxResolution: '2048x2048',
      },
      supportedInputs: {
        aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:2', '21:9'],
        outputFormats: ['webp', 'jpg', 'png'],
        supportsReferenceImage: true,
        supportsNegativePrompt: false,
      },
    },
    {
      provider: 'replicate',
      name: 'black-forest-labs/flux-schnell',
      modelIdentifier: 'black-forest-labs/flux-schnell',
      displayName: 'FLUX.1 [schnell] (Replicate)',
      category: 'IMAGE',
      generationType: 'IMAGE',
      isFree: false,
      pricePerGeneration: 5,
      creditsPerGeneration: 5,
      pricingType: 'USAGE-BASED',
      supportsTextToImage: true,
      supportsImageToImage: false,
      supportsReferenceImage: false,
      supportsNegativePrompt: false,
      supportsSeed: true,
      outputType: 'image/webp',
      enabled: true,
      maxResolution: '1024x1024',
      description: 'Ultra-fast 4-step distilled diffusion model designed for rapid visual ideation and cost-effective batch generation.',
      howItWorks: 'Distilled from the base FLUX model to converge on high-quality visuals in only 4 sampling steps without heavy quality loss.',
      bestFor: 'Rapid social media posts, visual brainstorming, concept thumbnails, and quick creative turnarounds.',
      strengths: [
        'Extremely fast generation (1-3 seconds)',
        'Very low cost per generation',
        'Strong prompt following and composition balance',
        'Supports standard social aspect ratios'
      ],
      limitations: [
        'Slightly lower micro-detail than FLUX 1.1 Pro',
        'No image-to-image or reference image support',
        'No negative prompt support'
      ],
      inputTypes: ['Text Prompt', 'Aspect Ratio', 'Seed'],
      outputTypes: ['Image (WebP / JPEG / PNG)'],
      supportedCapabilities: ['Text-to-Image', 'Ultra Fast (1-3s)', 'Economical'],
      pricingReference: 'Replicate catalog: ~$0.003 per image (5 credits)',
      documentationUrl: 'https://replicate.com/black-forest-labs/flux-schnell',
      requiresCredentials: 'REPLICATE_API_TOKEN',
      qualityScore: 9.1,
      speedScore: 'Ultra-fast (1-3s)',
      costScore: '~$0.003 / gen',
      examples: [
        {
          title: 'Social Media Graphic',
          description: 'Instant vibrant graphics tailored for Instagram and LinkedIn feeds.',
          samplePrompt: 'Energetic digital nomad working on a laptop at an outdoor terrace cafe in Lisbon, espresso cup and notebook on marble table, golden sunset glow, high quality lifestyle photography.'
        }
      ],
      capabilities: {
        supportsTextToImage: true,
        supportsImageToImage: false,
        supportsNegativePrompt: false,
        supportsSeed: true,
        maxResolution: '1024x1024',
      },
      supportedInputs: {
        aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:2', '21:9'],
        outputFormats: ['webp', 'jpg', 'png'],
        supportsReferenceImage: false,
        supportsNegativePrompt: false,
      },
    },
    {
      provider: 'replicate',
      name: 'black-forest-labs/flux-dev',
      modelIdentifier: 'black-forest-labs/flux-dev',
      displayName: 'FLUX.1 [dev] (Replicate)',
      category: 'IMAGE',
      generationType: 'IMAGE',
      isFree: false,
      pricePerGeneration: 6,
      creditsPerGeneration: 6,
      pricingType: 'USAGE-BASED',
      supportsTextToImage: true,
      supportsImageToImage: true,
      supportsReferenceImage: true,
      supportsNegativePrompt: false,
      supportsSeed: true,
      outputType: 'image/webp',
      enabled: true,
      maxResolution: '1024x1024',
      description: 'Guidance-distilled 12B model providing deep artistic nuance, accurate lighting, and reference image guidance.',
      howItWorks: 'Employs 28 diffusion inference steps with guidance distillation to deliver rich aesthetic depth and fine details.',
      bestFor: 'Artistic illustrations, character design, reference-guided styling, and complex compositions.',
      strengths: [
        'Superb aesthetic depth and visual complexity',
        'Supports reference image uploads and image guidance',
        'Consistent anatomical accuracy and textures'
      ],
      limitations: [
        'Non-commercial base model terms',
        'Moderate latency (7-12 seconds)'
      ],
      inputTypes: ['Text Prompt', 'Reference Image', 'Aspect Ratio', 'Seed'],
      outputTypes: ['Image (WebP / JPEG / PNG)'],
      supportedCapabilities: ['Text-to-Image', 'Image-to-Image', 'Reference Guided'],
      pricingReference: 'Replicate catalog: ~$0.025 per image (6 credits)',
      documentationUrl: 'https://replicate.com/black-forest-labs/flux-dev',
      requiresCredentials: 'REPLICATE_API_TOKEN',
      qualityScore: 9.5,
      speedScore: 'Moderate (7-12s)',
      costScore: '~$0.025 / gen',
      examples: [
        {
          title: 'Fantasy & Editorial Art',
          description: 'Rich artistic concept rendering with intricate textures.',
          samplePrompt: 'Mystical forest illuminated by bioluminescent flora, ancient mossy stone statue holding an emerald crystal, soft cinematic haze, hyper-detailed fantasy art.'
        }
      ],
      capabilities: {
        supportsTextToImage: true,
        supportsImageToImage: true,
        supportsNegativePrompt: false,
        supportsSeed: true,
        maxResolution: '1024x1024',
      },
      supportedInputs: {
        aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:2'],
        outputFormats: ['webp', 'jpg', 'png'],
        supportsReferenceImage: true,
        supportsNegativePrompt: false,
      },
    },
    {
      provider: 'replicate',
      name: 'stability-ai/sdxl',
      modelIdentifier: 'stability-ai/sdxl',
      displayName: 'SDXL 1.0 (Replicate)',
      category: 'IMAGE',
      generationType: 'IMAGE',
      isFree: false,
      pricePerGeneration: 5,
      creditsPerGeneration: 5,
      pricingType: 'USAGE-BASED',
      supportsTextToImage: true,
      supportsImageToImage: true,
      supportsReferenceImage: true,
      supportsNegativePrompt: true,
      supportsSeed: true,
      outputType: 'image/png',
      enabled: true,
      maxResolution: '1024x1024',
      description: 'Stability AI flagship open foundation model with dual text encoders and full negative prompt support.',
      howItWorks: 'Pairs a 3.5B base latent diffusion model with a refiner stage and dual OpenCLIP text encoders.',
      bestFor: 'Fine-tuned stylized art, negative prompt exclusion, and reference-guided transformations.',
      strengths: [
        'Full negative prompt capability',
        'Versatile across dozens of artistic styles',
        'Extremely economical generation cost'
      ],
      limitations: [
        'Lower text spelling accuracy compared to FLUX',
        'Requires prompt craftsmanship for photorealism'
      ],
      inputTypes: ['Text Prompt', 'Negative Prompt', 'Reference Image', 'Aspect Ratio'],
      outputTypes: ['Image (PNG / JPEG / WebP)'],
      supportedCapabilities: ['Text-to-Image', 'Image-to-Image', 'Negative Prompting'],
      pricingReference: 'Replicate catalog: ~$0.002 per image (5 credits)',
      documentationUrl: 'https://replicate.com/stability-ai/sdxl',
      requiresCredentials: 'REPLICATE_API_TOKEN',
      qualityScore: 8.8,
      speedScore: 'Fast (3-6s)',
      costScore: '~$0.002 / gen',
      examples: [
        {
          title: 'Cinematic Portrait',
          description: 'Dramatic lighting portrait with unwanted artifacts filtered via negative prompts.',
          samplePrompt: 'Cyberpunk cybernetic detective standing under neon umbrella in rainy Neo-Tokyo street, cinematic volumetric lights, sharp focus.'
        }
      ],
      capabilities: {
        supportsTextToImage: true,
        supportsImageToImage: true,
        supportsNegativePrompt: true,
        supportsSeed: true,
        maxResolution: '1024x1024',
      },
      supportedInputs: {
        aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:2'],
        outputFormats: ['png', 'jpg', 'webp'],
        supportsReferenceImage: true,
        supportsNegativePrompt: true,
      },
    },
    {
      provider: 'replicate',
      name: 'openai/dall-e-3',
      modelIdentifier: 'openai/dall-e-3',
      displayName: 'ChatGPT Image (DALL-E 3)',
      category: 'IMAGE',
      generationType: 'IMAGE',
      isFree: false,
      pricePerGeneration: 10,
      creditsPerGeneration: 10,
      pricingType: 'USAGE-BASED',
      supportsTextToImage: true,
      supportsImageToImage: false,
      supportsReferenceImage: false,
      supportsNegativePrompt: false,
      supportsSeed: false,
      outputType: 'image/png',
      enabled: true,
      maxResolution: '1024x1024',
      description: "OpenAI's ChatGPT image generation model powered by DALL-E 3, hosted on Replicate cloud API for unified image synthesis.",
      howItWorks: 'Directly interprets ChatGPT conversational natural language prompts, expanding user concepts into rich descriptive visual scenes before executing high-fidelity 1024x1024 diffusion synthesis.',
      bestFor: 'Marketing graphics, concept artwork, social creatives, illustrative designs, and scenes with precise prompt adherence.',
      strengths: [
        'Nuanced English prompt adherence',
        'Cohesive artistic compositions',
        'Rich color grading and studio lighting',
        'Replicate unified API execution'
      ],
      limitations: [
        'Does not support starting reference images',
        'Fixed standard resolutions (1024x1024, 1024x1792, 1792x1024)',
        'Negative prompt parameters not supported'
      ],
      inputTypes: ['Text Prompt', 'Aspect Ratio'],
      outputTypes: ['Image (PNG / JPEG)'],
      supportedCapabilities: ['Text-to-Image', 'Prompt Fidelity', 'Editorial Creative'],
      pricingReference: 'Replicate catalog: ~$0.04 - $0.08 per generation (10 credits)',
      documentationUrl: 'https://replicate.com/openai/dall-e-3',
      requiresCredentials: 'REPLICATE_API_TOKEN',
      qualityScore: 9.5,
      speedScore: 'Moderate (8-14s)',
      costScore: '~$0.04 - $0.08 / gen',
      examples: [
        {
          title: 'Editorial Creative',
          description: 'Conceptual illustration suited for modern articles and social campaigns.',
          samplePrompt: 'An isometric glass terrarium floating in outer space containing a lush miniature Japanese garden with glowing lanterns, starry cosmos background, digital art 3D render.'
        },
        {
          title: 'Metaphorical Branding',
          description: 'High-concept visuals tailored for brand storytelling.',
          samplePrompt: 'A surreal floating island with a coffee cup carved out of marble rock, surrounded by floating coffee beans and gentle morning clouds, pastel lighting, minimalist 3D.'
        }
      ],
      capabilities: {
        supportsTextToImage: true,
        supportsImageToImage: false,
        supportsNegativePrompt: false,
        supportsSeed: false,
        maxResolution: '1024x1024',
      },
      supportedInputs: {
        aspectRatios: ['1:1', '16:9', '9:16'],
        outputFormats: ['png', 'jpg'],
        supportsReferenceImage: false,
        supportsNegativePrompt: false,
      },
    },
    {
      provider: 'replicate',
      name: 'google/imagen-3',
      modelIdentifier: 'google/imagen-3',
      displayName: 'Google Gemini Imagen 3 (Replicate)',
      category: 'IMAGE',
      generationType: 'IMAGE',
      isFree: false,
      pricePerGeneration: 8,
      creditsPerGeneration: 8,
      pricingType: 'USAGE-BASED',
      supportsTextToImage: true,
      supportsImageToImage: false,
      supportsReferenceImage: false,
      supportsNegativePrompt: false,
      supportsSeed: false,
      outputType: 'image/jpeg',
      enabled: true,
      maxResolution: '1024x1024',
      description: "Google DeepMind's flagship image generation model hosted on Replicate, delivering industry-leading photorealism, authentic lighting, and fine in-image text spelling.",
      howItWorks: 'Directly executes Google DeepMind Imagen 3 diffusion transformers on Replicate cloud infrastructure from natural language prompts.',
      bestFor: 'Hyper-realistic photography, travel scenery, advertising layouts with typography, and high-end commercial mockups.',
      strengths: [
        'Exceptional photorealism and natural lighting',
        'Accurate typography and sign spelling',
        'Rich textures across glass, water, skin, and fabric',
        'Direct Replicate API execution with no Google AI Studio key required'
      ],
      limitations: [
        'Negative prompt inputs not accepted',
        'Text-to-image only; does not accept reference input images'
      ],
      inputTypes: ['Text Prompt', 'Aspect Ratio'],
      outputTypes: ['Image (JPEG)'],
      supportedCapabilities: ['Text-to-Image', 'Photorealism', 'Typography', 'DeepMind Fidelity'],
      pricingReference: 'Replicate catalog: ~$0.04 per image (8 credits)',
      documentationUrl: 'https://replicate.com/google/imagen-3',
      requiresCredentials: 'REPLICATE_API_TOKEN',
      qualityScore: 9.8,
      speedScore: 'Fast (4-7s)',
      costScore: '~$0.04 / gen',
      examples: [
        {
          title: 'Photorealistic Nature & Travel',
          description: 'Authentic lighting, atmospheric mist, and natural scenery.',
          samplePrompt: 'A cozy wooden cabin tucked beside a turquoise alpine lake in the Swiss Alps, early autumn golden larch trees, morning mist rising from the water, photorealistic 8k.'
        },
        {
          title: 'Commercial Typography Staging',
          description: 'Accurately renders readable words on signs and packaging.',
          samplePrompt: 'A rustic coffee shop storefront in Brooklyn with a chalkboard sign reading "Fresh Cold Brew Today", warm morning sunlight hitting the brick facade.'
        }
      ],
      capabilities: {
        supportsTextToImage: true,
        supportsImageToImage: false,
        supportsNegativePrompt: false,
        supportsSeed: false,
        maxResolution: '1024x1024',
      },
      supportedInputs: {
        aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
        outputFormats: ['jpg', 'png', 'webp'],
        supportsReferenceImage: false,
        supportsNegativePrompt: false,
      },
    },
    {
      provider: 'replicate',
      name: 'google/imagen-3-fast',
      modelIdentifier: 'google/imagen-3-fast',
      displayName: 'Google Gemini Imagen 3 Fast (Replicate)',
      category: 'IMAGE',
      generationType: 'IMAGE',
      isFree: false,
      pricePerGeneration: 4,
      creditsPerGeneration: 4,
      pricingType: 'USAGE-BASED',
      supportsTextToImage: true,
      supportsImageToImage: false,
      supportsReferenceImage: false,
      supportsNegativePrompt: false,
      supportsSeed: false,
      outputType: 'image/jpeg',
      enabled: true,
      maxResolution: '1024x1024',
      description: "High-speed distilled variant of Google DeepMind's Imagen 3 hosted on Replicate, optimized for rapid ideation and vibrant creative concepts.",
      howItWorks: 'Distilled diffusion architecture on Replicate GPU clusters achieving 2-4 second inference speeds while preserving vivid compositions.',
      bestFor: 'Rapid social media posts, quick concept iteration, digital mockups, and high-frequency visual brainstorming.',
      strengths: [
        'Fast turnaround (2-4 seconds)',
        'Low credit consumption',
        'Vibrant color reproduction',
        'Direct Replicate API execution'
      ],
      limitations: [
        'Slightly lower micro-detail than standard Imagen 3',
        'No negative prompt support'
      ],
      inputTypes: ['Text Prompt', 'Aspect Ratio'],
      outputTypes: ['Image (JPEG)'],
      supportedCapabilities: ['Text-to-Image', 'High Speed (2-4s)', 'Economical'],
      pricingReference: 'Replicate catalog: ~$0.02 per image (4 credits)',
      documentationUrl: 'https://replicate.com/google/imagen-3-fast',
      requiresCredentials: 'REPLICATE_API_TOKEN',
      qualityScore: 9.3,
      speedScore: 'Fast (2-4s)',
      costScore: '~$0.02 / gen',
      examples: [
        {
          title: 'Social Media Action Concept',
          description: 'High-energy visuals tailored for social platforms.',
          samplePrompt: 'A futuristic electric sports car speeding through a glowing neon Tokyo tunnel at night, light trails, high-octane motion blur, 4k.'
        }
      ],
      capabilities: {
        supportsTextToImage: true,
        supportsImageToImage: false,
        supportsNegativePrompt: false,
        supportsSeed: false,
        maxResolution: '1024x1024',
      },
      supportedInputs: {
        aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
        outputFormats: ['jpg', 'png', 'webp'],
        supportsReferenceImage: false,
        supportsNegativePrompt: false,
      },
    },
    {
      provider: 'replicate',
      name: 'timothybrooks/instruct-pix2pix',
      modelIdentifier: 'timothybrooks/instruct-pix2pix',
      displayName: 'InstructPix2Pix (Replicate)',
      category: 'IMAGE',
      generationType: 'IMAGE',
      isFree: false,
      pricePerGeneration: 5,
      creditsPerGeneration: 5,
      pricingType: 'USAGE-BASED',
      supportsTextToImage: false,
      supportsImageToImage: true,
      supportsReferenceImage: true,
      supportsNegativePrompt: true,
      supportsSeed: true,
      outputType: 'image/png',
      enabled: true,
      maxResolution: '1024x1024',
      description: 'Instruction-guided image editing model that modifies input reference images according to plain text instructions.',
      howItWorks: 'Combines GPT-3 instruction knowledge with conditional diffusion to perform fast forward-pass image modifications.',
      bestFor: 'Targeted image editing, seasonal style adjustments, lighting changes, and object additions/substitutions.',
      strengths: [
        'Edits existing images with natural language instructions',
        'Preserves composition, pose, and background context',
        'Fast forward inference (2-4 seconds)',
        'Supports reference image uploads'
      ],
      limitations: [
        'Requires an input reference image',
        'Very subtle edits may require adjusting guidance parameters'
      ],
      inputTypes: ['Reference Image (Required)', 'Instruction Prompt', 'Image Guidance Scale'],
      outputTypes: ['Image (PNG / JPEG)'],
      supportedCapabilities: ['Image-to-Image', 'Instruction Editing', 'Context Preservation'],
      pricingReference: 'Replicate catalog: ~$0.005 per edit (5 credits)',
      documentationUrl: 'https://replicate.com/timothybrooks/instruct-pix2pix',
      requiresCredentials: 'REPLICATE_API_TOKEN',
      qualityScore: 9.2,
      speedScore: 'Fast (2-4s)',
      costScore: '~$0.005 / gen',
      examples: [
        {
          title: 'Seasonal Adjustment',
          description: 'Transforms image atmosphere with natural language.',
          samplePrompt: 'Make it a snowy winter morning with frost on the trees.'
        },
        {
          title: 'Style Transformation',
          description: 'Converts photo into artistic mediums.',
          samplePrompt: 'Turn this portrait into a dramatic oil painting with expressive brushstrokes.'
        }
      ],
      capabilities: {
        supportsTextToImage: false,
        supportsImageToImage: true,
        supportsNegativePrompt: true,
        supportsSeed: true,
        maxResolution: '1024x1024',
      },
      supportedInputs: {
        aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:2'],
        outputFormats: ['png', 'jpg'],
        supportsReferenceImage: true,
        supportsNegativePrompt: true,
      },
    },
    {
      provider: 'replicate',
      name: 'nightmareai/real-esrgan',
      modelIdentifier: 'nightmareai/real-esrgan',
      displayName: 'Real-ESRGAN Upscaler (Replicate)',
      category: 'IMAGE',
      generationType: 'IMAGE',
      isFree: false,
      pricePerGeneration: 4,
      creditsPerGeneration: 4,
      pricingType: 'USAGE-BASED',
      supportsTextToImage: false,
      supportsImageToImage: true,
      supportsReferenceImage: true,
      supportsNegativePrompt: false,
      supportsSeed: false,
      outputType: 'image/png',
      enabled: true,
      maxResolution: '4096x4096',
      description: 'AI-powered super-resolution image upscaling and facial restoration model using Real-ESRGAN and GFPGAN.',
      howItWorks: 'Employs deep residual networks to synthesize realistic micro-textures while recovering compression artifacts.',
      bestFor: 'Upscaling low-resolution assets, enhancing marketing photos, and restoring facial details.',
      strengths: [
        'Up to 4x resolution enhancement',
        'Automatic GFPGAN facial restoration',
        'Removes JPEG noise and blur artifacts'
      ],
      limitations: [
        'Requires an input image to upscale',
        'Not a prompt-based text-to-image generator'
      ],
      inputTypes: ['Reference Image (Required)', 'Upscale Factor (Scale)', 'Face Enhancement'],
      outputTypes: ['Image (PNG / JPEG)'],
      supportedCapabilities: ['Image-to-Image', 'Super Resolution', 'Face Restoration', '4K Upscaling'],
      pricingReference: 'Replicate catalog: ~$0.003 per run (4 credits)',
      documentationUrl: 'https://replicate.com/nightmareai/real-esrgan',
      requiresCredentials: 'REPLICATE_API_TOKEN',
      qualityScore: 9.4,
      speedScore: 'Fast (2-4s)',
      costScore: '~$0.003 / gen',
      examples: [
        {
          title: 'Product Photo Super-Resolution',
          description: 'Restores crisp sharpness and fine textures for high-res e-commerce displays.',
          samplePrompt: 'Upscale product photography to 4x resolution with texture recovery.'
        }
      ],
      capabilities: {
        supportsTextToImage: false,
        supportsImageToImage: true,
        supportsNegativePrompt: false,
        supportsSeed: false,
        maxResolution: '4096x4096',
      },
      supportedInputs: {
        aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:2'],
        outputFormats: ['png', 'jpg'],
        supportsReferenceImage: true,
        supportsNegativePrompt: false,
      },
    },
    {
      provider: 'replicate',
      name: 'cjwbw/rembg',
      modelIdentifier: 'cjwbw/rembg',
      displayName: 'Rembg Background Remover (Replicate)',
      category: 'IMAGE',
      generationType: 'IMAGE',
      isFree: false,
      pricePerGeneration: 3,
      creditsPerGeneration: 3,
      pricingType: 'USAGE-BASED',
      supportsTextToImage: false,
      supportsImageToImage: true,
      supportsReferenceImage: true,
      supportsNegativePrompt: false,
      supportsSeed: false,
      outputType: 'image/png',
      enabled: true,
      maxResolution: '2048x2048',
      description: 'High-speed automated background removal and alpha matting model for product staging and marketing creatives.',
      howItWorks: 'Uses deep U-Net salient object detection to isolate foreground subjects and output clean transparent PNGs.',
      bestFor: 'E-commerce product cutouts, headshots, and transparent graphics composition.',
      strengths: [
        'Instant background removal (1-3s)',
        'Accurate edge and hair matting',
        'Outputs transparent PNG alpha channel'
      ],
      limitations: [
        'Requires an input image',
        'Does not generate new background scenery'
      ],
      inputTypes: ['Reference Image (Required)'],
      outputTypes: ['Image (Transparent PNG)'],
      supportedCapabilities: ['Image-to-Image', 'Background Removal', 'Alpha Transparency', 'Fast Inference'],
      pricingReference: 'Replicate catalog: ~$0.002 per run (3 credits)',
      documentationUrl: 'https://replicate.com/cjwbw/rembg',
      requiresCredentials: 'REPLICATE_API_TOKEN',
      qualityScore: 9.3,
      speedScore: 'Instant (1-2s)',
      costScore: '~$0.002 / gen',
      examples: [
        {
          title: 'E-Commerce Product Cutout',
          description: 'Isolates product subject with transparent background for multi-channel advertising.',
          samplePrompt: 'Remove background from product photo to produce transparent PNG.'
        }
      ],
      capabilities: {
        supportsTextToImage: false,
        supportsImageToImage: true,
        supportsNegativePrompt: false,
        supportsSeed: false,
        maxResolution: '2048x2048',
      },
      supportedInputs: {
        aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:2'],
        outputFormats: ['png'],
        supportsReferenceImage: true,
        supportsNegativePrompt: false,
      },
    },
  ],
  video: [
    {
      provider: 'replicate',
      name: 'kwaivgi/kling-v1.6-standard',
      modelIdentifier: 'kwaivgi/kling-v1.6-standard',
      displayName: 'Kling v1.6 Standard (Replicate)',
      category: 'VIDEO',
      generationType: 'VIDEO',
      isFree: false,
      pricePerGeneration: 30,
      creditsPerGeneration: 30,
      pricingType: 'USAGE-BASED',
      supportsTextToVideo: true,
      supportsImageToVideo: true,
      supportsReferenceImage: true,
      outputType: 'video/mp4',
      enabled: true,
      maxResolution: '1080p',
      maxDuration: 10,
      description: 'Kuaishou Kling v1.6 foundation model delivering cinematic 1080p motion, physical simulation, and camera dynamics.',
      howItWorks: 'Uses large-scale 3D spatio-temporal attention diffusion to model physical interactions, lighting, and camera paths.',
      bestFor: 'Cinematic b-roll, dynamic social reels, commercial product teasers, and animating still photography.',
      strengths: [
        'Crisp 1080p full HD rendering',
        'Fluid physical motion and natural human kinetics',
        'Strong camera panning, tilt, and zoom movements',
        'Supports both text prompts and starting reference images'
      ],
      limitations: [
        'Generation takes 60-120 seconds in asynchronous queue',
        'Higher credit cost per generation'
      ],
      inputTypes: ['Text Prompt', 'Reference Image (Optional)', 'Aspect Ratio', 'Duration'],
      outputTypes: ['Video (MP4, 1080p)'],
      supportedCapabilities: ['Text-to-Video', 'Image-to-Video', '1080p Full HD', 'Cinematic Motion'],
      pricingReference: 'Replicate catalog: ~$0.10 - $0.20 per video (30 credits)',
      documentationUrl: 'https://replicate.com/kwaivgi/kling-v1.6-standard',
      requiresCredentials: 'REPLICATE_API_TOKEN',
      qualityScore: 9.6,
      speedScore: 'Queued (60-120s)',
      costScore: '~$0.10 / gen',
      examples: [
        {
          title: 'Cinematic Drone Shot',
          description: 'Sweeping aerial camera flight through dramatic landscapes.',
          samplePrompt: 'Cinematic drone shot flying over majestic Nordic fjords at sunset, misty mountain peaks reflected in dark glass water, cinematic film grain, 4k.'
        },
        {
          title: 'Product Animation',
          description: 'Brings still e-commerce product photos to life with dynamic camera rotation.',
          samplePrompt: 'Close-up slow motion rotation of a luxury chronograph watch with sparkling reflections on sapphire crystal glass, studio lighting.'
        }
      ],
      capabilities: {
        supportsTextToVideo: true,
        supportsImageToVideo: true,
        maxResolution: '1080p',
        maxDuration: 10,
      },
      supportedInputs: {
        aspectRatios: ['16:9', '9:16', '1:1'],
        resolutions: ['720p', '1080p'],
        durations: [5, 10],
        supportsReferenceImage: true,
      },
    },
    {
      provider: 'replicate',
      name: 'wan-video/wan-2.1-t2v-480p',
      modelIdentifier: 'wan-video/wan-2.1-t2v-480p',
      displayName: 'Wan 2.1 T2V (Replicate)',
      category: 'VIDEO',
      generationType: 'VIDEO',
      isFree: false,
      pricePerGeneration: 20,
      creditsPerGeneration: 20,
      pricingType: 'USAGE-BASED',
      supportsTextToVideo: true,
      supportsImageToVideo: false,
      supportsReferenceImage: false,
      outputType: 'video/mp4',
      enabled: true,
      maxResolution: '480p',
      maxDuration: 5,
      description: 'Alibaba 14B parameter open diffusion transformer model tailored for prompt-faithful short social media clips.',
      howItWorks: 'Utilizes a 3D causal VAE architecture with flow matching to generate temporally cohesive video clips from text.',
      bestFor: 'Instagram reels, TikTok intros, rapid motion prototyping, and animated content backdrops.',
      strengths: [
        'High motion coherence without visual jitter',
        'Faithful translation of complex text instructions',
        'Economical video compute usage'
      ],
      limitations: [
        'Standard tier outputs 480p resolution',
        'Does not accept starting reference images on this endpoint'
      ],
      inputTypes: ['Text Prompt', 'Aspect Ratio', 'Duration'],
      outputTypes: ['Video (MP4)'],
      supportedCapabilities: ['Text-to-Video', 'Flow Matching', 'Social Clips'],
      pricingReference: 'Replicate catalog: ~$0.05 per video (20 credits)',
      documentationUrl: 'https://replicate.com/wan-video/wan-2.1-t2v-480p',
      requiresCredentials: 'REPLICATE_API_TOKEN',
      qualityScore: 9.0,
      speedScore: 'Queued (45-90s)',
      costScore: '~$0.05 / gen',
      examples: [
        {
          title: 'Social Media Loop',
          description: 'High-energy motion clip for social media feeds.',
          samplePrompt: 'Neon colored sneakers splashing into puddles in slow motion on city pavement at night, vibrant water droplets, dynamic street perspective.'
        }
      ],
      capabilities: {
        supportsTextToVideo: true,
        supportsImageToVideo: false,
        maxResolution: '480p',
        maxDuration: 5,
      },
      supportedInputs: {
        aspectRatios: ['16:9', '9:16', '1:1'],
        resolutions: ['480p'],
        durations: [5],
        supportsReferenceImage: false,
      },
    },
    {
      provider: 'replicate',
      name: 'minimax/video-01',
      modelIdentifier: 'minimax/video-01',
      displayName: 'MiniMax Video-01 (Replicate)',
      category: 'VIDEO',
      generationType: 'VIDEO',
      isFree: false,
      pricePerGeneration: 25,
      creditsPerGeneration: 25,
      pricingType: 'USAGE-BASED',
      supportsTextToVideo: true,
      supportsImageToVideo: true,
      supportsReferenceImage: true,
      outputType: 'video/mp4',
      enabled: true,
      maxResolution: '720p',
      maxDuration: 6,
      description: 'Hailuo AI flagship video model renowned for dynamic character motion, complex physics, and vivid cinematic atmospheres.',
      howItWorks: 'Direct spatio-temporal neural network trained on millions of high-definition motion video sequences.',
      bestFor: 'Action clips, character performance, stylized b-roll, and bringing conceptual imagery into dynamic motion.',
      strengths: [
        'Natural character anatomy and movement dynamics',
        'Vivid color fidelity and atmospheric smoke/weather effects',
        'Reliable image-to-video motion synthesis'
      ],
      limitations: [
        'Fixed 6-second clip duration',
        'Asynchronous queue processing'
      ],
      inputTypes: ['Text Prompt', 'Reference Image (Optional)', 'Aspect Ratio'],
      outputTypes: ['Video (MP4, 720p)'],
      supportedCapabilities: ['Text-to-Video', 'Image-to-Video', 'Character Motion', 'High Dynamics'],
      pricingReference: 'Replicate catalog: ~$0.08 per video (25 credits)',
      documentationUrl: 'https://replicate.com/minimax/video-01',
      requiresCredentials: 'REPLICATE_API_TOKEN',
      qualityScore: 9.3,
      speedScore: 'Queued (60-100s)',
      costScore: '~$0.08 / gen',
      examples: [
        {
          title: 'Character Action Clip',
          description: 'Dramatic motion sequence with natural character physics.',
          samplePrompt: 'A futuristic astronaut walking through a swirling crimson sandstorm on Mars, dust particles sweeping across the helmet visor, cinematic lighting.'
        }
      ],
      capabilities: {
        supportsTextToVideo: true,
        supportsImageToVideo: true,
        maxResolution: '720p',
        maxDuration: 6,
      },
      supportedInputs: {
        aspectRatios: ['16:9', '9:16', '1:1'],
        resolutions: ['720p'],
        durations: [6],
        supportsReferenceImage: true,
      },
    },
  ],
};
