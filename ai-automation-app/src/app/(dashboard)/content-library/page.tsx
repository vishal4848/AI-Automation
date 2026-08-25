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
  Eye
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function ContentLibraryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Images' | 'Videos' | 'Captions' | 'Favorites'>('All');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('All');
  const [imageToDelete, setImageToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewImage, setPreviewImage] = useState<any | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch projects list for filter dropdown
  const { data: projectsData } = useQuery({
    queryKey: ['workspace-projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) return [];
      const json = await res.json();
      return json.projects || [];
    },
    staleTime: 5000,
  });

  const projects: any[] = Array.isArray(projectsData) ? projectsData : [];

  // Fetch real images from PostgreSQL through backend API
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['content-library-images'],
    queryFn: async () => {
      const res = await fetch('/api/images?limit=100');
      if (!res.ok) {
        throw new Error('Failed to load generated images');
      }
      const json = await res.json();
      return json.images || json.data?.images || [];
    },
    staleTime: 5000,
  });

  const rawImages: any[] = Array.isArray(data) ? data : [];

  // Filter & Search Logic
  const filteredContent = useMemo(() => {
    return rawImages.filter((item) => {
      // Project filter match
      if (selectedProjectFilter !== 'All') {
        if (selectedProjectFilter === 'no-project' && item.projectId) return false;
        if (selectedProjectFilter !== 'no-project' && item.projectId !== selectedProjectFilter) return false;
      }

      // Search query match
      const query = searchQuery.toLowerCase().trim();
      const promptMatch = item.prompt ? item.prompt.toLowerCase().includes(query) : false;
      const modelMatch = item.model ? item.model.toLowerCase().includes(query) : false;
      const styleMatch = item.style ? item.style.toLowerCase().includes(query) : false;
      const matchesSearch = !query || promptMatch || modelMatch || styleMatch;

      if (!matchesSearch) return false;

      // Category filter match
      if (activeFilter === 'All') return true;
      if (activeFilter === 'Images') return true; // Currently image generations
      if (activeFilter === 'Favorites') return Boolean(item.isFavorite);
      if (activeFilter === 'Videos') return item.type === 'video' || false;
      if (activeFilter === 'Captions') return item.type === 'caption' || false;

      return true;
    });
  }, [rawImages, searchQuery, activeFilter, selectedProjectFilter]);

  // Download Handler
  const handleDownload = async (url: string, prompt?: string) => {
    try {
      if (!url) return;
      if (url.startsWith('data:') || url.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = url;
        link.download = `content-${Date.now()}.png`;
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
        link.download = `content-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        return;
      }

      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = `content-${Date.now()}.png`;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(url, '_blank');
    }
  };

  // Favorite Handler
  const handleToggleFavorite = async (item: any) => {
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
      refetch();
    }
  };

  // Schedule Post Handler
  const handleSchedule = (item: any) => {
    const url = item.url;
    const itemPrompt = item.prompt || 'Generated with AI Automation';
    router.push(`/scheduler?mediaUrl=${encodeURIComponent(url)}&caption=${encodeURIComponent(itemPrompt)}&autoOpen=true`);
  };

  // Delete Handler
  const handleConfirmDelete = async () => {
    if (!imageToDelete || isDeleting) return;
    setIsDeleting(true);

    try {
      const { id } = imageToDelete;
      if (id && !id.startsWith('img-')) {
        const res = await fetch(`/api/images/${id}`, { method: 'DELETE' });
        const resData = await res.json().catch(() => ({}));
        if (!res.ok && !resData.deleted && !resData.success) {
          throw new Error(resData.error || resData.message || 'Failed to delete image from server.');
        }
      }

      // Evict from React Query cache
      queryClient.setQueryData(['content-library-images'], (old: any[]) => {
        if (!Array.isArray(old)) return [];
        return old.filter((img) => img.id !== id);
      });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });

      setImageToDelete(null);
      setNotification({ type: 'success', text: 'Image deleted from Content Library.' });
      setTimeout(() => setNotification(null), 3500);
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Failed to delete image.' });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'Recently generated';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return 'Recently generated';
    }
  };

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
            Browse, manage, and schedule your real AI-generated creative assets.
          </p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto items-center">
          {/* Search Input */}
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts or models..." 
              className="w-full pl-9 pr-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground placeholder:text-muted-foreground"
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
              className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all max-w-[150px] truncate"
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

          {/* Generate Button */}
          <Link
            href="/ai-image"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate New</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 pb-2 border-b border-border overflow-x-auto">
        {(['All', 'Images', 'Videos', 'Captions', 'Favorites'] as const).map((filter) => {
          const count = filter === 'All' 
            ? rawImages.length 
            : filter === 'Favorites' 
            ? rawImages.filter(i => i.isFavorite).length 
            : filter === 'Images' 
            ? rawImages.length 
            : 0;

          return (
            <button 
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeFilter === filter 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <span>{filter}</span>
              <span className={`text-xs px-1.5 py-0.2 rounded-full ${activeFilter === filter ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
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
          <p className="text-sm text-muted-foreground mb-4">There was an issue fetching your generated library.</p>
          <button 
            onClick={() => refetch()}
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
            <ImageIcon className="w-8 h-8 opacity-80" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            {searchQuery || activeFilter !== 'All' ? 'No matching content found' : 'No generated content yet'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
            {searchQuery || activeFilter !== 'All' 
              ? 'Try changing your search keywords or switching filter tabs.' 
              : 'Create stunning images with FLUX in Image Studio to see them appear here automatically.'}
          </p>
          <Link
            href="/ai-image"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate in Image Studio</span>
          </Link>
        </div>
      )}

      {/* Content Display: Grid or List */}
      {!isLoading && !isError && filteredContent.length > 0 && (
        <div className={`flex-1 overflow-y-auto pb-16 ${
          view === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6' 
            : 'space-y-4'
        }`}>
          {filteredContent.map((item) => (
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
                <img 
                  src={item.url} 
                  alt={item.prompt || 'Generated AI Content'} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy" 
                />

                {/* Type & Model Badge */}
                <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1.5 border border-white/10 text-[11px] text-white">
                  <ImageIcon className="w-3 h-3 text-cyan-400" />
                  <span className="font-medium truncate max-w-[90px]">{item.model || 'FLUX'}</span>
                </div>

                {/* Favorite Status Badge */}
                {item.isFavorite && (
                  <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md p-1.5 rounded-lg border border-white/10 text-rose-400">
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  </div>
                )}

                {/* Hover Actions Overlay (Grid View) */}
                {view === 'grid' && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2.5 p-2">
                    <button 
                      onClick={() => setPreviewImage(item)}
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
                      onClick={() => handleDownload(item.url, item.prompt)}
                      className="p-2.5 bg-white/20 hover:bg-white text-white hover:text-blue-600 rounded-full backdrop-blur-sm transition-all transform hover:scale-110"
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                    <button 
                      onClick={() => handleToggleFavorite(item)}
                      className="p-2.5 bg-white/20 hover:bg-white text-white hover:text-rose-500 rounded-full backdrop-blur-sm transition-all transform hover:scale-110"
                      title={item.isFavorite ? "Unfavorite" : "Favorite"}
                    >
                      <Heart size={16} className={item.isFavorite ? "fill-rose-500 text-rose-500" : ""} />
                    </button>
                    <button 
                      onClick={() => setImageToDelete(item)}
                      className="p-2.5 bg-white/20 hover:bg-destructive text-white rounded-full backdrop-blur-sm transition-all transform hover:scale-110"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Meta Info */}
              <div className={`p-3.5 ${view === 'list' ? 'flex-1 flex justify-between items-center' : ''}`}>
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-sm font-semibold text-foreground truncate" title={item.prompt}>
                    {item.prompt || 'Generated Image'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
                    {item.ratio && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono">
                        {item.ratio}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* List View Actions */}
                {view === 'list' && (
                  <div className="flex gap-2 items-center">
                    <button 
                      onClick={() => setPreviewImage(item)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                      title="Preview"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => handleSchedule(item)}
                      className="p-2 text-muted-foreground hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                      title="Schedule Post"
                    >
                      <Calendar size={16} />
                    </button>
                    <button 
                      onClick={() => handleDownload(item.url, item.prompt)}
                      className="p-2 text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                    <button 
                      onClick={() => handleToggleFavorite(item)}
                      className="p-2 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Favorite"
                    >
                      <Heart size={16} className={item.isFavorite ? "fill-rose-500 text-rose-500" : ""} />
                    </button>
                    <button 
                      onClick={() => setImageToDelete(item)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {imageToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
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
                  <h3 className="text-lg font-bold text-foreground">Delete Image</h3>
                  <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
                </div>
              </div>

              {imageToDelete.url && (
                <div className="w-full h-36 rounded-xl overflow-hidden bg-secondary relative border border-border">
                  <img src={imageToDelete.url} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this generated image from your Content Library?
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setImageToDelete(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-secondary text-foreground transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>{isDeleting ? 'Deleting...' : 'Delete Image'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border max-w-3xl w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="relative aspect-auto max-h-[70vh] bg-black flex items-center justify-center overflow-hidden">
                <img src={previewImage.url} alt={previewImage.prompt} className="max-h-[70vh] w-auto object-contain" />
                <button 
                  onClick={() => setPreviewImage(null)}
                  className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card">
                <div className="space-y-1">
                  <p className="text-base font-bold text-foreground">{previewImage.prompt || 'Generated Image'}</p>
                  <p className="text-xs text-muted-foreground">Model: {previewImage.model || 'FLUX'} • Created: {formatDate(previewImage.createdAt)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleSchedule(previewImage)}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Calendar size={14} /> Schedule
                  </button>
                  <button 
                    onClick={() => handleDownload(previewImage.url, previewImage.prompt)}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow-sm"
                  >
                    <Download size={14} /> Download
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
