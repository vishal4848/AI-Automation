import { Module } from '@nestjs/common';
import { ModelsController } from './models.controller';
import { ModelRegistryService } from './model-registry.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [ModelsController],
  providers: [ModelRegistryService, PrismaService],
  exports: [ModelRegistryService],
})
export class ModelsModule {}
