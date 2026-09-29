import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulerService } from './scheduler.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('scheduler')
@ApiBearerAuth()
@Controller('api/v1/scheduler')
@UseGuards(JwtAuthGuard)
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post(['posts', 'instagram', 'facebook', 'linkedin'])
  async createScheduledPost(
    @CurrentUser('id') userId: string,
    @Body()
    dto: {
      platform?: string;
      socialAccountId?: string;
      socialAccountIds?: string[];
      mediaUrl: string;
      mediaAssetId?: string;
      uploadedAssetId?: string;
      caption?: string;
      scheduledAtUTC?: string;
    },
  ) {
    const post = await this.schedulerService.createScheduledPost(userId, dto);
    return { success: true, data: post };
  }

  @Get(['posts', 'instagram', 'facebook', 'linkedin'])
  async getScheduledPosts(@CurrentUser('id') userId: string) {
    const posts = await this.schedulerService.getScheduledPosts(userId);
    return { success: true, data: posts };
  }

  @Get(['posts/:id', 'instagram/:id', 'facebook/:id', 'linkedin/:id'])
  async getPostById(
    @CurrentUser('id') userId: string,
    @Param('id') postId: string,
  ) {
    const post = await this.schedulerService.getPostById(userId, postId);
    return { success: true, data: post };
  }

  @Post(['posts/:id/publish', 'instagram/:id/publish', 'facebook/:id/publish', 'linkedin/:id/publish'])
  async publishNow(
    @CurrentUser('id') userId: string,
    @Param('id') postId: string,
  ) {
    const post = await this.schedulerService.publishNow(userId, postId);
    return { success: true, data: post };
  }

  @Post(['posts/:id/cancel', 'instagram/:id/cancel', 'facebook/:id/cancel', 'linkedin/:id/cancel'])
  async cancelScheduledPostPost(
    @CurrentUser('id') userId: string,
    @Param('id') postId: string,
  ) {
    const post = await this.schedulerService.cancelScheduledPost(userId, postId);
    return { success: true, data: post };
  }

  @Delete(['posts/:id', 'instagram/:id', 'facebook/:id', 'linkedin/:id'])
  async cancelScheduledPostDelete(
    @CurrentUser('id') userId: string,
    @Param('id') postId: string,
  ) {
    const post = await this.schedulerService.cancelScheduledPost(userId, postId);
    return { success: true, data: post };
  }
}
