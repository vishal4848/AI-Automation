'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import {
  Image as ImageIcon, Video, Type, Hash, ArrowUpRight, Sparkles, Zap, Play, TrendingUp, Clock, Loader2, AlertCircle, Upload
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useAnalyticsOverview, useAnalyticsUsage, useRecentGenerations } from '@/lib/api/analytics-api';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [period, setPeriod] = useState('7d');

  const { data: overview, isLoading: isLoadingOverview, isError: isErrorOverview } = useAnalyticsOverview(period);
  const { data: usage, isLoading: isLoadingUsage } = useAnalyticsUsage(period);
  const { data: recent, isLoading: isLoadingRecent } = useRecentGenerations();

  const getFirstName = (name?: string) => name ? name.split(' ')[0] : 'Vishal';
  const firstName = getFirstName(user?.name);

  const formatChange = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '—';
    if (val > 0) return `+${val.toFixed(0)}%`;
    return `${val.toFixed(0)}%`;
  };

  if (isErrorOverview) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Unable to load analytics</h2>
          <button className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 grid-bg min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl p-8 md:p-12 glass-card border-white/10"
      >
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none animate-[pulse-glow_4s_infinite]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none animate-[pulse-glow_6s_infinite_reverse]" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-cyan-400 mb-6 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" /> Platform v2.0 is live
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Welcome back, <span className="text-gradient">{firstName || 'Creator'}</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
            Your AI agents are ready. What will you create today?
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={() => router.push('/ai-image')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-cyan-500 text-white font-semibold shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> Generate New Asset
            </button>
            <button 
              onClick={() => router.push('/upload')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all backdrop-blur-md cursor-pointer"
            >
              <Upload className="w-4 h-4" /> Upload from Device
            </button>
            <button 
              onClick={() => router.push('/content-library')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all backdrop-blur-md cursor-pointer"
            >
              <Play className="w-4 h-4" /> View Library
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Images', value: overview?.totalImages ?? 0, trend: formatChange(overview?.imageChange), icon: ImageIcon, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Videos Created', value: overview?.totalVideos ?? 0, trend: formatChange(overview?.videoChange), icon: Video, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
          { label: 'Captions Written', value: overview?.totalCaptions ?? 0, trend: formatChange(overview?.captionChange), icon: Type, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Credits Remaining', value: overview?.creditsRemaining ?? 0, trend: formatChange(overview?.creditChange), icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
        ].map((stat, i) => (
          <motion.div key={i} variants={itemVariants} className="glass-card p-5 glass-card-hover group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="flex items-center text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                {stat.trend} {stat.trend !== '—' && <ArrowUpRight className="w-3 h-3 ml-1" />}
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-white tracking-tight">
                {isLoadingOverview ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : stat.value}
              </h3>
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> API Usage
              </h3>
              <p className="text-sm text-muted-foreground">Tokens consumed over the selected period</p>
            </div>
            <select 
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-[#111118] border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            {isLoadingUsage ? (
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            ) : usage?.data?.length === 0 ? (
              <p className="text-muted-foreground">No AI usage yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usage?.data || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v.substring(5)} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} />
                  <Area type="monotone" dataKey="credits" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsage)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6 flex flex-col">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-cyan-400" /> Recent Generations
          </h3>
          <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[360px]">
            {isLoadingRecent ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : recent?.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground text-sm">
                <p>No generations yet</p>
                <p className="mt-1">Start creating your first AI asset.</p>
              </div>
            ) : (
              recent?.map((activity) => {
                const isImage = activity.type === 'image';
                const isVideo = activity.type === 'video';
                const Icon = isImage ? ImageIcon : isVideo ? Video : Type;
                const color = isImage ? 'text-primary' : isVideo ? 'text-cyan-400' : 'text-emerald-400';
                const bg = isImage ? 'bg-primary/10' : isVideo ? 'bg-cyan-400/10' : 'bg-emerald-400/10';

                return (
                  <div 
                    key={activity.id} 
                    onClick={() => router.push(isImage ? '/ai-image' : isVideo ? '/ai-video' : '/ai-caption')}
                    className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/10 group"
                  >
                    {activity.thumbnailUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img 
                        src={activity.thumbnailUrl} 
                        alt={activity.title} 
                        className="w-11 h-11 rounded-lg object-cover border border-white/10 shrink-0 group-hover:scale-105 transition-transform" 
                      />
                    ) : (
                      <div className={`p-3 rounded-lg ${bg} ${color} shrink-0 group-hover:scale-105 transition-transform`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">{activity.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{activity.type} • {activity.model || 'FLUX'}</p>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap shrink-0">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          <button 
            onClick={() => router.push('/content-library')}
            className="w-full mt-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer border border-white/5"
          >
            View All Activity
          </button>
        </motion.div>
      </div>
    </div>
  );
}

