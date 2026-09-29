import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../database/prisma.service';
import { EventsGateway } from '../websocket/events.gateway';
import { NotFoundException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;
  let eventsGateway: EventsGateway;

  const mockPrisma = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockEventsGateway = {
    emitToUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventsGateway, useValue: mockEventsGateway },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
    eventsGateway = module.get<EventsGateway>(EventsGateway);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create notification and emit websocket event to user', async () => {
      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        type: 'IMAGE_GENERATED',
        title: 'AI Image Generated',
        message: 'Your image is ready',
        isRead: false,
        createdAt: new Date(),
      });

      const result = await service.create('user-1', {
        type: 'IMAGE_GENERATED',
        title: 'AI Image Generated',
        message: 'Your image is ready',
      });

      expect(result?.id).toBe('notif-1');
      expect(mockEventsGateway.emitToUser).toHaveBeenCalledWith('user-1', 'notification.new', expect.any(Object));
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications and unread count', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([
        { id: 'notif-1', title: 'A', isRead: false },
        { id: 'notif-2', title: 'B', isRead: true },
      ]);
      mockPrisma.notification.count.mockResolvedValueOnce(2).mockResolvedValueOnce(1);

      const result = await service.findAll('user-1');

      expect(result.notifications).toHaveLength(2);
      expect(result.unreadCount).toBe(1);
    });
  });

  describe('markAsRead', () => {
    it('should mark specific notification as read', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        isRead: false,
      });
      mockPrisma.notification.update.mockResolvedValue({
        id: 'notif-1',
        isRead: true,
      });

      const result = await service.markAsRead('user-1', 'notif-1');
      expect(result.isRead).toBe(true);
    });

    it('should throw NotFoundException if notification does not exist or belongs to another user', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(null);
      await expect(service.markAsRead('user-attacker', 'notif-victim')).rejects.toThrow(NotFoundException);
    });
  });
});
