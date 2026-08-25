'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Eye, ThumbsUp, Share2, MessageSquare, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { mockAnalytics } from '@/services/mock-data';

const COLORS = ['#3b82f6', '#a855f7', '#ec4899', '#10b981', '#f59e0b'];

const platformShare = [
  { name: 'Instagram', value: 45 },
  { name: 'LinkedIn', value: 25 },
  { name: 'Twitter/X', value: 15 },
  { name: 'TikTok', value: 10 },
  { name: 'Facebook', value: 5 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Performance Analytics</h1>
        <p className="text-sm text-muted-foreground">Comprehensive insights into content reach, engagement growth, and AI usage metrics.</p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold">Total Reach</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Eye size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">1,245,800</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-500 font-medium">
            <TrendingUp size={14} />
            <span>+24.8% from last month</span>
          </div>
        </Card>

        <Card className="border-border bg-card rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold">Engagement Rate</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <ThumbsUp size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">8.42%</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-500 font-medium">
            <TrendingUp size={14} />
            <span>+3.2% vs industry avg</span>
          </div>
        </Card>

        <Card className="border-border bg-card rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold">Followers Gained</span>
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-500">
              <Users size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">+14,250</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-500 font-medium">
            <TrendingUp size={14} />
            <span>+18.5% growth rate</span>
          </div>
        </Card>

        <Card className="border-border bg-card rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold">AI Generated Content</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <BarChart3 size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">2,840</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-500 font-medium">
            <TrendingUp size={14} />
            <span>+42% content output</span>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Growth Area Chart */}
        <Card className="lg:col-span-2 border-border bg-card rounded-2xl p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base font-bold">Reach & Engagement Over Time</CardTitle>
            <CardDescription className="text-xs">Monthly breakdown of impressions and total audience interactions.</CardDescription>
          </CardHeader>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockAnalytics}>
                <defs>
                  <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1e1e24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="reach" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorReach)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Platform Share Pie Chart */}
        <Card className="border-border bg-card rounded-2xl p-6 flex flex-col justify-between">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base font-bold">Audience by Platform</CardTitle>
            <CardDescription className="text-xs">Share of total engagement per network.</CardDescription>
          </CardHeader>
          <div className="h-56 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={platformShare} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                  {platformShare.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#1e1e24', borderRadius: '12px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 pt-2 border-t border-border">
            {platformShare.slice(0, 3).map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-bold text-foreground">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
