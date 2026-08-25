import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(userId, dto);
  }

  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.projectsService.findAll(userId);
  }

  @Get(':id')
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.projectsService.findOne(userId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(userId, id, dto);
  }

  @Delete(':id')
  async delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.projectsService.delete(userId, id);
  }
}
