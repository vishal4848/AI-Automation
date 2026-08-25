import { useQuery } from '@tanstack/react-query';

export interface AnalyticsOverview {
  totalImages: number;
  totalVideos: number;
  totalCaptions: number;
  creditsRemaining: number;
  imageChange: number | null;
  videoChange: number | null;
  captionChange: number | null;
  creditChange: number | null;
}

export interface UsageDataPoint {
  date: string;
  images: number;
  videos: number;
  captions: number;
  credits: number;
}

export interface AnalyticsUsage {
  period: string;
  data: UsageDataPoint[];
}

export interface RecentGeneration {
  id: string;
  type: 'image' | 'video' | 'text';
  title: string;
  thumbnailUrl: string | null;
  createdAt: string;
  model: string;
  provider: string;
}

export function useAnalyticsOverview(period: string = '7d') {
  return useQuery<AnalyticsOverview>({
    queryKey: ['analytics', 'overview', period],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/overview?period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch overview');
      const json = await res.json();
      // Handle nested BFF response: { success, data: { totalImages, ... } }
      const d = json.data?.data || json.data || json;
      return d;
    }
  });
}

export function useAnalyticsUsage(period: string = '7d') {
  return useQuery<AnalyticsUsage>({
    queryKey: ['analytics', 'usage', period],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/usage?period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch usage');
      const json = await res.json();
      // Handle nested BFF response
      const d = json.data?.data || json.data || json;
      return d;
    }
  });
}

export function useRecentGenerations() {
  return useQuery<RecentGeneration[]>({
    queryKey: ['analytics', 'recent'],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/recent-generations`);
      if (!res.ok) throw new Error('Failed to fetch recent generations');
      const json = await res.json();
      // Handle nested BFF response — result could be an array directly or nested
      const d = json.data?.data || json.data || json;
      return Array.isArray(d) ? d : [];
    }
  });
}
