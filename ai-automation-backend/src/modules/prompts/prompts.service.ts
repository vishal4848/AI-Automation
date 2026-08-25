import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AIGatewayService } from '../ai-gateway/ai-gateway.service';

@Injectable()
export class PromptsService {
  constructor(private prisma: PrismaService, private aiGateway: AIGatewayService) {}

  async enhance(userId: string, prompt: string, category?: string) {
    const enhanced = await this.aiGateway.enhancePrompt({ prompt, category: category as any });
    try {
      await this.prisma.promptHistory.create({
        data: { userId, originalPrompt: prompt, enhancedPrompt: enhanced, category: category?.toUpperCase(), status: 'ENHANCED' },
      });
    } catch {}
    return { original: prompt, enhanced, improved: enhanced !== prompt };
  }

  async getHistory(userId: string, limit = 20) {
    try {
      return await this.prisma.promptHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch { return []; }
  }
}
