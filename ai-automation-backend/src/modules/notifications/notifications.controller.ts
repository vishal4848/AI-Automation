import { Controller, Get, Patch, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const userId = typeof user === 'string' ? user : user?.id;
    return this.notificationsService.findAll(userId, +page, +limit);
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: any) {
    const userId = typeof user === 'string' ? user : user?.id;
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  async markAsRead(@CurrentUser() user: any, @Param('id') id: string) {
    const userId = typeof user === 'string' ? user : user?.id;
    return this.notificationsService.markAsRead(userId, id);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    const userId = typeof user === 'string' ? user : user?.id;
    return this.notificationsService.delete(userId, id);
  }

  @Delete()
  async clearAll(@CurrentUser() user: any) {
    const userId = typeof user === 'string' ? user : user?.id;
    return this.notificationsService.clearAll(userId);
  }
}
