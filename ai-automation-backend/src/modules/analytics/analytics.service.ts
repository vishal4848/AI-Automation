import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface GenerationRecord {
  id: string;
  type: 'image' | 'video' | 'text';
  title: string;
  thumbnailUrl: string | null;
  createdAt: Date;
  model: string;
  provider: string;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  async logUsage(data: { userId: string; provider: string; model: string; jobType: string; latencyMs?: number; success: boolean; creditsUsed?: number; cost?: number }) {
    try {
      await this.prisma.usageLog.create({ data: { ...data, cost: data.cost || 0, creditsUsed: data.creditsUsed || 0 } });
    } catch {}
  }

  private getDateRanges(period: string) {
    const now = new Date();
    let currentStart = new Date(0); // Epoch for 'all'
    let previousStart = new Date(0);
    let previousEnd = new Date(0);

    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : null;

    if (days) {
      currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      previousEnd = new Date(currentStart.getTime() - 1);
      previousStart = new Date(previousEnd.getTime() - days * 24 * 60 * 60 * 1000);
    }

    return { currentStart, previousStart, previousEnd, isAllTime: !days };
  }

  private calculateChange(current: number, previous: number) {
    if (previous === 0) return current > 0 ? 100 : null;
    return ((current - previous) / previous) * 100;
  }

  async getOverview(userId: string, period: string) {
    const { currentStart, previousStart, previousEnd, isAllTime } = this.getDateRanges(period);

    const currentImages = await this.prisma.generatedImage.count({ where: { userId, createdAt: { gte: currentStart } } });
    const currentVideos = await this.prisma.generatedVideo.count({ where: { userId, status: 'COMPLETED', createdAt: { gte: currentStart } } });
    const currentCaptions = await this.prisma.generationJob.count({ where: { userId, type: 'CAPTION', status: 'COMPLETED', createdAt: { gte: currentStart } } });

    let imageChange: number | null = null;
    let videoChange: number | null = null;
    let captionChange: number | null = null;
    let creditChange: number | null = null;

    if (!isAllTime) {
      const previousImages = await this.prisma.generatedImage.count({ where: { userId, createdAt: { gte: previousStart, lte: previousEnd } } });
      const previousVideos = await this.prisma.generatedVideo.count({ where: { userId, status: 'COMPLETED', createdAt: { gte: previousStart, lte: previousEnd } } });
      const previousCaptions = await this.prisma.generationJob.count({ where: { userId, type: 'CAPTION', status: 'COMPLETED', createdAt: { gte: previousStart, lte: previousEnd } } });

      imageChange = this.calculateChange(currentImages, previousImages);
      videoChange = this.calculateChange(currentVideos, previousVideos);
      captionChange = this.calculateChange(currentCaptions, previousCaptions);

      // Credit usage change
      const currentUsage = await this.prisma.usageLog.aggregate({ where: { userId, success: true, createdAt: { gte: currentStart } }, _sum: { creditsUsed: true } });
      const previousUsage = await this.prisma.usageLog.aggregate({ where: { userId, success: true, createdAt: { gte: previousStart, lte: previousEnd } }, _sum: { creditsUsed: true } });
      creditChange = this.calculateChange(currentUsage._sum.creditsUsed || 0, previousUsage._sum.creditsUsed || 0);
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { credits: true } });

    return {
      totalImages: currentImages,
      totalVideos: currentVideos,
      totalCaptions: currentCaptions,
      creditsRemaining: user?.credits ?? 0,
      imageChange,
      videoChange,
      captionChange,
      creditChange
    };
  }

  async getUsageChart(userId: string, period: string) {
    const { currentStart } = this.getDateRanges(period);
    
    const logs = await this.prisma.usageLog.findMany({
      where: { userId, success: true, createdAt: { gte: currentStart } },
      select: { jobType: true, creditsUsed: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    });

    // Build date-bucketed data (fill empty days with zeros)
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
    const now = new Date();
    const dataMap = new Map<string, { images: number, videos: number, captions: number, credits: number }>();

    // Initialize all days with zeros
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dataMap.set(dateStr, { images: 0, videos: 0, captions: 0, credits: 0 });
    }

    // Fill in actual data from DB
    for (const log of logs) {
      const dateStr = log.createdAt.toISOString().split('T')[0];
      if (!dataMap.has(dateStr)) {
        dataMap.set(dateStr, { images: 0, videos: 0, captions: 0, credits: 0 });
      }
      const entry = dataMap.get(dateStr)!;
      entry.credits += log.creditsUsed || 0;
      if (log.jobType === 'IMAGE') entry.images += 1;
      else if (log.jobType === 'VIDEO') entry.videos += 1;
      else if (log.jobType === 'CAPTION') entry.captions += 1;
    }

    const result = Array.from(dataMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({ date, ...stats }));

    return { period, data: result };
  }

  async getRecentGenerations(userId: string) {
    const [images, videos, captions] = await Promise.all([
      this.prisma.generatedImage.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 8, select: { id: true, prompt: true, url: true, thumbnailUrl: true, createdAt: true, model: true, provider: true } }),
      this.prisma.generatedVideo.findMany({ where: { userId, status: 'COMPLETED' }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, prompt: true, thumbnailUrl: true, createdAt: true, model: true, provider: true } }),
      this.prisma.generationJob.findMany({ where: { userId, type: 'CAPTION', status: 'COMPLETED' }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, prompt: true, createdAt: true, model: true, provider: true } })
    ]);

    const mappedImages = images.map(i => ({ id: i.id, type: 'image' as const, title: i.prompt, thumbnailUrl: i.thumbnailUrl || i.url, createdAt: i.createdAt, model: i.model, provider: i.provider }));
    const mappedVideos = videos.map(v => ({ id: v.id, type: 'video' as const, title: v.prompt, thumbnailUrl: v.thumbnailUrl, createdAt: v.createdAt, model: v.model, provider: v.provider }));
    const mappedCaptions = captions.map(c => ({ id: c.id, type: 'text' as const, title: c.prompt, thumbnailUrl: null, createdAt: c.createdAt, model: c.model, provider: c.provider }));

    const all = [...mappedImages, ...mappedVideos, ...mappedCaptions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return all;
  }
}
