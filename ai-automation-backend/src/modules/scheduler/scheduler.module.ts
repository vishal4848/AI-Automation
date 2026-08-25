import { Module, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';
import { InstagramPublishProcessor } from './processors/instagram-publish.processor';
import { InstagramPublisher } from './publishers/instagram.publisher';
import { FacebookPublisher } from './publishers/facebook.publisher';
import { LinkedInPublisher } from './publishers/linkedin.publisher';

const logger = new Logger('SchedulerModule');

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: new URL(config.get<string>('redis.url') || 'redis://localhost:6379').hostname || 'localhost',
          port: parseInt(new URL(config.get<string>('redis.url') || 'redis://localhost:6379').port || '6379', 10),
          maxRetriesPerRequest: null,
          enableOfflineQueue: false,
          retryStrategy: (times: number) => {
            if (times > 3) {
              logger.warn('⚠️  Redis not available — scheduler queue disabled.');
              return null;
            }
            return Math.min(times * 500, 2000);
          },
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'instagram-publish',
    }),
  ],
  controllers: [SchedulerController],
  providers: [
    SchedulerService,
    InstagramPublishProcessor,
    InstagramPublisher,
    FacebookPublisher,
    LinkedInPublisher,
  ],
  exports: [SchedulerService],
})
export class SchedulerModule {}
