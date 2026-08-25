import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [DatabaseModule, WebsocketModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
