import { Controller, Post, Get, Delete, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ImagesService } from './images.service';
import { GenerateImageDto } from './dto/generate-image.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('images')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/images')
export class ImagesController {
  constructor(private imagesService: ImagesService) {}

  @Post('generate')
  generate(@CurrentUser() user: any, @Body() dto: GenerateImageDto) {
    return this.imagesService.generate(user.id, dto);
  }

  @Get()
  getImages(
    @CurrentUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('projectId') projectId?: string,
  ) {
    const userId = typeof user === 'string' ? user : user?.id;
    return this.imagesService.getImages(userId, +page, +limit, projectId);
  }

  @Delete(':id')
  deleteImage(@CurrentUser() user: any, @Param('id') id: string) {
    const userId = typeof user === 'string' ? user : user?.id;
    return this.imagesService.deleteImage(userId, id);
  }

  @Patch(':id/favorite')
  toggleFavorite(@CurrentUser() user: any, @Param('id') id: string) {
    return this.imagesService.toggleFavorite(user.id, id);
  }
}
