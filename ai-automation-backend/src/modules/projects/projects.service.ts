import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateProjectDto) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    const trimmedName = dto.name?.trim();
    if (!trimmedName) {
      throw new BadRequestException('Project name cannot be empty');
    }

    const project = await this.prisma.project.create({
      data: {
        userId,
        name: trimmedName,
        description: dto.description?.trim() || null,
        status: dto.status || 'active',
      },
    });

    this.logger.log(`Project created: "${project.name}" (ID: ${project.id}) for user ${userId}`);

    // Create live notification
    await this.notificationsService.create(userId, {
      type: 'PROJECT_CREATED',
      title: 'Project Created',
      message: `Project "${project.name}" created in workspace.`,
      data: { projectId: project.id },
    });

    return project;
  }

  async findAll(userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const projects = await this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return { projects, total: projects.length };
  }

  async findOne(userId: string, id: string) {
    if (!userId || !id) {
      throw new BadRequestException('User ID and Project ID are required');
    }

    const project = await this.prisma.project.findFirst({
      where: { id, userId },
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    return project;
  }

  async update(userId: string, id: string, dto: UpdateProjectDto) {
    const existing = await this.findOne(userId, id);

    const updated = await this.prisma.project.update({
      where: { id: existing.id },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        description: dto.description !== undefined ? dto.description.trim() : undefined,
        status: dto.status !== undefined ? dto.status : undefined,
      },
    });

    this.logger.log(`Project updated: "${updated.name}" (ID: ${updated.id})`);
    return updated;
  }

  async delete(userId: string, id: string) {
    const existing = await this.findOne(userId, id);

    await this.prisma.project.delete({
      where: { id: existing.id },
    });

    this.logger.log(`Project deleted: "${existing.name}" (ID: ${existing.id})`);
    return { success: true, message: 'Project deleted successfully', id: existing.id };
  }
}
