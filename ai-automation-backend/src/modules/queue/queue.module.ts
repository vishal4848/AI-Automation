import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Global, Logger, Module } from '@nestjs/common';

export const QUEUE_NAMES = {
  IMAGE: 'image-generation',
  VIDEO: 'video-generation',
  UPLOAD: 'media-upload',
  NOTIFICATION: 'notification',
  ANALYTICS: 'analytics',
  CLEANUP: 'cleanup',
  SCHEDULER: 'scheduler',
  WEBHOOK: 'webhook',
  RETRY: 'retry',
} as const;

const logger = new Logger('QueueModule');

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: new URL(config.get<string>('redis.url') || 'redis://localhost:6379').hostname || 'localhost',
          port: parseInt(new URL(config.get<string>('redis.url') || 'redis://localhost:6379').port || '6379', 10),
          maxRetriesPerRequest: 3,
          enableOfflineQueue: false,
          retryStrategy: (times: number) => {
            if (times > 3) {
              logger.warn('⚠️  Redis not available — queue features will be disabled. Install and start Redis to enable background jobs.');
              return null; // Stop retrying
            }
            return Math.min(times * 500, 2000);
          },
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.IMAGE },
      { name: QUEUE_NAMES.VIDEO },
      { name: QUEUE_NAMES.UPLOAD },
      { name: QUEUE_NAMES.NOTIFICATION },
      { name: QUEUE_NAMES.ANALYTICS },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
