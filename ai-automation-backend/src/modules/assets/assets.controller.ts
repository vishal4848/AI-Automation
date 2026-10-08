import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as os from 'os';
import * as path from 'path';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AssetsService } from './assets.service';
import { UploadAssetDto } from './dto/upload-asset.dto';

@Controller('api/v1/assets')
@UseGuards(JwtAuthGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: os.tmpdir(),
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        },
      }),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max
      },
    }),
  )
  async uploadAsset(
    @CurrentUser() user: any,
    @UploadedFile() file: any,
    @Body() dto: UploadAssetDto,
  ) {
    const userId = typeof user === 'string' ? user : user?.id;
    if (!file) {
      throw new BadRequestException('UPLOAD_FAILED: No file uploaded.');
    }
    return this.assetsService.upload(userId, file, dto);
  }

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('resourceType') resourceType?: string,
    @Query('projectId') projectId?: string,
  ) {
    const userId = typeof user === 'string' ? user : user?.id;
    return this.assetsService.findAll(userId, {
      page: +page,
      limit: +limit,
      resourceType,
      projectId,
    });
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const userId = typeof user === 'string' ? user : user?.id;
    return this.assetsService.findOne(userId, id);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    const userId = typeof user === 'string' ? user : user?.id;
    return this.assetsService.delete(userId, id);
  }
}
