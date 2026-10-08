import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
    } catch (error: any) {
      this.logger.warn(
        `⚠️  Database not available (${error.message}). ` +
        'Running in demo mode — set DATABASE_URL in .env to enable persistence.',
      );
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch {}
  }

  /**
   * Atomically deducts credits from a user with database-level row lock.
   * Throws INSUFFICIENT_CREDITS if the user does not have enough credits.
   */
  async deductCreditsAtomically(
    userId: string,
    amount: number,
    description: string,
    type: string = 'USAGE',
    metadata?: any,
  ): Promise<{ success: boolean; balanceAfter: number }> {
    if (amount <= 0) {
      const user = await this.user.findUnique({ where: { id: userId }, select: { credits: true } });
      return { success: true, balanceAfter: user?.credits ?? 0 };
    }

    return await this.$transaction(async (tx) => {
      const affectedRows: number = await tx.$executeRaw`
        UPDATE users
        SET credits = credits - ${amount}
        WHERE id = ${userId}
        AND credits >= ${amount}
      `;

      if (affectedRows === 0) {
        throw new Error('INSUFFICIENT_CREDITS');
      }

      const updatedUser = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { credits: true },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          amount: -amount,
          type,
          description,
          balanceAfter: updatedUser.credits,
          metadata: metadata || {},
        },
      });

      return { success: true, balanceAfter: updatedUser.credits };
    });
  }

  /**
   * Atomically refunds credits back to a user if generation failed.
   */
  async refundCreditsAtomically(
    userId: string,
    amount: number,
    description: string,
    metadata?: any,
  ): Promise<{ success: boolean; balanceAfter: number }> {
    if (amount <= 0) return { success: true, balanceAfter: 0 };

    return await this.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE users
        SET credits = credits + ${amount}
        WHERE id = ${userId}
      `;

      const updatedUser = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { credits: true },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          amount,
          type: 'REFUND',
          description,
          balanceAfter: updatedUser.credits,
          metadata: metadata || {},
        },
      });

      return { success: true, balanceAfter: updatedUser.credits };
    });
  }
}

