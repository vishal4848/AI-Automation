import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

class UpdateStatusDto {
  @IsBoolean()
  isActive: boolean;
}

class UpdateRoleDto {
  @IsEnum(Role)
  role: Role;
}

class AdjustCreditsDto {
  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  reason?: string;
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('api/v1/admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('overview')
  getOverview() {
    return this.adminService.getOverview();
  }

  @Get('users')
  getUsers(
    @Query('search') search?: string,
    @Query('role') role?: Role,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getUsers(
      search,
      role,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('users/:id')
  getUserDetails(@Param('id') id: string) {
    return this.adminService.getUserDetails(id);
  }

  @Patch('users/:id/status')
  updateUserStatus(
    @CurrentUser('id') adminId: string,
    @Param('id') targetId: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.adminService.updateUserStatus(adminId, targetId, dto.isActive);
  }

  @Patch('users/:id/role')
  updateUserRole(
    @CurrentUser('id') adminId: string,
    @Param('id') targetId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.adminService.updateUserRole(adminId, targetId, dto.role);
  }

  @Post('users/:id/credits')
  adjustUserCredits(
    @CurrentUser('id') adminId: string,
    @Param('id') targetId: string,
    @Body() dto: AdjustCreditsDto,
  ) {
    return this.adminService.adjustUserCredits(
      adminId,
      targetId,
      dto.amount,
      dto.reason || 'Admin credit adjustment',
    );
  }

  @Get('analytics')
  getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('audit-logs')
  getAuditLogs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getAuditLogs(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 25,
    );
  }
}
