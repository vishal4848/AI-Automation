'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Filter,
  Share2,
  Image as ImageIcon,
  Video,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  X,
  Check,
  Loader2,
  Sparkles,
  Upload,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface MediaItem {
  id: string;
  url: string;
  prompt: string;
  source: 'AI_GENERATED' | 'UPLOAD';
  resourceType: 'image' | 'video';
  createdAt?: string;
  provider?: string;
  model?: string;
}

export default function SchedulerPage() {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Scheduling state
  const [posts, setPosts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<MediaItem | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date(Date.now() + 3600000);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });

  // Media picker modal & search
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<'All' | 'Images' | 'Videos' | 'AI Generated' | 'Uploaded'>('All');
  const [mediaSearch, setMediaSearch] = useState('');
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [currentDate, setCurrentDate] = useState(new Date());

  // Helper: extract array from possibly-nested BFF response
  const extractArray = (d: any): any[] => {
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (Array.isArray(d.data)) return d.data;
    if (d.data && Array.isArray(d.data.data)) return d.data.data;
    if (Array.isArray(d.images)) return d.images;
    if (Array.isArray(d.videos)) return d.videos;
    if (Array.isArray(d.assets)) return d.assets;
    return [];
  };

  const isVideoUrl = (url?: string) => {
    if (!url) return false;
    return (
      url.endsWith('.mp4') ||
      url.endsWith('.webm') ||
      url.endsWith('.mov') ||
      url.includes('/video/upload/') ||
      url.includes('.mp4?') ||
      url.includes('.webm?') ||
      url.includes('.mov?')
    );
  };

  // Load posts, accounts, and real media assets
  useEffect(() => {
    // 1. Fetch Scheduled Posts
    fetch('/api/scheduler/posts')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPosts(extractArray(d));
      })
      .catch(() => {});

    // 2. Fetch Connected Social Accounts
    fetch('/api/social/accounts')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const accs = extractArray(d);
          setAccounts(accs);
          const usable = accs.filter((a: any) => a.status === 'CONNECTED');
          if (usable.length > 0) {
            setSelectedAccountIds((prev) => (prev.length > 0 ? prev : [usable[0].id]));
          }
        }
      })
      .catch(() => {});

    // 3. Fetch Real Media Assets from Content Library
    setIsLoadingMedia(true);
    setMediaError(null);

    Promise.all([
      fetch('/api/images?limit=100').then((r) => r.json()).catch(() => ({})),
      fetch('/api/videos?limit=100').then((r) => r.json()).catch(() => ({})),
      fetch('/api/assets?limit=100').then((r) => r.json()).catch(() => ({})),
    ])
      .then(([imgRes, vidRes, assetRes]) => {
        const rawImgs = extractArray(imgRes);
        const rawVids = extractArray(vidRes);
        const rawAssets = extractArray(assetRes);

        const formattedImages: MediaItem[] = rawImgs.map((img: any) => ({
          id: img.id,
          url: img.secureUrl || img.url,
          prompt: img.prompt || 'AI Generated Image',
          source: 'AI_GENERATED',
          resourceType: 'image',
          createdAt: img.createdAt,
          provider: img.provider || 'AI Provider',
          model: img.model || 'FLUX Schnell',
        }));

        const formattedVideos: MediaItem[] = rawVids.map((vid: any) => ({
          id: vid.id,
          url: vid.secureUrl || vid.url,
          prompt: vid.prompt || 'AI Generated Video',
          source: 'AI_GENERATED',
          resourceType: 'video',
          createdAt: vid.createdAt,
          provider: vid.provider || 'Replicate',
          model: vid.model || 'WAN 3',
        }));

        const formattedAssets: MediaItem[] = rawAssets.map((asset: any) => {
          const url = asset.secureUrl || asset.url;
          const isVid = asset.resourceType === 'video' || isVideoUrl(url);
          return {
            id: asset.id,
            url,
            prompt: asset.fileName || asset.originalName || 'Uploaded Media',
            source: 'UPLOAD',
            resourceType: isVid ? 'video' : 'image',
            createdAt: asset.createdAt,
            provider: 'Upload',
            model: isVid ? 'Video Upload' : 'Image Upload',
          };
        });

        const combined: MediaItem[] = [...formattedImages, ...formattedVideos, ...formattedAssets].sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );

        setMediaItems(combined);

        // Prefill check
        if (typeof window !== 'undefined') {
          try {
            const stored = sessionStorage.getItem('scheduler_prefill');
            if (stored) {
              const parsed = JSON.parse(stored);
              sessionStorage.removeItem('scheduler_prefill');

              const matched = combined.find(
                (m) =>
                  (parsed.assetId && m.id === parsed.assetId) ||
                  (parsed.imageId && m.id === parsed.imageId) ||
                  (parsed.videoId && m.id === parsed.videoId) ||
                  (parsed.mediaUrl && m.url === parsed.mediaUrl)
              );

              if (matched) {
                setSelectedAsset(matched);
                setMediaUrl(matched.url);
              } else if (parsed.mediaUrl) {
                setMediaUrl(parsed.mediaUrl);
                setSelectedAsset({
                  id: parsed.assetId || parsed.imageId || parsed.videoId || `media-${Date.now()}`,
                  url: parsed.mediaUrl,
                  prompt: parsed.caption || 'Shared Media',
                  source: parsed.assetId ? 'UPLOAD' : 'AI_GENERATED',
                  resourceType: parsed.resourceType || (isVideoUrl(parsed.mediaUrl) ? 'video' : 'image'),
                });
              }

              if (parsed.caption) setCaption(parsed.caption);
              setIsCreateOpen(true);
            }
          } catch {}

          const params = new URLSearchParams(window.location.search);
          const paramMedia = params.get('mediaUrl');
          const paramCaption = params.get('caption');
          const paramAutoOpen = params.get('autoOpen');
          const paramAssetId = params.get('assetId');
          const paramImageId = params.get('imageId');
          const paramVideoId = params.get('videoId');

          if (paramAssetId || paramImageId || paramVideoId || paramMedia) {
            const matched = combined.find(
              (m) =>
                (paramAssetId && m.id === paramAssetId) ||
                (paramImageId && m.id === paramImageId) ||
                (paramVideoId && m.id === paramVideoId) ||
                (paramMedia && m.url === decodeURIComponent(paramMedia))
            );

            if (matched) {
              setSelectedAsset(matched);
              setMediaUrl(matched.url);
            } else if (paramMedia && !paramMedia.startsWith('data:') && paramMedia.length < 1000) {
              const decoded = decodeURIComponent(paramMedia);
              setMediaUrl(decoded);
              setSelectedAsset({
                id: paramAssetId || paramImageId || paramVideoId || `media-${Date.now()}`,
                url: decoded,
                prompt: paramCaption ? decodeURIComponent(paramCaption) : 'Selected Media',
                source: paramAssetId ? 'UPLOAD' : 'AI_GENERATED',
                resourceType: isVideoUrl(decoded) ? 'video' : 'image',
              });
            }
          }

          if (paramCaption && paramCaption.length < 1000) {
            setCaption(decodeURIComponent(paramCaption));
          }

          if (paramAutoOpen === 'true' || paramMedia || paramAssetId || paramImageId || paramVideoId) {
            setIsCreateOpen(true);
          }
        }
      })
      .catch((err) => {
        setMediaError(err.message || 'Failed to load media assets');
      })
      .finally(() => {
        setIsLoadingMedia(false);
      });
  }, []);

  // Filtered media items for the picker modal
  const filteredMedia = useMemo(() => {
    return mediaItems.filter((item) => {
      const q = mediaSearch.toLowerCase().trim();
      const matchesSearch = !q || item.prompt.toLowerCase().includes(q) || (item.model && item.model.toLowerCase().includes(q));
      if (!matchesSearch) return false;

      if (mediaFilter === 'All') return true;
      if (mediaFilter === 'Images') return item.resourceType === 'image';
      if (mediaFilter === 'Videos') return item.resourceType === 'video';
      if (mediaFilter === 'AI Generated') return item.source === 'AI_GENERATED';
      if (mediaFilter === 'Uploaded') return item.source === 'UPLOAD';
      return true;
    });
  }, [mediaItems, mediaFilter, mediaSearch]);

  // Usable connected accounts
  const usableAccounts = useMemo(() => {
    return accounts.filter((a) => a.status === 'CONNECTED');
  }, [accounts]);

  // Group connected accounts by platform
  const groupedAccounts = useMemo(() => {
    const groups: Record<string, any[]> = {};
    usableAccounts.forEach((acc) => {
      const plat = acc.platform || 'Other';
      if (!groups[plat]) groups[plat] = [];
      groups[plat].push(acc);
    });
    return groups;
  }, [usableAccounts]);

  // Select All synchronization
  const isAllSelected = usableAccounts.length > 0 && usableAccounts.every((a) => selectedAccountIds.includes(a.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedAccountIds([]);
    } else {
      setSelectedAccountIds(usableAccounts.map((a) => a.id));
    }
  };

  const handleToggleAccount = (id: string) => {
    setSelectedAccountIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((accId) => accId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Selected platforms count for summary badge
  const selectedPlatformsCount = useMemo(() => {
    const plats = usableAccounts
      .filter((a) => selectedAccountIds.includes(a.id))
      .map((a) => a.platform?.toLowerCase());
    return new Set(plats).size;
  }, [usableAccounts, selectedAccountIds]);

  // Create post (Schedule or Post Now)
  const handleCreatePost = async (e: React.FormEvent, isPostNow: boolean = false) => {
    e.preventDefault();
    setActionError(null);

    if (selectedAccountIds.length === 0) {
      setActionError('Please select at least one connected social account.');
      return;
    }

    const finalMedia = selectedAsset?.url || mediaUrl;
    if (!finalMedia) {
      setActionError('Please select a media asset from your Content Library.');
      return;
    }

    // Convert local datetime to UTC for scheduling
    let scheduledAtUTC: string | undefined;
    if (!isPostNow) {
      const localDate = new Date(scheduledDate);
      if (isNaN(localDate.getTime()) || localDate.getTime() <= Date.now()) {
        setActionError('Scheduled time must be in the future.');
        return;
      }
      scheduledAtUTC = localDate.toISOString();
    }

    const payload = {
      socialAccountIds: selectedAccountIds,
      mediaUrl: finalMedia,
      mediaAssetId: selectedAsset?.id,
      uploadedAssetId: selectedAsset?.source === 'UPLOAD' ? selectedAsset.id : undefined,
      caption,
      scheduledAtUTC,
    };

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/scheduler/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        setActionError(null);
      } else {
        setActionError(data.error || data.message || 'Failed to schedule post');
      }
    } catch (err: any) {
      setActionError(err.message || 'Network error while creating post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishNow = async (id: string) => {
    try {
      const res = await fetch(`/api/scheduler/posts/${id}/publish`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPosts(posts.map((p) => (p.id === id ? { ...p, status: 'PROCESSING' } : p)));
      } else {
        alert(data.error || 'Failed to publish');
      }
    } catch {
      alert('Failed to publish');
    }
  };

  const handleCancelPost = async (id: string) => {
    try {
      const res = await fetch(`/api/scheduler/posts/${id}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPosts(posts.map((p) => (p.id === id ? { ...p, status: 'CANCELLED' } : p)));
      } else {
        alert(data.error || 'Failed to cancel');
      }
    } catch {
      alert('Failed to cancel');
    }
  };

  const formatPostTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
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

          <Button
            onClick={() => {
              setActionError(null);
              setIsCreateOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Post</span>
          </Button>
        </div>
      </div>

      {/* Main Schedule Post Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-xl bg-card border-border rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Scheduled Post</DialogTitle>
            <DialogDescription>Draft your post, select target social accounts, and choose publication time.</DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <form onSubmit={(e) => handleCreatePost(e, false)} className="space-y-4 pt-1">
            {/* 1. Multi-Account Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Target Social Accounts {usableAccounts.length > 0 && `(${usableAccounts.length} connected)`}
                </label>
                {usableAccounts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-xs text-blue-500 hover:text-blue-600 font-semibold transition-colors"
                  >
                    {isAllSelected ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              {usableAccounts.length === 0 ? (
                <div className="p-3.5 bg-secondary/30 rounded-xl border border-border text-center text-xs text-muted-foreground space-y-1">
                  <p>No connected social accounts found.</p>
                  <p className="text-[11px]">Connect Instagram, Facebook, or LinkedIn in Settings to schedule posts.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1 border border-border/60 rounded-xl p-2 bg-secondary/20">
                  {Object.entries(groupedAccounts).map(([plat, accList]) => (
                    <div key={plat} className="space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                        {plat}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {accList.map((acc) => {
                          const isSelected = selectedAccountIds.includes(acc.id);
                          const isFB = acc.platform?.toLowerCase() === 'facebook';
                          const isLI = acc.platform?.toLowerCase() === 'linkedin';
                          const displayName = isFB || isLI ? acc.username : `@${acc.username}`;

                          return (
                            <label
                              key={acc.id}
                              className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-xs select-none ${
                                isSelected
                                  ? 'bg-blue-500/10 border-blue-500/40 text-foreground'
                                  : 'bg-card/70 border-border/60 text-muted-foreground hover:bg-secondary/60'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleAccount(acc.id)}
                                className="rounded border-border text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 shrink-0"
                              />
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  isFB ? 'bg-blue-500' : isLI ? 'bg-[#0A66C2]' : 'bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600'
                                }`}
                              />
                              <span className="font-medium text-foreground truncate min-w-0 flex-1">{displayName}</span>
                              <span className="text-[9px] font-semibold text-emerald-500 shrink-0">Connected</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selection Summary */}
              {selectedAccountIds.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>
                    <strong className="text-foreground">{selectedAccountIds.length}</strong>{' '}
                    {selectedAccountIds.length === 1 ? 'account' : 'accounts'} selected across{' '}
                    <strong className="text-foreground">{selectedPlatformsCount}</strong>{' '}
                    {selectedPlatformsCount === 1 ? 'platform' : 'platforms'}
                  </span>
                </div>
              )}
            </div>

            {/* 2. Real Media Asset Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">Media Asset</label>

              {selectedAsset ? (
                <div className="border border-border/80 bg-secondary/20 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Selected Asset</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsMediaPickerOpen(true)}
                        className="text-xs text-blue-500 hover:text-blue-600 font-semibold"
                      >
                        Change Asset
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAsset(null);
                          setMediaUrl('');
                        }}
                        className="text-xs text-destructive hover:text-destructive/80 font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted border border-border shrink-0">
                      {selectedAsset.resourceType === 'video' || isVideoUrl(selectedAsset.url) ? (
                        <div className="relative w-full h-full flex items-center justify-center bg-black/40">
                          <video src={selectedAsset.url} className="w-full h-full object-cover" muted />
                          <span className="absolute bottom-1 right-1 bg-black/80 text-[7px] px-1 py-0.5 rounded text-white font-bold flex items-center gap-0.5">
                            <Video className="w-2 h-2" /> VIDEO
                          </span>
                        </div>
                      ) : (
                        <img src={selectedAsset.url} alt="Selected preview" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-medium">
                          {selectedAsset.source === 'AI_GENERATED'
                            ? selectedAsset.resourceType === 'video'
                              ? 'AI Video'
                              : 'AI Image'
                            : selectedAsset.resourceType === 'video'
                            ? 'Video Upload'
                            : 'Image Upload'}
                        </Badge>
                        {selectedAsset.provider && (
                          <span className="text-[10px] text-muted-foreground">{selectedAsset.provider}</span>
                        )}
                      </div>
                      <p className="text-xs text-foreground truncate font-medium">{selectedAsset.prompt || 'Media Asset'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsMediaPickerOpen(true)}
                  className="w-full rounded-xl border border-dashed border-border hover:border-blue-500/50 p-4 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground bg-secondary/20 transition-all group"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">Select from Content Library</span>
                  <span className="text-[11px] text-muted-foreground">
                    {mediaItems.length > 0 ? `${mediaItems.length} assets available (AI Generated & Uploads)` : 'Choose an image or video'}
                  </span>
                </button>
              )}
            </div>

            {/* 3. Caption & Hashtags */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Caption & Hashtags</label>
              <Textarea
                placeholder="Write or paste your AI generated caption here..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                className="bg-secondary/50 rounded-xl text-xs"
              />
            </div>

            {/* 4. Schedule Date & Time */}
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

            {/* Action Buttons */}
            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isSubmitting}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={(e) => handleCreatePost(e as any, true)}
                disabled={isSubmitting || selectedAccountIds.length === 0 || (!selectedAsset && !mediaUrl)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Post Now'}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || selectedAccountIds.length === 0 || (!selectedAsset && !mediaUrl)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Schedule Post'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Real Media Picker Dialog */}
      <Dialog open={isMediaPickerOpen} onOpenChange={setIsMediaPickerOpen}>
        <DialogContent className="sm:max-w-2xl bg-card border-border rounded-2xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader className="pb-2">
            <DialogTitle>Content Library Media</DialogTitle>
            <DialogDescription>Select any AI-generated or uploaded asset to use in your scheduled post.</DialogDescription>
          </DialogHeader>

          {/* Search & Category Filter Pills */}
          <div className="space-y-3 pt-1">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search media by prompt or file name..."
                value={mediaSearch}
                onChange={(e) => setMediaSearch(e.target.value)}
                className="pl-9 bg-secondary/50 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {(['All', 'Images', 'Videos', 'AI Generated', 'Uploaded'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setMediaFilter(filter)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                    mediaFilter === filter
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Media Grid */}
          <div className="flex-1 overflow-y-auto min-h-[250px] max-h-[420px] pt-2">
            {isLoadingMedia ? (
              <div className="h-48 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-xs">Loading media assets...</span>
              </div>
            ) : mediaError ? (
              <div className="h-48 flex flex-col items-center justify-center gap-2 text-destructive">
                <AlertCircle className="w-6 h-6" />
                <span className="text-xs font-semibold">{mediaError}</span>
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center gap-2 text-muted-foreground text-center p-4">
                <ImageIcon className="w-8 h-8 opacity-40" />
                <span className="text-xs font-medium text-foreground">No media assets found</span>
                <span className="text-[11px] max-w-sm">
                  Generate AI images or videos, or upload files in your Content Library to use them here.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {filteredMedia.map((item) => {
                  const isSelected = selectedAsset?.id === item.id;
                  const isVid = item.resourceType === 'video' || isVideoUrl(item.url);

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedAsset(item);
                        setMediaUrl(item.url);
                        setIsMediaPickerOpen(false);
                      }}
                      className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all flex flex-col bg-secondary/20 hover:border-blue-500/50 ${
                        isSelected ? 'ring-2 ring-blue-500 border-transparent shadow-md' : 'border-border/60'
                      }`}
                    >
                      <div className="relative aspect-square w-full overflow-hidden bg-muted">
                        {isVid ? (
                          <div className="relative w-full h-full flex items-center justify-center bg-black/30">
                            <video src={item.url} className="w-full h-full object-cover" muted />
                            <span className="absolute bottom-1 right-1 bg-black/80 text-[8px] px-1 py-0.5 rounded text-white font-bold flex items-center gap-0.5">
                              <Video className="w-2.5 h-2.5" /> Video
                            </span>
                          </div>
                        ) : (
                          <img
                            src={item.url}
                            alt={item.prompt}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}

                        <span
                          className={`absolute top-1 left-1 text-[8px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm ${
                            item.source === 'AI_GENERATED' ? 'bg-blue-600/80 text-white' : 'bg-secondary/90 text-foreground'
                          }`}
                        >
                          {item.source === 'AI_GENERATED' ? 'AI' : 'Upload'}
                        </span>

                        {isSelected && (
                          <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-1.5 bg-card/80 flex-1 flex flex-col justify-center">
                        <p className="text-[10px] text-foreground font-medium truncate" title={item.prompt}>
                          {item.prompt}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
                      const hasVideo = isVideoUrl(post.mediaUrl || post.mediaUrls?.[0]);

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
                            <p className="text-[9px] text-muted-foreground italic line-clamp-2 leading-tight break-words min-w-0">
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
            const hasVideo = isVideoUrl(post.mediaUrl || post.mediaUrls?.[0]);

            return (
              <Card key={post.id} className="border-border bg-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-border/80 transition-all">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-border shrink-0 bg-muted">
                    {hasVideo ? (
                      <div className="relative w-full h-full flex items-center justify-center bg-black/40">
                        <video src={post.mediaUrl || post.mediaUrls?.[0]} className="w-full h-full object-cover" muted />
                        <span className="absolute bottom-1 right-1 bg-black/80 text-[7px] px-1 py-0.5 rounded text-white font-bold">
                          VIDEO
                        </span>
                      </div>
                    ) : (
                      <img
                        src={post.mediaUrl || post.mediaUrls?.[0]}
                        alt="Post Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                    <p className="text-xs text-foreground font-medium line-clamp-2 break-words min-w-0">{post.caption || post.content}</p>
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
