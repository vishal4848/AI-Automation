import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { configuration, validationSchema } from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { AIGatewayModule } from './modules/ai-gateway/ai-gateway.module';
import { ImagesModule } from './modules/images/images.module';
import { VideosModule } from './modules/videos/videos.module';
import { PromptsModule } from './modules/prompts/prompts.module';
import { StorageModule } from './modules/storage/storage.module';
import { QueueModule } from './modules/queue/queue.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ModelsModule } from './modules/models/models.module';
import { SocialModule } from './modules/social/social.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // ─── Global Config ───────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),

    // ─── Rate Limiting ────────────────────────────────────────────────
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // ─── Database ────────────────────────────────────────────────────
    DatabaseModule,

    // ─── Queue Infrastructure ────────────────────────────────────────
    QueueModule,

    // ─── Storage ─────────────────────────────────────────────────────
    StorageModule,

    // ─── AI Gateway + Providers ──────────────────────────────────────
    AIGatewayModule,

    // ─── Model Registry ──────────────────────────────────────────────
    ModelsModule,

    // ─── Auth ────────────────────────────────────────────────────────
    AuthModule,

    // ─── Feature Modules ─────────────────────────────────────────────
    ImagesModule,
    VideosModule,
    PromptsModule,

    // ─── Real-time ───────────────────────────────────────────────────
    WebsocketModule,

    // ─── Analytics ───────────────────────────────────────────────────
    AnalyticsModule,

    // ─── Social ──────────────────────────────────────────────────────
    SocialModule,

    // ─── Scheduler ───────────────────────────────────────────────────
    SchedulerModule,

    // ─── Projects & Workspace ─────────────────────────────────────────
    ProjectsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
