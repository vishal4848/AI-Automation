import { Module } from '@nestjs/common';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';
import { ModelsModule } from '../models/models.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ModelsModule, NotificationsModule],
  providers: [VideosService],
  controllers: [VideosController],
  exports: [VideosService],
})
export class VideosModule {}
