import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PromptsService } from './prompts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsString, IsOptional } from 'class-validator';

class EnhancePromptDto {
  @IsString() prompt: string;
  @IsString() @IsOptional() category?: string;
}

@ApiTags('prompts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/prompts')
export class PromptsController {
  constructor(private promptsService: PromptsService) {}

  @Post('enhance')
  enhance(@CurrentUser() user: any, @Body() dto: EnhancePromptDto) {
    return this.promptsService.enhance(user.id, dto.prompt, dto.category);
  }

  @Get('history')
  getHistory(@CurrentUser() user: any, @Query('limit') limit = 20) {
    return this.promptsService.getHistory(user.id, +limit);
  }
}
