import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';
import { ModelsModule } from '../models/models.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { VideoGenerationProcessor } from './processors/video-generation.processor';

@Module({
  imports: [
    ModelsModule,
    NotificationsModule,
    BullModule.registerQueue({
      name: 'video-generation',
    }),
  ],
  providers: [VideosService, VideoGenerationProcessor],
  controllers: [VideosController],
  exports: [VideosService],
})
export class VideosModule {}
