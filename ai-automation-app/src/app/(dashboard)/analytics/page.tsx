'use client';

import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Eye, ThumbsUp, Sparkles, Coins, CalendarCheck } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, PieChart, Pie, Cell } from 'recharts';
import { useAnalyticsOverview, useAnalyticsUsage } from '@/lib/api/analytics-api';

const COLORS = ['#3b82f6', '#a855f7', '#ec4899', '#10b981', '#f59e0b'];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d');
  const { data: overview, isLoading: isOverviewLoading } = useAnalyticsOverview(period);
  const { data: usage, isLoading: isUsageLoading } = useAnalyticsUsage(period);

  const totalAIContent = (overview?.totalImages || 0) + (overview?.totalVideos || 0) + (overview?.totalCaptions || 0);

  const chartData = usage?.data?.length
    ? usage.data.map((d) => ({
        date: d.date,
        content: d.images + d.videos + d.captions,
        credits: d.credits,
        images: d.images,
        videos: d.videos,
      }))
    : [];

  const platformShare = [
    { name: 'Generated Images', value: overview?.totalImages || 0 },
    { name: 'Generated Videos', value: overview?.totalVideos || 0 },
    { name: 'Generated Captions', value: overview?.totalCaptions || 0 },
  ].filter((p) => p.value > 0);

  const displayPlatformShare = platformShare.length > 0 ? platformShare : [
    { name: 'Images', value: 1 },
    { name: 'Videos', value: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Performance Analytics</h1>
          <p className="text-sm text-muted-foreground">Comprehensive insights into content reach, engagement growth, and AI usage metrics.</p>
        </div>

        <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-1 self-start">
          {['7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                period === p
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold">Total Audience Reach</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Eye size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">N/A</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <span>Connect social channels for live reach</span>
          </div>
        </Card>

        <Card className="border-border bg-card rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold">Audience Engagement</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <ThumbsUp size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">N/A</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <span>External API metrics pending</span>
          </div>
        </Card>

        <Card className="border-border bg-card rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold">Credits Available</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Coins size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {isOverviewLoading ? '...' : (overview?.creditsRemaining ?? 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-500 font-medium">
            <Sparkles size={14} />
            <span>Ready for generation</span>
          </div>
        </Card>

        <Card className="border-border bg-card rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold">AI Generated Content</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <BarChart3 size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {isOverviewLoading ? '...' : totalAIContent.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-500 font-medium">
            <TrendingUp size={14} />
            <span>{overview?.totalImages || 0} images, {overview?.totalVideos || 0} videos</span>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Growth Area Chart */}
        <Card className="lg:col-span-2 border-border bg-card rounded-2xl p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base font-bold">AI Content Activity Over Time</CardTitle>
            <CardDescription className="text-xs">Real-time daily breakdown of media generations and credits consumed.</CardDescription>
          </CardHeader>
          <div className="h-72 w-full pt-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorContent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="date" stroke="#888" fontSize={11} />
                  <YAxis stroke="#888" fontSize={11} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="content" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorContent)" name="Generations" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                {isUsageLoading ? 'Loading activity data...' : 'No content generated yet in this period.'}
              </div>
            )}
          </div>
        </Card>

        {/* Platform Share Pie Chart */}
        <Card className="border-border bg-card rounded-2xl p-6 flex flex-col justify-between">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base font-bold">Generations by Category</CardTitle>
            <CardDescription className="text-xs">Breakdown of AI media output across modalities.</CardDescription>
          </CardHeader>
          <div className="h-56 w-full relative flex items-center justify-center">
            {totalAIContent > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={displayPlatformShare} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                    {displayPlatformShare.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-muted-foreground text-center">
                No generated assets found yet.
              </div>
            )}
          </div>
          <div className="space-y-2 pt-2 border-t border-border">
            {displayPlatformShare.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-bold text-foreground">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
