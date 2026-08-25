'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Plus, Clock, Filter, Share2, Image as ImageIcon, Video, CheckCircle2, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { mockPosts } from '@/services/mock-data';

export default function SchedulerPage() {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [posts, setPosts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  
  const [caption, setCaption] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [socialAccountId, setSocialAccountId] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date(Date.now() + 3600000);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });

  React.useEffect(() => {
    // Helper: extract array from possibly-nested BFF response
    const extractArray = (d: any): any[] => {
      if (Array.isArray(d.data)) return d.data;
      if (d.data && Array.isArray(d.data.data)) return d.data.data;
      return [];
    };

    // Fetch posts
    fetch('/api/scheduler/posts')
      .then(r => r.json())
      .then(d => { if (d.success) setPosts(extractArray(d)); });

    // Fetch accounts
    fetch('/api/social/accounts')
      .then(r => r.json())
      .then(d => { 
        if (d.success) {
          const accs = extractArray(d);
          setAccounts(accs);
          if (accs.length > 0) {
            setSocialAccountId(accs[0].id);
            setPlatform(accs[0].platform);
          }
        } 
      });

    // Fetch images
    fetch('/api/images')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const imgs = extractArray(d);
          setImages(imgs);
          const currentParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const incomingMedia = currentParams?.get('mediaUrl');
          if (imgs.length > 0 && !incomingMedia) {
            setMediaUrl(prev => prev || imgs[0].url);
          }
        }
      });

    // Handle incoming navigation parameters from Image Studio or Content Library
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paramMedia = params.get('mediaUrl');
      const paramCaption = params.get('caption');
      const paramAutoOpen = params.get('autoOpen');

      if (paramMedia) setMediaUrl(decodeURIComponent(paramMedia));
      if (paramCaption) setCaption(decodeURIComponent(paramCaption));
      if (paramAutoOpen === 'true' || paramMedia) setIsCreateOpen(true);
    }
  }, []);

  const handleCreatePost = async (e: React.FormEvent, isPostNow: boolean = false) => {
    e.preventDefault();
    if (!socialAccountId || !mediaUrl) return alert('Select account and image');

    // Convert local datetime to UTC
    let scheduledAtUTC: string | undefined;
    if (!isPostNow) {
      const localDate = new Date(scheduledDate);
      scheduledAtUTC = localDate.toISOString();
    }

    const payload: any = {
      mediaUrl,
      caption,
      scheduledAtUTC,
    };

    if (socialAccountId === 'ALL_CHANNELS') {
      payload.socialAccountIds = accounts.map((a) => a.id);
      payload.platform = 'BOTH';
    } else {
      payload.socialAccountId = socialAccountId;
      payload.platform = platform;
    }

    const res = await fetch('/api/scheduler/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    
    if (data.success) {
      const responseData = data.data?.data || data.data;
      const createdPostsList: any[] = responseData?.createdPosts || (Array.isArray(responseData) ? responseData : [responseData]);

      const formattedPosts = createdPostsList.map((post) => ({
        ...post,
        socialAccount: accounts.find((a) => a.id === post.socialAccountId) || post.socialAccount,
      }));

      setPosts((prev) => [...formattedPosts, ...prev]);
      setIsCreateOpen(false);
      setCaption('');
    } else {
      alert(data.error || data.message || 'Failed to schedule post');
    }
  };

  const handlePublishNow = async (id: string) => {
    const res = await fetch(`/api/scheduler/posts/${id}/publish`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      setPosts(posts.map(p => p.id === id ? { ...p, status: 'PROCESSING' } : p));
    } else {
      alert(data.error || 'Failed to publish');
    }
  };

  const handleCancelPost = async (id: string) => {
    const res = await fetch(`/api/scheduler/posts/${id}/cancel`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      setPosts(posts.map(p => p.id === id ? { ...p, status: 'CANCELLED' } : p));
    } else {
      alert(data.error || 'Failed to cancel');
    }
  };

  const [currentDate, setCurrentDate] = useState(new Date());

  const formatPostTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const isVideo = (url?: string) => {
    if (!url) return false;
    return url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov') || url.includes('/video/upload/');
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase();
    if (s === 'PUBLISHED') {
      return (
        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          Published
        </span>
      );
    }
    if (s === 'FAILED') {
      return (
        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
          Failed
        </span>
      );
    }
    if (s === 'PROCESSING') {
      return (
        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20">
          Processing
        </span>
      );
    }
    return (
      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
        Scheduled
      </span>
    );
  };

  const hasMultiplePlatforms = accounts.some(a => a.platform?.toLowerCase() === 'instagram') && accounts.some(a => a.platform?.toLowerCase() === 'facebook');

  const filteredPosts = posts.filter((post) => {
    if (selectedPlatform === 'all') return true;
    return post.platform?.toLowerCase() === selectedPlatform.toLowerCase();
  });

  const now = new Date();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOffset = (new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() + 6) % 7; // Monday-indexed

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Social Media Scheduler</h1>
          <p className="text-sm text-muted-foreground">Plan, schedule, and auto-publish content across all your social channels.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-secondary p-1 rounded-xl border border-border">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'calendar' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Calendar View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              List View
            </button>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 font-semibold">
              <Plus className="w-4 h-4" />
              <span>Schedule Post</span>
            </Button>
            <DialogContent className="sm:max-w-md bg-card border-border rounded-2xl">
              <DialogHeader>
                <DialogTitle>Create Scheduled Post</DialogTitle>
                <DialogDescription>Draft your post, select platform, and choose publication time.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePost} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Select Platform / Account</label>
                  <Select value={socialAccountId} onValueChange={(val) => {
                    if (val) {
                      setSocialAccountId(val);
                      if (val === 'ALL_CHANNELS') {
                        setPlatform('BOTH');
                      } else {
                        setPlatform(accounts.find(a => a.id === val)?.platform || 'Instagram');
                      }
                    }
                  }}>
                    <SelectTrigger className="bg-secondary/50 rounded-xl">
                      <SelectValue placeholder="Select account..." />
                    </SelectTrigger>
                    <SelectContent>
                      {hasMultiplePlatforms && (
                        <SelectItem value="ALL_CHANNELS">
                          ✨ All Connected Channels ({Array.from(new Set(accounts.map(a => a.platform))).join(' + ')})
                        </SelectItem>
                      )}
                      {accounts.map(acc => {
                        const p = acc.platform?.toLowerCase();
                        return (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.platform} - {p === 'facebook' || p === 'linkedin' ? acc.username : `@${acc.username}`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Select Generated Image</label>
                  <Select value={mediaUrl} onValueChange={(val) => setMediaUrl(val || '')}>
                    <SelectTrigger className="bg-secondary/50 rounded-xl">
                      <SelectValue placeholder="Select image..." />
                    </SelectTrigger>
                    <SelectContent>
                      {images.map(img => (
                        <SelectItem key={img.id} value={img.url}>
                          <div className="flex items-center gap-2">
                            <img src={img.url} alt="thumbnail" className="w-6 h-6 rounded-md object-cover" />
                            <span className="text-xs">{img.prompt.substring(0, 30)}...</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Caption & Hashtags</label>
                  <Textarea
                    placeholder="Write or paste your AI generated caption here..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={4}
                    className="bg-secondary/50 rounded-xl text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Schedule Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="bg-secondary/50 rounded-xl text-xs"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl text-xs">
                    Cancel
                  </Button>
                  <Button type="button" onClick={(e) => handleCreatePost(e as any, true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs">
                    Post Now
                  </Button>
                  <Button type="submit" onClick={(e) => handleCreatePost(e as any, false)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs">
                    Schedule Post
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="border-border bg-card/60 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">Platforms:</span>
          {['all', 'Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'TikTok'].map((plat) => (
            <button
              key={plat}
              onClick={() => setSelectedPlatform(plat)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                selectedPlatform.toLowerCase() === plat.toLowerCase() ? 'bg-blue-500/15 text-blue-500 border border-blue-500/30' : 'text-muted-foreground hover:bg-secondary'
              }`}
            >
              {plat === 'all' ? 'All Channels' : plat}
            </button>
          ))}
        </div>

        <div className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredPosts.length}</span> of {posts.length} posts
        </div>
      </Card>

      {/* Calendar Grid Representation */}
      {viewMode === 'calendar' ? (
        <Card className="border-border bg-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-500" />
              <span>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                className="rounded-xl"
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="rounded-xl text-xs font-semibold"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                className="rounded-xl"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-muted-foreground pb-2 border-b border-border">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 pt-2 min-h-[400px]">
            {/* Offset blanks for alignment */}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`offset-${i}`} className="min-h-[140px] rounded-xl bg-secondary/10 border border-transparent hidden lg:block opacity-40" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = now.getDate() === day && now.getMonth() === currentDate.getMonth() && now.getFullYear() === currentDate.getFullYear();

              const dayPosts = filteredPosts.filter((p) => {
                const dateStr = p.scheduledAtUTC || p.scheduledAt || p.createdAt;
                if (!dateStr) return false;
                const postDate = new Date(dateStr);
                return (
                  postDate.getDate() === day &&
                  postDate.getMonth() === currentDate.getMonth() &&
                  postDate.getFullYear() === currentDate.getFullYear()
                );
              });

              return (
                <div
                  key={day}
                  className={`min-h-[140px] border rounded-xl p-2.5 bg-secondary/20 hover:bg-secondary/40 transition-all flex flex-col justify-between ${
                    isToday ? 'border-blue-500/50 bg-blue-500/5' : 'border-border/50'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className={`font-bold ${isToday ? 'text-blue-500' : 'text-muted-foreground'}`}>
                      {day}
                    </span>
                    {dayPosts.length > 0 && (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-blue-500/10 text-blue-500 font-semibold">
                        {dayPosts.length} {dayPosts.length === 1 ? 'post' : 'posts'}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 mt-1 flex-1">
                    {dayPosts.map((post) => {
                      const platformLower = post.platform?.toLowerCase();
                      const isFB = platformLower === 'facebook';
                      const isLI = platformLower === 'linkedin';
                      const accountName = post.socialAccount?.username || (isFB ? post.pageName : post.username);
                      const postTime = formatPostTime(post.scheduledAtUTC || post.scheduledAt || post.createdAt);
                      const hasVideo = isVideo(post.mediaUrl || post.mediaUrls?.[0]);

                      return (
                        <div
                          key={post.id}
                          className="bg-card border border-border/80 hover:border-blue-500/40 transition-all rounded-xl p-2 text-[10px] shadow-sm flex flex-col gap-1.5 group relative"
                          title={`${post.platform}${accountName ? ' • ' + (isFB || isLI ? accountName : '@' + accountName) : ''}\nTime: ${postTime || 'Draft'}\nStatus: ${post.status}\n\n${post.caption || post.content || ''}`}
                        >
                          {/* 1. Scheduled Time + Status Badge */}
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <div className="flex items-center gap-1 text-foreground">
                              <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="truncate">{postTime || 'Scheduled'}</span>
                            </div>
                            {getStatusBadge(post.status)}
                          </div>

                          {/* 2. Media Thumbnail */}
                          {(post.mediaUrl || post.mediaUrls?.[0]) && (
                            <div className="relative w-full h-16 rounded-lg overflow-hidden bg-muted border border-border/50 shrink-0">
                              {hasVideo ? (
                                <div className="relative w-full h-full flex items-center justify-center bg-black/40">
                                  <video
                                    src={post.mediaUrl || post.mediaUrls?.[0]}
                                    className="w-full h-full object-cover"
                                    muted
                                    playsInline
                                  />
                                  <span className="absolute bottom-1 right-1 bg-black/70 text-[8px] px-1 py-0.5 rounded text-white font-semibold flex items-center gap-0.5">
                                    <Video className="w-2.5 h-2.5" /> Video
                                  </span>
                                </div>
                              ) : (
                                <img
                                  src={post.mediaUrl || post.mediaUrls?.[0]}
                                  alt="Post thumbnail"
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                          )}

                          {/* 3. Platform & Account / Page */}
                          <div className="flex items-center gap-1.5 min-w-0 pt-0.5">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                isFB
                                  ? 'bg-blue-500'
                                  : isLI
                                  ? 'bg-[#0A66C2]'
                                  : 'bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600'
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-[10px] text-foreground truncate">{post.platform}</div>
                              {accountName && (
                                <div className="text-[9px] text-muted-foreground truncate leading-none">
                                  {isFB || isLI ? accountName : `@${accountName}`}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 4. Caption Preview */}
                          {(post.caption || post.content) && (
                            <p className="text-[9px] text-muted-foreground italic line-clamp-2 leading-tight">
                              &ldquo;{(post.caption || post.content).length > 55 ? `${(post.caption || post.content).slice(0, 55)}...` : (post.caption || post.content)}&rdquo;
                            </p>
                          )}

                          {/* 5. Quick Hover Actions if Scheduled */}
                          {(post.status === 'SCHEDULED' || post.status === 'scheduled') && (
                            <div className="pt-1 flex items-center justify-end gap-1 border-t border-border/40 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handlePublishNow(post.id); }}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-blue-600/15 text-blue-500 hover:bg-blue-600 hover:text-white font-semibold transition-colors"
                              >
                                Post Now
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleCancelPost(post.id); }}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive hover:bg-destructive hover:text-white font-semibold transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        /* List View */
        <div className="space-y-3">
          {filteredPosts.map((post) => {
            const platformLower = post.platform?.toLowerCase();
            const isFB = platformLower === 'facebook';
            const isLI = platformLower === 'linkedin';
            return (
              <Card key={post.id} className="border-border bg-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-border/80 transition-all">
                <div className="flex items-center gap-4">
                  <img
                    src={post.mediaUrl || post.mediaUrls?.[0]}
                    alt="Post Thumbnail"
                    className="w-16 h-16 rounded-xl object-cover border border-border shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          isFB
                            ? 'border-blue-500/30 text-blue-400 bg-blue-500/10'
                            : isLI
                            ? 'border-[#0A66C2]/30 text-[#0A66C2] bg-[#0A66C2]/10'
                            : 'border-pink-500/30 text-pink-400 bg-pink-500/10'
                        }`}
                      >
                        {post.platform}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(post.scheduledAtUTC || post.scheduledAt || post.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-foreground font-medium line-clamp-2">{post.caption || post.content}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge
                    className={
                      post.status === 'PUBLISHED' || post.status === 'published'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : post.status === 'FAILED'
                        ? 'bg-destructive/10 text-destructive border-destructive/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }
                  >
                    {post.status}
                  </Badge>
                  
                  {(post.status === 'SCHEDULED' || post.status === 'scheduled') && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => handlePublishNow(post.id)} className="rounded-xl text-blue-500 hover:text-blue-600">
                        Post Now
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleCancelPost(post.id)} className="rounded-xl text-destructive hover:text-destructive">
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
