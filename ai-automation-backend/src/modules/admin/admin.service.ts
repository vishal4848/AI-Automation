import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      newUsers,
      totalImages,
      totalVideos,
      totalScheduledPosts,
      failedPosts,
      creditUsageAggregate,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.generatedImage.count(),
      this.prisma.generatedVideo.count(),
      this.prisma.scheduledPost.count(),
      this.prisma.scheduledPost.count({ where: { status: 'FAILED' } }),
      this.prisma.creditTransaction.aggregate({
        _sum: { amount: true },
        where: { amount: { lt: 0 } },
      }),
    ]);

    const creditsConsumed = Math.abs(creditUsageAggregate._sum.amount || 0);

    return {
      success: true,
      data: {
        totalUsers,
        activeUsers,
        newUsers,
        creditsConsumed,
        totalImages,
        totalVideos,
        totalScheduledPosts,
        failedPosts,
      },
    };
  }

  async getUsers(search?: string, role?: Role, page: number = 1, limit: number = 20) {
    const skip = (Math.max(1, page) - 1) * limit;
    const where: any = {};

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          credits: true,
          isEmailVerified: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      success: true,
      data: {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        credits: true,
        isEmailVerified: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            images: true,
            videos: true,
            scheduledPosts: true,
            socialAccounts: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const recentTransactions = await this.prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      success: true,
      data: {
        user,
        recentTransactions,
      },
    };
  }

  async updateUserStatus(adminUserId: string, targetUserId: string, isActive: boolean) {
    if (adminUserId === targetUserId && !isActive) {
      throw new BadRequestException('You cannot deactivate your own admin account.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('Target user not found.');

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive },
      select: { id: true, email: true, isActive: true },
    });

    await this.logAudit(adminUserId, 'UPDATE_USER_STATUS', targetUserId, { isActive });
    return { success: true, user: updated };
  }

  async updateUserRole(adminUserId: string, targetUserId: string, newRole: Role) {
    const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException('User not found.');

    // Prevent demoting the last SUPER_ADMIN or ADMIN
    if (targetUser.role === 'SUPER_ADMIN' || targetUser.role === 'ADMIN') {
      if (newRole !== 'SUPER_ADMIN' && newRole !== 'ADMIN') {
        const remainingAdmins = await this.prisma.user.count({
          where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true },
        });
        if (remainingAdmins <= 1) {
          throw new BadRequestException('Cannot demote the only remaining administrator.');
        }
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: { id: true, email: true, role: true },
    });

    await this.logAudit(adminUserId, 'UPDATE_USER_ROLE', targetUserId, {
      previousRole: targetUser.role,
      newRole,
    });

    return { success: true, user: updated };
  }

  async adjustUserCredits(adminUserId: string, targetUserId: string, amount: number, reason: string) {
    if (amount === 0) {
      throw new BadRequestException('Credit adjustment amount must be non-zero.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new NotFoundException('Target user not found.');

    if (amount < 0 && user.credits < Math.abs(amount)) {
      throw new BadRequestException(`Cannot deduct ${Math.abs(amount)} credits: user only has ${user.credits}.`);
    }

    let result: { balanceAfter: number };
    if (amount > 0) {
      result = await this.prisma.refundCreditsAtomically(
        targetUserId,
        amount,
        reason || 'Admin credit grant',
        { adminUserId },
      );
    } else {
      result = await this.prisma.deductCreditsAtomically(
        targetUserId,
        Math.abs(amount),
        reason || 'Admin credit deduction',
        'ADMIN_ADJUSTMENT',
        { adminUserId },
      );
    }

    await this.logAudit(adminUserId, 'ADJUST_CREDITS', targetUserId, {
      amount,
      reason,
      newBalance: result.balanceAfter,
    });

    return {
      success: true,
      message: `Successfully adjusted credits by ${amount}. New balance: ${result.balanceAfter}.`,
      newBalance: result.balanceAfter,
    };
  }

  async getAnalytics() {
    const [images, videos, scheduledStatus, recentFailures] = await Promise.all([
      this.prisma.generatedImage.count(),
      this.prisma.generatedVideo.count(),
      this.prisma.scheduledPost.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.scheduledPost.findMany({
        where: { status: 'FAILED' },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          platform: true,
          errorMessage: true,
          updatedAt: true,
          user: { select: { email: true } },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        images,
        videos,
        postsByStatus: scheduledStatus.map((s) => ({ status: s.status, count: s._count._all })),
        recentFailures,
      },
    };
  }

  async getAuditLogs(page: number = 1, limit: number = 25) {
    const skip = (Math.max(1, page) - 1) * limit;

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { email: true, name: true, role: true } },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async logAudit(adminUserId: string, action: string, resourceId?: string, metadata?: any) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action,
          resource: 'USER',
          resourceId,
          metadata: metadata || {},
        },
      });
    } catch (e: any) {
      this.logger.error(`Failed to record audit log: ${e.message}`);
    }
  }
}
