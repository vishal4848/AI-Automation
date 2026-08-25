import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3001),
  DATABASE_URL: Joi.string().optional().allow('').default('postgresql://postgres:password@localhost:5432/ai_automation'),
  REDIS_URL: Joi.string().optional().allow('').default('redis://localhost:6379'),
  JWT_SECRET: Joi.string().optional().allow('').default('dev-secret-change-in-production-must-be-32-chars'),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_REFRESH_SECRET: Joi.string().optional().allow('').default('dev-refresh-secret-change-in-production'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
  CLOUDINARY_CLOUD_NAME: Joi.string().optional().allow('').default(''),
  CLOUDINARY_API_KEY: Joi.string().optional().allow('').default(''),
  CLOUDINARY_API_SECRET: Joi.string().optional().allow('').default(''),
  HUGGINGFACE_API_TOKEN: Joi.string().optional().allow('').default(''),
  OPENAI_API_KEY: Joi.string().optional().allow('').default(''),
  GOOGLE_AI_API_KEY: Joi.string().optional().allow('').default(''),
  REPLICATE_API_TOKEN: Joi.string().optional().allow('').default(''),
  FAL_KEY: Joi.string().optional().allow('').default(''),
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),
}).options({ allowUnknown: true });

export const configuration = () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: { url: process.env.DATABASE_URL },
  redis: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  ai: {
    huggingface: process.env.HUGGINGFACE_API_TOKEN || '',
    openai: process.env.OPENAI_API_KEY || '',
    google: process.env.GOOGLE_AI_API_KEY || '',
    replicate: process.env.REPLICATE_API_TOKEN || '',
    fal: process.env.FAL_KEY || '',
  },
  frontend: { url: process.env.FRONTEND_URL || 'http://localhost:3000' },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
});
