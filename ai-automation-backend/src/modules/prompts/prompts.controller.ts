import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PromptsService } from './prompts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsString, IsOptional, IsNumber } from 'class-validator';

class EnhancePromptDto {
  @IsString() prompt: string;
  @IsString() @IsOptional() category?: string;
}

class GenerateCaptionDto {
  @IsString() topic: string;
  @IsString() platform: string;
  @IsString() @IsOptional() tone?: string;
  @IsString() @IsOptional() length?: string;
}

class GenerateHashtagsDto {
  @IsString() topic: string;
  @IsString() @IsOptional() platform?: string;
  @IsNumber() @IsOptional() count?: number;
}

class CopilotDto {
  @IsString() message: string;
  @IsString() @IsOptional() context?: string;
  @IsOptional() history?: any[];
}

@ApiTags('prompts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/prompts')
export class PromptsController {
  constructor(private promptsService: PromptsService) {}

  @Post('enhance')
  enhance(@CurrentUser() user: any, @Body() dto: EnhancePromptDto) {
    const userId = typeof user === 'string' ? user : user?.id;
    return this.promptsService.enhance(userId, dto.prompt, dto.category);
  }

  @Get('history')
  getHistory(@CurrentUser() user: any, @Query('limit') limit = 20) {
    const userId = typeof user === 'string' ? user : user?.id;
    return this.promptsService.getHistory(userId, +limit);
  }

  @Post('caption')
  generateCaption(@CurrentUser() user: any, @Body() dto: GenerateCaptionDto) {
    const userId = typeof user === 'string' ? user : user?.id;
    return this.promptsService.generateCaptions(userId, dto.topic, dto.platform, dto.tone, dto.length);
  }

  @Post('hashtags')
  generateHashtags(@CurrentUser() user: any, @Body() dto: GenerateHashtagsDto) {
    const userId = typeof user === 'string' ? user : user?.id;
    return this.promptsService.generateHashtags(userId, dto.topic, dto.platform, dto.count);
  }

  @Post('copilot')
  copilot(@CurrentUser() user: any, @Body() dto: CopilotDto) {
    const userId = typeof user === 'string' ? user : user?.id;
    return this.promptsService.copilot(userId, dto.message, dto.context, dto.history);
  }
}
