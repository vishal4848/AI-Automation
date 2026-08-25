import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('overview')
  getOverview(@CurrentUser() user: any, @Query('period') period: string = '7d') {
    return this.analyticsService.getOverview(user.id, period);
  }

  @Get('usage')
  getUsageChart(@CurrentUser() user: any, @Query('period') period: string = '7d') {
    return this.analyticsService.getUsageChart(user.id, period);
  }

  @Get('recent-generations')
  getRecentGenerations(@CurrentUser() user: any) {
    return this.analyticsService.getRecentGenerations(user.id);
  }
}
