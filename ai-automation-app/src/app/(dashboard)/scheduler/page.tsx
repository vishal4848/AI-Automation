'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  Pencil,
  Zap,
  RefreshCw,
  Play,
  Copy,
  Eye,
  SlidersHorizontal,
  Info,
  Layers,
  ArrowRight,
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
  const [postMode, setPostMode] = useState<'schedule' | 'now'>('schedule');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);
  const [previewMediaItem, setPreviewMediaItem] = useState<MediaItem | null>(null);
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

  // Edit post state
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editScheduledDate, setEditScheduledDate] = useState('');
  const [editAccountId, setEditAccountId] = useState('');
  const [editMediaUrl, setEditMediaUrl] = useState('');
  const [isEditingSubmitting, setIsEditingSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [currentDate, setCurrentDate] = useState(new Date());

  // Robust array extractor from BFF / API responses
  const extractArray = (d: any): any[] => {
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (Array.isArray(d.data)) return d.data;
    if (d.data && typeof d.data === 'object') {
      if (Array.isArray(d.data.images)) return d.data.images;
      if (Array.isArray(d.data.videos)) return d.data.videos;
      if (Array.isArray(d.data.assets)) return d.data.assets;
      if (Array.isArray(d.data.posts)) return d.data.posts;
      if (Array.isArray(d.data.accounts)) return d.data.accounts;
      if (Array.isArray(d.data.data)) return d.data.data;
      if (Array.isArray(d.data.items)) return d.data.items;
    }
    if (Array.isArray(d.images)) return d.images;
    if (Array.isArray(d.videos)) return d.videos;
    if (Array.isArray(d.assets)) return d.assets;
    if (Array.isArray(d.posts)) return d.posts;
    if (Array.isArray(d.accounts)) return d.accounts;
    if (Array.isArray(d.items)) return d.items;
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

  // Load media items from images, videos, and assets APIs
  const loadMedia = useCallback(() => {
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

        const formattedImages: MediaItem[] = rawImgs
          .filter((img: any) => Boolean(img.secureUrl || img.url))
          .map((img: any) => ({
            id: img.id,
            url: img.secureUrl || img.url,
            prompt: img.prompt || 'AI Generated Image',
            source: 'AI_GENERATED',
            resourceType: 'image',
            createdAt: img.createdAt,
            provider: img.provider || 'AI Provider',
            model: img.model || 'FLUX Schnell',
          }));

        const formattedVideos: MediaItem[] = rawVids
          .filter((vid: any) => Boolean(vid.secureUrl || vid.url))
          .map((vid: any) => ({
            id: vid.id,
            url: vid.secureUrl || vid.url,
            prompt: vid.prompt || 'AI Generated Video',
            source: 'AI_GENERATED',
            resourceType: 'video',
            createdAt: vid.createdAt,
            provider: vid.provider || 'Replicate',
            model: vid.model || 'WAN 2.1',
          }));

        const formattedAssets: MediaItem[] = rawAssets
          .filter((asset: any) => Boolean(asset.secureUrl || asset.url))
          .map((asset: any) => {
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
        return combined;
      })
      .then((combined) => {
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

  // Initial data loading
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

    // 3. Load media assets
    loadMedia();
  }, [loadMedia]);

  // Counts for media categories
  const mediaCounts = useMemo(() => {
    let images = 0;
    let videos = 0;
    let uploads = 0;
    mediaItems.forEach((m) => {
      if (m.source === 'UPLOAD') {
        uploads++;
      } else if (m.resourceType === 'video') {
        videos++;
      } else {
        images++;
      }
    });
    return {
      all: mediaItems.length,
      images,
      videos,
      uploads,
    };
  }, [mediaItems]);

  // Quick preset helper
  const applyPreset = (type: '1h' | '3h' | 'tonight' | 'tomorrow_morning' | 'tomorrow_evening') => {
    const d = new Date();
    if (type === '1h') {
      d.setHours(d.getHours() + 1);
    } else if (type === '3h') {
      d.setHours(d.getHours() + 3);
    } else if (type === 'tonight') {
      d.setHours(20, 0, 0, 0);
      if (d.getTime() <= Date.now()) {
        d.setDate(d.getDate() + 1);
      }
    } else if (type === 'tomorrow_morning') {
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
    } else if (type === 'tomorrow_evening') {
      d.setDate(d.getDate() + 1);
      d.setHours(18, 0, 0, 0);
    }
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setScheduledDate(localIso);
    setPostMode('schedule');
  };

  // Human readable preview of scheduled time
  const formattedScheduledPreview = useMemo(() => {
    try {
      const d = new Date(scheduledDate);
      if (isNaN(d.getTime())) return 'Invalid date';
      return d.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return scheduledDate;
    }
  }, [scheduledDate]);

  // Platform visual badges & colors
  const getPlatformBadge = (platform?: string) => {
    const p = (platform || '').toLowerCase();
    if (p === 'linkedin') {
      return {
        name: 'LinkedIn',
        cardActive: 'bg-[#0A66C2]/10 border-[#0A66C2]/70 shadow-sm ring-1 ring-[#0A66C2]/40',
        badgeBg: 'bg-[#0A66C2] text-white',
        dotBg: 'bg-[#0A66C2]',
        icon: (
          <span className="font-black text-[10px] tracking-tighter w-4 h-4 rounded bg-[#0A66C2] text-white flex items-center justify-center shrink-0">
            in
          </span>
        ),
      };
    }
    if (p === 'facebook') {
      return {
        name: 'Facebook',
        cardActive: 'bg-[#1877F2]/10 border-[#1877F2]/70 shadow-sm ring-1 ring-[#1877F2]/40',
        badgeBg: 'bg-[#1877F2] text-white',
        dotBg: 'bg-[#1877F2]',
        icon: (
          <span className="font-black text-[10px] w-4 h-4 rounded bg-[#1877F2] text-white flex items-center justify-center shrink-0">
            f
          </span>
        ),
      };
    }
    if (p === 'instagram') {
      return {
        name: 'Instagram',
        cardActive: 'bg-pink-500/10 border-pink-500/70 shadow-sm ring-1 ring-pink-500/40',
        badgeBg: 'bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white',
        dotBg: 'bg-pink-500',
        icon: (
          <span className="w-4 h-4 rounded bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white flex items-center justify-center text-[8px] font-bold shrink-0">
            IG
          </span>
        ),
      };
    }
    return {
      name: platform || 'Social Account',
      cardActive: 'bg-blue-500/10 border-blue-500/70 shadow-sm ring-1 ring-blue-500/40',
      badgeBg: 'bg-secondary text-foreground',
      dotBg: 'bg-blue-500',
      icon: <Share2 className="w-3.5 h-3.5 shrink-0" />,
    };
  };

  // Filtered media items for direct gallery & picker modal
  const filteredMedia = useMemo(() => {
    return mediaItems.filter((item) => {
      const q = mediaSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.prompt.toLowerCase().includes(q) ||
        (item.model && item.model.toLowerCase().includes(q)) ||
        (item.provider && item.provider.toLowerCase().includes(q));
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
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'PROCESSING' } : p)));
      const res = await fetch(`/api/scheduler/posts/${id}/publish`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data) {
        const updated = data.data;
        setPosts((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  ...updated,
                  status: updated.status || 'PUBLISHED',
                  publishedAt: updated.publishedAt || new Date().toISOString(),
                }
              : p
          )
        );
      } else {
        setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'FAILED' } : p)));
        alert(data.error || 'Failed to publish post');
      }
    } catch {
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'FAILED' } : p)));
      alert('Failed to publish post');
    }
  };

  const handleCancelPost = async (id: string) => {
    try {
      const res = await fetch(`/api/scheduler/posts/${id}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'CANCELLED' } : p)));
      } else {
        alert(data.error || 'Failed to cancel');
      }
    } catch {
      alert('Failed to cancel');
    }
  };

  const handleOpenEdit = (post: any) => {
    setEditingPost(post);
    setEditCaption(post.caption || post.content || '');
    setEditAccountId(post.socialAccountId || post.socialAccount?.id || '');
    setEditMediaUrl(post.mediaUrl || post.mediaUrls?.[0] || '');
    const schedDate = post.scheduledAtUTC || post.scheduledAt || post.scheduledFor;
    if (schedDate) {
      const d = new Date(schedDate);
      if (!isNaN(d.getTime())) {
        setEditScheduledDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
      } else {
        const dDefault = new Date(Date.now() + 3600000);
        setEditScheduledDate(new Date(dDefault.getTime() - dDefault.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
      }
    } else {
      const dDefault = new Date(Date.now() + 3600000);
      setEditScheduledDate(new Date(dDefault.getTime() - dDefault.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    }
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    setEditError(null);
    setIsEditingSubmitting(true);
    try {
      let scheduledAtUTC: string | undefined;
      if (editScheduledDate) {
        const localDate = new Date(editScheduledDate);
        if (isNaN(localDate.getTime()) || localDate.getTime() <= Date.now()) {
          setEditError('Scheduled time must be in the future.');
          setIsEditingSubmitting(false);
          return;
        }
        scheduledAtUTC = localDate.toISOString();
      }

      const res = await fetch(`/api/scheduler/posts/${editingPost.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: editCaption,
          scheduledAtUTC,
          socialAccountId: editAccountId || undefined,
          mediaUrl: editMediaUrl || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const updated = data.data;
        setPosts((prev) =>
          prev.map((p) => (p.id === editingPost.id ? { ...p, ...updated } : p))
        );
        setEditingPost(null);
      } else {
        setEditError(data.error || data.message || 'Failed to update scheduled post');
      }
    } catch (err: any) {
      setEditError(err.message || 'Network error while updating post');
    } finally {
      setIsEditingSubmitting(false);
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
        <DialogContent className="sm:max-w-4xl lg:max-w-6xl w-[96vw] max-h-[92vh] flex flex-col p-0 overflow-hidden bg-card/95 border-border/80 shadow-2xl rounded-2xl md:rounded-3xl">
          {/* Header */}
          <div className="p-4 sm:p-5 px-6 border-b border-border/60 flex items-center justify-between bg-card/80 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                  <span>Create Scheduled Post</span>
                  <Badge variant="outline" className="text-[10px] px-2 py-0 border-blue-500/30 text-blue-400 bg-blue-500/10 font-semibold">
                    Multi-Platform
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Directly choose from your generated AI media library, compose captions, and publish across social networks.
                </DialogDescription>
              </div>
            </div>
          </div>

          {actionError && (
            <div className="mx-6 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center gap-2 shrink-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Form Body - Responsive 2 Columns */}
          <form
            onSubmit={(e) => handleCreatePost(e, postMode === 'now')}
            className="flex-1 min-h-0 overflow-hidden flex flex-col"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-hidden">
              {/* LEFT COLUMN: Composition, Accounts & Timing */}
              <div className="lg:col-span-5 p-5 sm:p-6 overflow-y-auto space-y-5 border-b lg:border-b-0 lg:border-r border-border/60">
                {/* 1. Target Social Accounts */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground tracking-wide flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-blue-500" />
                      <span>Target Accounts</span>
                      {usableAccounts.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-secondary font-medium text-muted-foreground">
                          {selectedAccountIds.length}/{usableAccounts.length}
                        </span>
                      )}
                    </label>
                    {usableAccounts.length > 0 && (
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        className="text-[11px] text-blue-500 hover:text-blue-600 font-semibold transition-colors"
                      >
                        {isAllSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>

                  {usableAccounts.length === 0 ? (
                    <div className="p-3.5 bg-secondary/30 rounded-xl border border-border text-center text-xs text-muted-foreground space-y-1">
                      <p className="font-semibold text-foreground">No connected social accounts found</p>
                      <p className="text-[11px]">Connect Instagram, Facebook, or LinkedIn in Settings to publish posts.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {usableAccounts.map((acc) => {
                        const isSelected = selectedAccountIds.includes(acc.id);
                        const badge = getPlatformBadge(acc.platform);
                        const displayName = acc.username || acc.accountName || acc.id;

                        return (
                          <div
                            key={acc.id}
                            onClick={() => handleToggleAccount(acc.id)}
                            className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all text-xs select-none ${
                              isSelected
                                ? badge.cardActive
                                : 'bg-secondary/20 border-border/60 text-muted-foreground hover:bg-secondary/40'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                                  isSelected
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'border-border bg-card'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              {badge.icon}
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-foreground truncate text-xs">{displayName}</div>
                                <div className="text-[10px] text-muted-foreground leading-none">{badge.name}</div>
                              </div>
                            </div>

                            <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Connected
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Selected Media Snapshot */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground tracking-wide flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                      <span>Chosen Media</span>
                    </label>
                    {selectedAsset && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAsset(null);
                          setMediaUrl('');
                        }}
                        className="text-[11px] text-destructive hover:text-destructive/80 font-medium transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {selectedAsset ? (
                    <div className="p-3 bg-secondary/30 rounded-xl border border-blue-500/40 relative group overflow-hidden">
                      <div className="flex items-start gap-3">
                        <div
                          onClick={() => setPreviewMediaItem(selectedAsset)}
                          className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted border border-border shrink-0 cursor-pointer group/thumb shadow-sm"
                        >
                          {selectedAsset.resourceType === 'video' || isVideoUrl(selectedAsset.url) ? (
                            <div className="relative w-full h-full flex items-center justify-center bg-black/50">
                              <video src={selectedAsset.url} className="w-full h-full object-cover" muted />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover/thumb:bg-black/10 transition-colors">
                                <Play className="w-5 h-5 text-white fill-white" />
                              </div>
                              <span className="absolute bottom-1 right-1 bg-black/80 text-[7px] px-1 py-0.2 rounded text-white font-bold flex items-center gap-0.5">
                                VIDEO
                              </span>
                            </div>
                          ) : (
                            <img
                              src={selectedAsset.url}
                              alt="Selected Asset"
                              className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1.5 py-0 font-bold ${
                                selectedAsset.source === 'AI_GENERATED'
                                  ? 'border-blue-500/30 text-blue-400 bg-blue-500/10'
                                  : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                              }`}
                            >
                              {selectedAsset.source === 'AI_GENERATED'
                                ? selectedAsset.resourceType === 'video'
                                  ? 'AI Video'
                                  : 'AI Image'
                                : 'Uploaded File'}
                            </Badge>
                            {selectedAsset.model && (
                              <span className="text-[10px] text-muted-foreground font-medium truncate">
                                {selectedAsset.model}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-foreground font-medium line-clamp-2 leading-snug" title={selectedAsset.prompt}>
                            {selectedAsset.prompt || 'Generated Media Asset'}
                          </p>

                          <div className="pt-1 flex items-center gap-2">
                            {selectedAsset.prompt && (
                              <button
                                type="button"
                                onClick={() => setCaption(selectedAsset.prompt)}
                                className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
                              >
                                <Sparkles className="w-3 h-3" />
                                Fill as Caption
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setPreviewMediaItem(selectedAsset)}
                              className="text-[10px] text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              Preview
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-secondary/20 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-1 py-4">
                      <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <ImageIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-foreground text-xs">No media selected yet</span>
                      <span className="text-[11px] text-muted-foreground">
                        Click any image or video in the Content Library on the right 👉
                      </span>
                    </div>
                  )}
                </div>

                {/* 3. Caption & Hashtags */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground tracking-wide flex items-center gap-1.5">
                      <span>Caption & Hashtags</span>
                    </label>
                    <span className="text-[10px] text-muted-foreground">
                      {caption.length} / 2,200 chars
                    </span>
                  </div>

                  <Textarea
                    placeholder="Write your post caption, hooks, and hashtags here..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={4}
                    className="bg-secondary/30 border-border/80 rounded-xl text-xs resize-none focus:border-blue-500 leading-relaxed font-sans"
                  />

                  {/* Quick Hashtag & Action Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {['#AI', '#Innovation', '#Marketing', '#Business', '#Growth'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setCaption((prev) => (prev ? `${prev} ${tag}` : tag))}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/60 font-medium transition-all"
                      >
                        {tag}
                      </button>
                    ))}
                    {caption && (
                      <button
                        type="button"
                        onClick={() => setCaption('')}
                        className="text-[10px] px-2 py-0.5 rounded-lg text-muted-foreground hover:text-destructive font-medium transition-colors ml-auto"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* 4. Scheduling & Timing */}
                <div className="space-y-3 pt-1 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground tracking-wide flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>Publication Mode</span>
                    </label>

                    {/* Mode Toggle */}
                    <div className="flex items-center bg-secondary/60 p-0.5 rounded-xl border border-border/60">
                      <button
                        type="button"
                        onClick={() => setPostMode('schedule')}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                          postMode === 'schedule'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Schedule
                      </button>
                      <button
                        type="button"
                        onClick={() => setPostMode('now')}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                          postMode === 'now'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Post Now
                      </button>
                    </div>
                  </div>

                  {postMode === 'schedule' ? (
                    <div className="space-y-2.5">
                      {/* Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-muted-foreground font-medium">Quick presets:</span>
                        <button
                          type="button"
                          onClick={() => applyPreset('1h')}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/50 border border-border text-foreground hover:bg-secondary transition-colors"
                        >
                          +1 Hour
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset('3h')}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/50 border border-border text-foreground hover:bg-secondary transition-colors"
                        >
                          +3 Hours
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset('tonight')}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/50 border border-border text-foreground hover:bg-secondary transition-colors"
                        >
                          Tonight 8 PM
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset('tomorrow_morning')}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/50 border border-border text-foreground hover:bg-secondary transition-colors"
                        >
                          Tomorrow 9 AM
                        </button>
                      </div>

                      <div className="relative">
                        <Input
                          type="datetime-local"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="bg-secondary/40 border-border/80 rounded-xl text-xs font-mono"
                          required={postMode === 'schedule'}
                        />
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-secondary/20 p-2 rounded-lg border border-border/40">
                        <CalendarIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>Will publish: <strong className="text-foreground">{formattedScheduledPreview}</strong></span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                      <Zap className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>Post will be published immediately to all selected accounts upon clicking <strong>Post Now</strong>.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Direct Media Gallery (AI Images & Videos) */}
              <div className="lg:col-span-7 p-5 sm:p-6 overflow-y-auto flex flex-col space-y-3.5 bg-secondary/10">
                {/* Header & Refresh */}
                <div className="flex items-center justify-between gap-2 shrink-0">
                  <div>
                    <h3 className="text-xs font-bold text-foreground tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Content Library (AI Images & Videos)</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                        {mediaItems.length}
                      </span>
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Click any generated image or video below to attach it to your post.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadMedia}
                    disabled={isLoadingMedia}
                    className="h-7 text-xs rounded-lg gap-1 border-border/80 text-foreground"
                    title="Refresh AI Media"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingMedia ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </div>

                {/* Search Bar & Category Filter Pills */}
                <div className="space-y-2 shrink-0">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      placeholder="Search generated assets by prompt, model, or keywords..."
                      value={mediaSearch}
                      onChange={(e) => setMediaSearch(e.target.value)}
                      className="pl-8 h-8 bg-card border-border/80 rounded-xl text-xs"
                    />
                    {mediaSearch && (
                      <button
                        type="button"
                        onClick={() => setMediaSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {[
                      { key: 'All', label: `All (${mediaCounts.all})` },
                      { key: 'Images', label: `✨ AI Images (${mediaCounts.images})` },
                      { key: 'Videos', label: `🎥 AI Videos (${mediaCounts.videos})` },
                      { key: 'Uploaded', label: `📁 Uploads (${mediaCounts.uploads})` },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setMediaFilter(tab.key as any)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all whitespace-nowrap ${
                          mediaFilter === tab.key
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-card border border-border/70 text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visual Media Grid */}
                <div className="flex-1 min-h-[300px] overflow-y-auto pr-1">
                  {isLoadingMedia ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                      <span className="text-xs font-medium">Loading your AI generated media library...</span>
                    </div>
                  ) : mediaError ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-2 text-destructive text-center p-4">
                      <AlertCircle className="w-6 h-6" />
                      <span className="text-xs font-semibold">{mediaError}</span>
                      <Button type="button" variant="outline" size="sm" onClick={loadMedia} className="mt-2 text-xs">
                        Try Again
                      </Button>
                    </div>
                  ) : filteredMedia.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground text-center p-6 bg-card/40 rounded-2xl border border-dashed border-border">
                      <ImageIcon className="w-8 h-8 opacity-40 text-blue-400" />
                      <span className="text-xs font-semibold text-foreground">No media found in this filter</span>
                      <span className="text-[11px] max-w-xs text-muted-foreground">
                        {mediaSearch
                          ? 'No media matches your search query. Try clearing search.'
                          : 'You can generate new AI images or videos in the AI Image / Video studio.'}
                      </span>
                      {mediaSearch && (
                        <Button type="button" variant="outline" size="sm" onClick={() => setMediaSearch('')} className="mt-2 text-xs">
                          Clear Search
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pb-2">
                      {filteredMedia.map((item) => {
                        const isSelected = selectedAsset?.id === item.id || mediaUrl === item.url;
                        const isVid = item.resourceType === 'video' || isVideoUrl(item.url);

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSelectedAsset(item);
                              setMediaUrl(item.url);
                              if (!caption && item.prompt) {
                                setCaption(item.prompt);
                              }
                            }}
                            className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all flex flex-col bg-card hover:border-blue-500/70 hover:shadow-md ${
                              isSelected
                                ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg shadow-blue-500/20'
                                : 'border-border/70 hover:scale-[1.01]'
                            }`}
                          >
                            {/* Media Preview Box */}
                            <div className="relative aspect-square w-full overflow-hidden bg-muted">
                              {isVid ? (
                                <div className="relative w-full h-full flex items-center justify-center bg-black/40">
                                  <video src={item.url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                                    <div className="w-7 h-7 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white">
                                      <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                                    </div>
                                  </div>
                                  <span className="absolute bottom-1 right-1 bg-black/80 text-[7px] px-1 py-0.2 rounded text-white font-bold flex items-center gap-0.5">
                                    <Video className="w-2 h-2" /> VIDEO
                                  </span>
                                </div>
                              ) : (
                                <img
                                  src={item.url}
                                  alt={item.prompt}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                />
                              )}

                              {/* Source Badge */}
                              <span
                                className={`absolute top-1 left-1 text-[8px] font-bold px-1.5 py-0.2 rounded backdrop-blur-md shadow-sm ${
                                  item.source === 'AI_GENERATED'
                                    ? 'bg-blue-600/90 text-white'
                                    : 'bg-emerald-600/90 text-white'
                                }`}
                              >
                                {item.source === 'AI_GENERATED' ? 'AI' : 'Upload'}
                              </span>

                              {/* Fullscreen Eye Button on Hover */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewMediaItem(item);
                                }}
                                className="absolute top-1 right-1 w-6 h-6 rounded-md bg-black/70 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Preview Full Size"
                              >
                                <Eye className="w-3 h-3" />
                              </button>

                              {/* Selected Checkmark Overlay */}
                              {isSelected && (
                                <div className="absolute inset-0 bg-blue-600/25 flex items-center justify-center pointer-events-none">
                                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg ring-2 ring-white animate-in zoom-in-75">
                                    <Check className="w-4 h-4 stroke-[3]" />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Card Footer Info */}
                            <div className="p-2 bg-card flex-1 flex flex-col justify-between gap-1 border-t border-border/40">
                              <p className="text-[10px] text-foreground font-semibold line-clamp-1" title={item.prompt}>
                                {item.prompt || 'Generated Media'}
                              </p>
                              <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                                <span className="truncate">{item.model || 'FLUX'}</span>
                                {isSelected ? (
                                  <span className="text-blue-500 font-bold shrink-0">Selected</span>
                                ) : (
                                  <span className="text-muted-foreground/70 group-hover:text-blue-500 transition-colors shrink-0">Click to pick</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Direct / Custom URL Accordion */}
                <div className="pt-2 border-t border-border/40 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
                    className="text-[11px] text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>{showCustomUrlInput ? 'Hide' : 'Or paste a direct custom media URL'}</span>
                    <ChevronRight className={`w-3 h-3 transition-transform ${showCustomUrlInput ? 'rotate-90' : ''}`} />
                  </button>

                  {showCustomUrlInput && (
                    <div className="mt-2 space-y-1">
                      <Input
                        type="text"
                        value={mediaUrl}
                        onChange={(e) => {
                          setMediaUrl(e.target.value);
                          if (e.target.value) {
                            setSelectedAsset({
                              id: `custom-${Date.now()}`,
                              url: e.target.value,
                              prompt: caption || 'Custom URL Media',
                              source: 'UPLOAD',
                              resourceType: isVideoUrl(e.target.value) ? 'video' : 'image',
                            });
                          }
                        }}
                        placeholder="https://res.cloudinary.com/... or public media URL"
                        className="bg-card border-border rounded-xl text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Provide any direct public link or Cloudinary asset link to publish directly.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Dialog Action Footer */}
            <div className="p-4 px-6 border-t border-border/60 bg-card/95 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-muted-foreground flex items-center gap-2 min-w-0">
                {selectedAccountIds.length > 0 && (selectedAsset || mediaUrl) ? (
                  <div className="flex items-center gap-1.5 text-emerald-500 font-medium truncate">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>
                      Ready to publish {selectedAsset?.resourceType === 'video' ? 'video' : 'post'} to{' '}
                      <strong className="text-foreground">{selectedAccountIds.length}</strong> account(s)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-amber-500 font-medium truncate">
                    <Info className="w-4 h-4 shrink-0 text-amber-500" />
                    <span>Select at least 1 social account and 1 media asset to proceed.</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-xl text-xs h-9 px-4"
                >
                  Cancel
                </Button>

                {postMode === 'schedule' ? (
                  <>
                    <Button
                      type="button"
                      onClick={(e) => handleCreatePost(e as any, true)}
                      disabled={isSubmitting || selectedAccountIds.length === 0 || (!selectedAsset && !mediaUrl)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold h-9 px-4 gap-1.5"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          <span>Post Now</span>
                        </>
                      )}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || selectedAccountIds.length === 0 || (!selectedAsset && !mediaUrl)}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold h-9 px-5 gap-1.5 shadow-md shadow-blue-500/20"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <CalendarIcon className="w-3.5 h-3.5" />
                          <span>Schedule Post</span>
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting || selectedAccountIds.length === 0 || (!selectedAsset && !mediaUrl)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold h-9 px-5 gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>Publish Immediately</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Media Lightbox Dialog */}
      <Dialog open={!!previewMediaItem} onOpenChange={(open) => !open && setPreviewMediaItem(null)}>
        <DialogContent className="sm:max-w-2xl bg-card border-border rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          {previewMediaItem && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">Media Preview</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {previewMediaItem.source === 'AI_GENERATED' ? 'AI Generated Asset' : 'Uploaded File'}
                  </DialogDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  {previewMediaItem.resourceType === 'video' ? 'Video' : 'Image'}
                </Badge>
              </div>

              {/* Player or Image */}
              <div className="relative rounded-xl overflow-hidden bg-black/80 border border-border flex items-center justify-center max-h-[60vh]">
                {previewMediaItem.resourceType === 'video' || isVideoUrl(previewMediaItem.url) ? (
                  <video src={previewMediaItem.url} controls autoPlay className="w-full max-h-[60vh] object-contain" />
                ) : (
                  <img src={previewMediaItem.url} alt="Full preview" className="w-full max-h-[60vh] object-contain" />
                )}
              </div>

              {previewMediaItem.prompt && (
                <div className="p-3 bg-secondary/40 rounded-xl border border-border text-xs space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Prompt / Description</div>
                  <p className="text-foreground leading-relaxed">{previewMediaItem.prompt}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setPreviewMediaItem(null)} className="rounded-xl text-xs">
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedAsset(previewMediaItem);
                    setMediaUrl(previewMediaItem.url);
                    if (!caption && previewMediaItem.prompt) {
                      setCaption(previewMediaItem.prompt);
                    }
                    setPreviewMediaItem(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Attach to Post</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Scheduled Post Dialog */}
      <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
        <DialogContent className="sm:max-w-xl bg-card border-border rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Scheduled Post</DialogTitle>
            <DialogDescription>Update your post caption, scheduled publishing time, account, or media.</DialogDescription>
          </DialogHeader>

          {editError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">Caption</label>
              <Textarea
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                placeholder="Write your post caption..."
                rows={4}
                className="bg-secondary/40 border-border rounded-xl text-xs resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">Scheduled Date & Time</label>
                <Input
                  type="datetime-local"
                  value={editScheduledDate}
                  onChange={(e) => setEditScheduledDate(e.target.value)}
                  className="bg-secondary/40 border-border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">Social Account</label>
                <select
                  value={editAccountId}
                  onChange={(e) => setEditAccountId(e.target.value)}
                  className="w-full h-9 rounded-xl border border-border bg-secondary/40 px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Keep current account</option>
                  {usableAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.platform} — {acc.username || acc.accountName || acc.id}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">Media URL</label>
              <Input
                type="text"
                value={editMediaUrl}
                onChange={(e) => setEditMediaUrl(e.target.value)}
                placeholder="https://..."
                className="bg-secondary/40 border-border rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditingPost(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isEditingSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                {isEditingSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
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
                                onClick={(e) => { e.stopPropagation(); handleOpenEdit(post); }}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-foreground hover:bg-secondary/80 font-semibold transition-colors flex items-center gap-0.5"
                                title="Edit Scheduled Post"
                              >
                                <Pencil className="w-2.5 h-2.5" />
                                Edit
                              </button>
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
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(post)} className="rounded-xl text-foreground hover:bg-secondary flex items-center gap-1">
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Button>
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
