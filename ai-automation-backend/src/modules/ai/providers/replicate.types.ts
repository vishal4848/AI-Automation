export interface ReplicateImageInput {
  prompt: string;
  negative_prompt?: string;
  aspect_ratio?: string;
  output_format?: string;
  image?: string;
  image_prompt?: string;
  [key: string]: any;
}

export interface ReplicateVideoInput {
  prompt: string;
  image?: string;
  start_image?: string;
  first_frame_image?: string;
  duration?: number;
  aspect_ratio?: string;
  resolution?: string;
  prompt_optimizer?: boolean;
  [key: string]: any;
}

export const REPLICATE_ERRORS = {
  NOT_CONFIGURED: 'REPLICATE_NOT_CONFIGURED',
  AUTH_FAILED: 'REPLICATE_AUTH_FAILED',
  PAYMENT_REQUIRED: 'REPLICATE_PAYMENT_REQUIRED',
  MODEL_NOT_FOUND: 'REPLICATE_MODEL_NOT_FOUND',
  MODEL_UNAVAILABLE: 'REPLICATE_MODEL_UNAVAILABLE',
  INVALID_INPUT: 'REPLICATE_INVALID_INPUT',
  GENERATION_FAILED: 'REPLICATE_GENERATION_FAILED',
  TIMEOUT: 'REPLICATE_TIMEOUT',
  RATE_LIMITED: 'REPLICATE_RATE_LIMITED',
} as const;

export type ReplicateErrorCode = (typeof REPLICATE_ERRORS)[keyof typeof REPLICATE_ERRORS];
