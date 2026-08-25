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
  async create(@CurrentUser() user: any, @Body() dto: CreateProjectDto) {
    const userId = typeof user === 'string' ? user : user?.id;
    return this.projectsService.create(userId, dto);
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    const userId = typeof user === 'string' ? user : user?.id;
    return this.projectsService.findAll(userId);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const userId = typeof user === 'string' ? user : user?.id;
    return this.projectsService.findOne(userId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    const userId = typeof user === 'string' ? user : user?.id;
    return this.projectsService.update(userId, id, dto);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    const userId = typeof user === 'string' ? user : user?.id;
    return this.projectsService.delete(userId, id);
  }
}
