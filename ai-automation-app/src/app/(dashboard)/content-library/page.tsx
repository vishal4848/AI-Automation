'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Grid, 
  List, 
  Download, 
  Trash2, 
  Heart, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  Sparkles, 
  Calendar, 
  Loader2, 
  AlertCircle, 
  Check,
  X,
  ExternalLink,
  Eye,
  Upload,
  Layers
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function ContentLibraryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<
    'All' | 'AI Generated' | 'Uploaded' | 'Images' | 'Videos' | 'Favorites'
  >('All');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('All');
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch projects list for filter dropdown
  const { data: projectsData } = useQuery({
    queryKey: ['workspace-projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) return [];
      const json = await res.json();
      return json.projects || json.data?.projects || [];
    },
    staleTime: 5000,
  });

  const projects: any[] = Array.isArray(projectsData) ? projectsData : [];

  // Fetch real AI generated images
  const { data: imagesData, isLoading: isLoadingImages, isError: isErrorImages, refetch: refetchImages } = useQuery({
    queryKey: ['content-library-images'],
    queryFn: async () => {
      const res = await fetch('/api/images?limit=100');
      if (!res.ok) return [];
      const json = await res.json();
      return json.images || json.data?.images || [];
    },
    staleTime: 5000,
  });

  // Fetch real uploaded assets from device
  const { data: assetsData, isLoading: isLoadingAssets, isError: isErrorAssets, refetch: refetchAssets } = useQuery({
    queryKey: ['content-library-assets'],
    queryFn: async () => {
      const res = await fetch('/api/assets?limit=100');
      if (!res.ok) return [];
      const json = await res.json();
      return json.assets || json.data?.assets || [];
    },
    staleTime: 5000,
  });

  const rawImages: any[] = Array.isArray(imagesData) ? imagesData : [];
  const rawAssets: any[] = Array.isArray(assetsData) ? assetsData : [];

  // Combine both sources seamlessly
  const allContent = useMemo(() => {
    const formattedImages = rawImages.map((img) => ({
      ...img,
      source: 'AI_GENERATED',
      resourceType: 'image',
      displayName: img.prompt || 'AI Generated Image',
    }));

    const formattedAssets = rawAssets.map((asset) => ({
      ...asset,
      source: 'UPLOAD',
      resourceType: asset.resourceType || (/\.(mp4|mov|webm)$/i.test(asset.fileName || '') ? 'video' : 'image'),
      displayName: asset.fileName || asset.originalName || 'Uploaded Media',
      prompt: asset.fileName || asset.originalName || 'Uploaded Media',
      model: asset.resourceType === 'video' ? 'Video Upload' : 'Image Upload',
    }));

    const merged = [...formattedImages, ...formattedAssets];
    return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [rawImages, rawAssets]);

  // Filter & Search Logic
  const filteredContent = useMemo(() => {
    return allContent.filter((item) => {
      // Project filter match
      if (selectedProjectFilter !== 'All') {
        if (selectedProjectFilter === 'no-project' && item.projectId) return false;
        if (selectedProjectFilter !== 'no-project' && item.projectId !== selectedProjectFilter) return false;
      }

      // Search query match
      const query = searchQuery.toLowerCase().trim();
      const nameMatch = item.displayName ? item.displayName.toLowerCase().includes(query) : false;
      const promptMatch = item.prompt ? item.prompt.toLowerCase().includes(query) : false;
      const modelMatch = item.model ? item.model.toLowerCase().includes(query) : false;
      const matchesSearch = !query || nameMatch || promptMatch || modelMatch;

      if (!matchesSearch) return false;

      // Category filter match
      if (activeFilter === 'All') return true;
      if (activeFilter === 'AI Generated') return item.source === 'AI_GENERATED';
      if (activeFilter === 'Uploaded') return item.source === 'UPLOAD';
      if (activeFilter === 'Images') return item.resourceType === 'image';
      if (activeFilter === 'Videos') return item.resourceType === 'video';
      if (activeFilter === 'Favorites') return Boolean(item.isFavorite);

      return true;
    });
  }, [allContent, searchQuery, activeFilter, selectedProjectFilter]);

  // Download Handler
  const handleDownload = async (url: string, name?: string) => {
    try {
      if (!url) return;
      if (url.startsWith('data:') || url.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = url;
        link.download = name || `media-${Date.now()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      const response = await fetch(url, { mode: 'cors' });
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = name || `media-${Date.now()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        return;
      }

      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = name || `media-${Date.now()}`;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(url, '_blank');
    }
  };

  // Favorite Handler (for AI images)
  const handleToggleFavorite = async (item: any) => {
    if (item.source !== 'AI_GENERATED') return;
    const nextFavState = !item.isFavorite;

    // Optimistically update React Query cache
    queryClient.setQueryData(['content-library-images'], (old: any[]) => {
      if (!Array.isArray(old)) return [];
      return old.map((img) => (img.id === item.id ? { ...img, isFavorite: nextFavState } : img));
    });

    try {
      if (item.id && !item.id.startsWith('img-')) {
        await fetch(`/api/images/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isFavorite: nextFavState }),
        });
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      refetchImages();
    }
  };

  // Schedule Post Handler
  const handleSchedule = (item: any) => {
    const url = item.secureUrl || item.url;
    const itemPrompt = item.displayName || item.prompt || 'Shared from AI Automation';
    router.push(`/scheduler?mediaUrl=${encodeURIComponent(url)}&caption=${encodeURIComponent(itemPrompt)}&autoOpen=true`);
  };

  // Delete Handler with in-use protection
  const handleConfirmDelete = async () => {
    if (!itemToDelete || isDeleting) return;
    setIsDeleting(true);

    try {
      const { id, source } = itemToDelete;

      if (source === 'UPLOAD') {
        const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
        const resData = await res.json().catch(() => ({}));
        if (!res.ok || (resData.success === false && resData.error)) {
          throw new Error(resData.error || 'This media is currently being used by a scheduled post and cannot be deleted.');
        }

        queryClient.setQueryData(['content-library-assets'], (old: any[]) => {
          if (!Array.isArray(old)) return [];
          return old.filter((asset) => asset.id !== id);
        });
        queryClient.invalidateQueries({ queryKey: ['content-library-assets'] });
      } else {
        if (id && !id.startsWith('img-')) {
          const res = await fetch(`/api/images/${id}`, { method: 'DELETE' });
          const resData = await res.json().catch(() => ({}));
          if (!res.ok && !resData.deleted && !resData.success) {
            throw new Error(resData.error || resData.message || 'Failed to delete image from server.');
          }
        }

        queryClient.setQueryData(['content-library-images'], (old: any[]) => {
          if (!Array.isArray(old)) return [];
          return old.filter((img) => img.id !== id);
        });
        queryClient.invalidateQueries({ queryKey: ['content-library-images'] });
      }

      setItemToDelete(null);
      setNotification({ type: 'success', text: 'Media deleted from Content Library.' });
      setTimeout(() => setNotification(null), 3500);
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Failed to delete media.' });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'Recently';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return 'Recently';
    }
  };

  const isLoading = isLoadingImages || isLoadingAssets;
  const isError = isErrorImages && isErrorAssets;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 h-full flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-8 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-950/90 text-rose-300 border-rose-500/30'
            }`}
          >
            {notification.type === 'success' ? <Check className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
            <span className="text-sm font-medium">{notification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Content Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse, manage, and schedule your real AI-generated and uploaded media assets.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
          {/* Search Input */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets..." 
              className="w-full pl-9 pr-4 py-2 bg-secondary/50 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Project Filter */}
          {projects.length > 0 && (
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all max-w-[140px] truncate"
            >
              <option value="All">All Projects</option>
              <option value="no-project">No Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  📁 {p.name}
                </option>
              ))}
            </select>
          )}

          {/* View Switcher */}
          <div className="flex bg-secondary/50 p-1 rounded-xl border border-border">
            <button 
              onClick={() => setView('grid')}
              className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setView('list')}
              className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href="/upload"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary/80 border border-border text-foreground text-xs font-semibold hover:bg-secondary transition-all shadow-sm"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Upload</span>
            </Link>
            <Link
              href="/ai-image"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate AI</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 pb-2 border-b border-border overflow-x-auto">
        {(['All', 'AI Generated', 'Uploaded', 'Images', 'Videos', 'Favorites'] as const).map((filter) => {
          const count = filter === 'All' 
            ? allContent.length 
            : filter === 'AI Generated'
            ? allContent.filter(i => i.source === 'AI_GENERATED').length
            : filter === 'Uploaded'
            ? allContent.filter(i => i.source === 'UPLOAD').length
            : filter === 'Images'
            ? allContent.filter(i => i.resourceType === 'image').length
            : filter === 'Videos'
            ? allContent.filter(i => i.resourceType === 'video').length
            : filter === 'Favorites' 
            ? allContent.filter(i => i.isFavorite).length 
            : 0;

          return (
            <button 
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeFilter === filter 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <span>{filter}</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${activeFilter === filter ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-secondary/30 animate-pulse border border-border/40" />
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-3" />
          <h3 className="text-lg font-semibold text-foreground">Failed to load content</h3>
          <p className="text-sm text-muted-foreground mb-4">There was an issue fetching your media library.</p>
          <button 
            onClick={() => { refetchImages(); refetchAssets(); }}
            className="px-4 py-2 bg-secondary rounded-xl text-sm font-medium hover:bg-secondary/80 text-foreground transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredContent.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-border/60 bg-card/20 my-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
            <Layers className="w-8 h-8 opacity-80" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            {searchQuery || activeFilter !== 'All' ? 'No matching media found' : 'Your media library is empty'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
            {searchQuery || activeFilter !== 'All' 
              ? 'Try changing your search keywords or switching filter tabs.' 
              : 'Generate AI imagery or upload your own media from your device to start scheduling posts.'}
          </p>
          <div className="flex gap-3">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/80 border border-border text-foreground font-semibold text-xs hover:bg-secondary transition-all shadow-sm"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Upload from Device</span>
            </Link>
            <Link
              href="/ai-image"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate with AI</span>
            </Link>
          </div>
        </div>
      )}

      {/* Content Display: Grid or List */}
      {!isLoading && !isError && filteredContent.length > 0 && (
        <div className={`flex-1 overflow-y-auto pb-16 ${
          view === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6' 
            : 'space-y-4'
        }`}>
          {filteredContent.map((item) => {
            const isVid = item.resourceType === 'video';

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`group relative bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/40 transition-all ${
                  view === 'list' ? 'flex items-center p-3 gap-4' : 'flex flex-col'
                }`}
              >
                {/* Content Preview Box */}
                <div className={`${view === 'list' ? 'w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden' : 'aspect-square'} bg-secondary/30 relative overflow-hidden`}>
                  {isVid ? (
                    <video 
                      src={item.secureUrl || item.url} 
                      className="w-full h-full object-cover" 
                      muted 
                      playsInline
                    />
                  ) : (
                    <img 
                      src={item.secureUrl || item.url} 
                      alt={item.displayName || 'Media Item'} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy" 
                    />
                  )}

                  {/* Source Badge (Top Left) */}
                  <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-lg flex items-center gap-1.5 border border-white/10 text-[10px] text-white">
                    {item.source === 'UPLOAD' ? (
                      <>
                        <Upload className="w-3 h-3 text-cyan-400" />
                        <span className="font-bold text-cyan-300">Uploaded</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span className="font-bold text-purple-300">AI Generated</span>
                      </>
                    )}
                  </div>

                  {/* Video Indicator (Top Right) */}
                  {isVid && (
                    <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md p-1.5 rounded-lg border border-white/10 text-pink-400">
                      <Video className="w-3 h-3" />
                    </div>
                  )}

                  {/* Favorite Badge (for AI Images) */}
                  {item.isFavorite && (
                    <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md p-1.5 rounded-lg border border-white/10 text-rose-400">
                      <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    </div>
                  )}

                  {/* Hover Actions Overlay (Grid View) */}
                  {view === 'grid' && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2.5 p-2">
                      <button 
                        onClick={() => setPreviewItem(item)}
                        className="p-2.5 bg-white/20 hover:bg-white text-white hover:text-black rounded-full backdrop-blur-sm transition-all transform hover:scale-110"
                        title="Preview"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => handleSchedule(item)}
                        className="p-2.5 bg-white/20 hover:bg-cyan-500 text-white rounded-full backdrop-blur-sm transition-all transform hover:scale-110"
                        title="Schedule Post"
                      >
                        <Calendar size={16} />
                      </button>
                      <button 
                        onClick={() => handleDownload(item.secureUrl || item.url, item.displayName)}
                        className="p-2.5 bg-white/20 hover:bg-white text-white hover:text-blue-600 rounded-full backdrop-blur-sm transition-all transform hover:scale-110"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      <button 
                        onClick={() => setItemToDelete(item)}
                        className="p-2.5 bg-white/20 hover:bg-destructive text-white rounded-full backdrop-blur-sm transition-all transform hover:scale-110"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Content Details Footer */}
                <div className={`p-3.5 flex-1 flex flex-col justify-between ${view === 'list' ? 'p-0' : ''}`}>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] text-muted-foreground font-mono truncate">
                        {item.resourceType === 'video' ? 'Video' : 'Image'} • {formatDate(item.createdAt)}
                      </span>
                      {item.source === 'AI_GENERATED' && (
                        <button
                          onClick={() => handleToggleFavorite(item)}
                          className={`text-xs p-0.5 rounded transition-colors ${item.isFavorite ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-400'}`}
                          title="Favorite"
                        >
                          <Heart className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-rose-500' : ''}`} />
                        </button>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {item.displayName}
                    </p>
                  </div>

                  {/* List View Direct Actions */}
                  {view === 'list' && (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => setPreviewItem(item)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
                        title="Preview"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleSchedule(item)}
                        className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/10"
                        title="Schedule Post"
                      >
                        <Calendar size={14} />
                      </button>
                      <button
                        onClick={() => handleDownload(item.secureUrl || item.url, item.displayName)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
            >
              {/* Media Container */}
              <div className="flex-1 bg-black flex items-center justify-center min-h-[300px] md:min-h-[500px] relative">
                {previewItem.resourceType === 'video' ? (
                  <video 
                    src={previewItem.secureUrl || previewItem.url} 
                    controls 
                    autoPlay 
                    className="max-h-[500px] w-full object-contain" 
                  />
                ) : (
                  <img
                    src={previewItem.secureUrl || previewItem.url}
                    alt={previewItem.displayName}
                    className="max-h-[500px] w-full object-contain"
                  />
                )}
                <button
                  onClick={() => setPreviewItem(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors md:hidden"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Media Info & Sidebar Actions */}
              <div className="w-full md:w-80 p-6 flex flex-col justify-between bg-card border-t md:border-t-0 md:border-l border-border space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        previewItem.source === 'UPLOAD'
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}>
                        {previewItem.source === 'UPLOAD' ? 'Uploaded from Device' : 'AI Generated'}
                      </span>
                    </div>
                    <button
                      onClick={() => setPreviewItem(null)}
                      className="hidden md:block p-1 text-muted-foreground hover:text-foreground rounded-lg"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-foreground line-clamp-3">
                      {previewItem.displayName}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Added on {formatDate(previewItem.createdAt)}
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-muted-foreground bg-secondary/30 p-3.5 rounded-xl border border-border/50">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-semibold text-foreground capitalize">{previewItem.resourceType}</span>
                    </div>
                    {previewItem.fileSize && (
                      <div className="flex justify-between">
                        <span>Size:</span>
                        <span className="font-semibold text-foreground">
                          {(previewItem.fileSize / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    )}
                    {previewItem.model && (
                      <div className="flex justify-between">
                        <span>Engine/Source:</span>
                        <span className="font-semibold text-foreground">{previewItem.model}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-border">
                  <button
                    onClick={() => {
                      const item = previewItem;
                      setPreviewItem(null);
                      handleSchedule(item);
                    }}
                    className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Calendar size={14} />
                    <span>Schedule to Social</span>
                  </button>

                  <button
                    onClick={() => handleDownload(previewItem.secureUrl || previewItem.url, previewItem.displayName)}
                    className="w-full py-2 px-4 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl text-xs font-semibold border border-border transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={14} />
                    <span>Download Media</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-destructive">
                <div className="p-3 bg-destructive/10 rounded-xl">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Delete Media?</h3>
                  <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Are you sure you want to permanently delete <strong className="text-foreground">"{itemToDelete.displayName}"</strong>?
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setItemToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs border border-border text-foreground hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all flex items-center gap-2 shadow-sm"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
