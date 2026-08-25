import { Controller, Post, Get, Delete, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { VideosService } from './videos.service';
import { GenerateVideoDto } from './dto/generate-video.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('videos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/videos')
export class VideosController {
  constructor(private videosService: VideosService) {}

  @Post('generate')
  generate(@CurrentUser() user: any, @Body() dto: GenerateVideoDto) {
    return this.videosService.generate(user.id, dto);
  }

  @Get()
  getVideos(@CurrentUser() user: any, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.videosService.getVideos(user.id, +page, +limit);
  }

  @Delete(':id')
  deleteVideo(@CurrentUser() user: any, @Param('id') id: string) {
    return this.videosService.deleteVideo(user.id, id);
  }

  @Patch(':id/favorite')
  toggleFavorite(@CurrentUser() user: any, @Param('id') id: string) {
    return this.videosService.toggleFavorite(user.id, id);
  }
}
