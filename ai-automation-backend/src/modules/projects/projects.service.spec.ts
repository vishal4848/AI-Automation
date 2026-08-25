import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../../database/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: PrismaService;

  const mockPrisma = {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a project for authenticated user', async () => {
      mockPrisma.project.create.mockResolvedValue({
        id: 'proj-1',
        userId: 'user-1',
        name: 'Brand Campaign',
        description: 'New launch assets',
        status: 'active',
        createdAt: new Date(),
      });

      const result = await service.create('user-1', {
        name: 'Brand Campaign',
        description: 'New launch assets',
      });

      expect(result.id).toBe('proj-1');
      expect(result.name).toBe('Brand Campaign');
      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          name: 'Brand Campaign',
          description: 'New launch assets',
          status: 'active',
        }),
      });
    });

    it('should reject creation with empty name', async () => {
      await expect(
        service.create('user-1', { name: '   ' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should only return projects belonging to the authenticated user', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        { id: 'proj-1', userId: 'user-1', name: 'Project A' },
        { id: 'proj-2', userId: 'user-1', name: 'Project B' },
      ]);

      const result = await service.findAll('user-1');

      expect(result.projects).toHaveLength(2);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('delete', () => {
    it('should delete project when user is the owner', async () => {
      mockPrisma.project.findFirst.mockResolvedValue({
        id: 'proj-1',
        userId: 'user-1',
        name: 'My Project',
      });
      mockPrisma.project.delete.mockResolvedValue({
        id: 'proj-1',
      });

      const result = await service.delete('user-1', 'proj-1');

      expect(result.success).toBe(true);
      expect(mockPrisma.project.delete).toHaveBeenCalledWith({
        where: { id: 'proj-1' },
      });
    });

    it('should prevent User A from deleting User B project (ownership enforcement)', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(
        service.delete('attacker-user', 'victim-proj-id')
      ).rejects.toThrow(NotFoundException);
    });
  });
});
