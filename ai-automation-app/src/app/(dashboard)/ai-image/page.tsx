'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Image as ImageIcon, Download, Heart, Trash2, Calendar, Loader2, AlertCircle, Check } from 'lucide-react';
import { getAIModels } from '@/lib/api/ai-api';
import { useQueryClient } from '@tanstack/react-query';

const STYLES = ['Photorealistic', 'Cyberpunk', '3D Render', 'Anime', 'Digital Art', 'Fantasy'];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1', icon: '■' },
  { id: '16:9', label: '16:9', icon: '▬' },
  { id: '9:16', label: '9:16', icon: '▮' },
  { id: '4:3', label: '4:3', icon: '▭' },
];

export default function AIImageStudio() {
  const router = useRouter();
  const [models, setModels] = useState<any[]>([]);
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Photorealistic');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [steps, setSteps] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState('');
  const [imageToDelete, setImageToDelete] = useState<{ id?: string; url: string; prompt?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    async function loadModels() {
      try {
        const res = await fetch('/api/ai/models?category=IMAGE');
        const data = await res.json();
        if (data.success && data.models?.length > 0) {
          setModels(data.models);
          setSelectedModel(data.models[0].name);
        }
      } catch (err) {
        console.error('Failed to load models:', err);
      }
    }

    async function loadProjects() {
      try {
        const res = await fetch('/api/projects');
        const data = await res.json();
        const list = data.projects || [];
        if (Array.isArray(list)) {
          setProjects(list);
          const activeSaved = localStorage.getItem('ai_automation_active_project_id');
          if (activeSaved && list.some((p: any) => p.id === activeSaved)) {
            setSelectedProjectId(activeSaved);
          } else if (list.length > 0) {
            setSelectedProjectId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
      }
    }

    async function loadRecentImages() {
      try {
        const res = await fetch('/api/images?limit=20');
        const data = await res.json();
        const list = data.images || data.data?.images || [];
        if (Array.isArray(list) && list.length > 0) {
          setGeneratedImages(list);
        }
      } catch (err) {
        console.error('Failed to load recent images:', err);
      }
    }

    loadModels();
    loadProjects();
    loadRecentImages();
  }, []);

  const activeModel = models.find(m => m.name === selectedModel);

  const handleGenerate = async () => {
    if (!prompt || !selectedModel) return;
    setIsGenerating(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          negativePrompt,
          model: selectedModel,
          provider: activeModel?.provider,
          style: selectedStyle,
          ratio: selectedRatio,
          steps,
          projectId: selectedProjectId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const newImgObj = {
          id: data.image?.id || data.id || `img-${Date.now()}`,
          url: data.image?.url || data.imageUrl || data.image || data.url,
          prompt: data.image?.prompt || data.prompt || prompt,
        };
        if (newImgObj.url) {
          setGeneratedImages(prev => [newImgObj, ...prev]);
          queryClient.invalidateQueries({ queryKey: ['analytics'] });
          queryClient.invalidateQueries({ queryKey: ['content-library-images'] });
          queryClient.invalidateQueries({ queryKey: ['workspace-projects'] });
        }
      } else {
        setErrorMsg(data.error || 'Failed to generate image. Please try again.');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Error generating image.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (url: string) => {
    try {
      if (!url) return;
      if (url.startsWith('data:') || url.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = url;
        link.download = `generated-image-${Date.now()}.png`;
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
        link.download = `generated-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        return;
      }
      // Fallback
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = `generated-image-${Date.now()}.png`;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleFavorite = async (img: any) => {
    const url = typeof img === 'object' ? img.url : img;
    const id = typeof img === 'object' ? img.id : undefined;
    const isCurrentlyFav = favorites.has(url);
    setFavorites(prev => {
      const next = new Set(prev);
      if (isCurrentlyFav) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });

    if (id && !id.startsWith('img-')) {
      try {
        await fetch(`/api/images/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isFavorite: !isCurrentlyFav }),
        });
      } catch (err) {
        console.error('Failed to sync favorite:', err);
      }
    }
  };

  const handleSchedule = (img: any) => {
    const url = typeof img === 'object' ? img.url : img;
    const imgPrompt = (typeof img === 'object' ? img.prompt : '') || prompt || 'Generated with AI Automation';
    const id = typeof img === 'object' ? img.id : undefined;

    try {
      sessionStorage.setItem(
        'scheduler_prefill',
        JSON.stringify({
          mediaUrl: url,
          caption: imgPrompt,
          imageId: id,
        }),
      );
    } catch {}

    const isShortHttp = url && !url.startsWith('data:') && url.length < 500;
    let targetUrl = `/scheduler?autoOpen=true`;
    if (id) {
      targetUrl += `&imageId=${encodeURIComponent(id)}`;
    }
    if (isShortHttp) {
      targetUrl += `&mediaUrl=${encodeURIComponent(url)}&caption=${encodeURIComponent(imgPrompt)}`;
    }
    router.push(targetUrl);
  };

  const handleDeleteClick = (img: any) => {
    const id = typeof img === 'object' ? img.id : undefined;
    const url = typeof img === 'object' ? img.url : img;
    const imgPrompt = typeof img === 'object' ? img.prompt : prompt;
    setImageToDelete({ id, url, prompt: imgPrompt });
  };

  const handleConfirmDelete = async () => {
    if (!imageToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      const { id, url } = imageToDelete;
      if (id && !id.startsWith('img-')) {
        const res = await fetch(`/api/images/${id}`, { method: 'DELETE' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok && !data.deleted && !data.success) {
          throw new Error(data.error || data.message || 'Failed to delete image from server.');
        }
      }

      setGeneratedImages(prev => prev.filter(item => {
        const itemUrl = typeof item === 'object' ? item.url : item;
        const itemId = typeof item === 'object' ? item.id : undefined;
        if (id && itemId) return itemId !== id;
        return itemUrl !== url;
      }));

      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['content-library-images'] });
      setImageToDelete(null);
      setNotification({ type: 'success', text: 'Image deleted successfully.' });
      setTimeout(() => setNotification(null), 3500);
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Failed to delete image.' });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)] text-zinc-100 relative">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium border backdrop-blur-md animate-in slide-in-from-bottom-5 ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300 shadow-emerald-950/50'
              : 'bg-red-950/90 border-red-500/30 text-red-300 shadow-red-950/50'
          }`}
        >
          {notification.type === 'success' ? <Check size={18} className="text-emerald-400" /> : <AlertCircle size={18} className="text-red-400" />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Confirmation Dialog */}
      {imageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Delete this image?</h3>
                <p className="text-xs text-zinc-400">This action cannot be undone.</p>
              </div>
            </div>

            {imageToDelete.url && (
              <div className="w-full h-36 rounded-xl overflow-hidden bg-black/40 border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageToDelete.url} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setImageToDelete(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Panel - Controls */}
      <div className="w-full lg:w-[380px] flex flex-col gap-6 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 text-white">
            <Sparkles size={24} />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-cyan-500">
            Image Studio
          </h1>
        </div>

        {/* Workspace Project Selector */}
        {projects.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300">Save to Project</label>
              <span className="text-[10px] text-zinc-500">Optional</span>
            </div>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                if (e.target.value) {
                  localStorage.setItem('ai_automation_active_project_id', e.target.value);
                }
              }}
              className="w-full p-2.5 rounded-xl bg-[#09090b] border border-white/[0.08] text-xs text-zinc-300 focus:border-violet-500 focus:outline-none transition-all"
            >
              <option value="">No Project (General Library)</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  📁 {proj.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to see..."
            className="w-full h-24 p-3 rounded-xl bg-[#09090b] border border-white/[0.08] focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all resize-none"
          />
        </div>

        {activeModel?.supportsNegativePrompt && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Negative Prompt</label>
            <input
              type="text"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="Things to avoid..."
              className="w-full p-3 rounded-xl bg-[#09090b] border border-white/[0.08] focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all"
            />
          </div>
        )}

        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-300">Model</label>
          <div className="grid grid-cols-2 gap-3">
            {models.length === 0 && <div className="col-span-2 text-xs text-zinc-500 py-2">Loading models...</div>}
            {models.map((model) => (
              <button
                key={model.name}
                onClick={() => setSelectedModel(model.name)}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                  selectedModel === model.name
                    ? 'bg-violet-500/20 border-violet-500 text-white'
                    : 'bg-[#09090b] border-white/[0.08] text-zinc-400 hover:border-white/20'
                }`}
              >
                <div className="font-semibold text-sm">{model.displayName || model.name}</div>
                <div className="flex flex-col mt-1 gap-1">
                  <span className="text-xs opacity-70 capitalize">{model.provider}</span>
                  {model.pricingType && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit ${
                      model.pricingType === 'FREE_TIER' || model.pricingType === 'FREE TIER' ? 'bg-green-500/20 text-green-400' :
                      model.pricingType === 'LOCAL' ? 'bg-cyan-500/20 text-cyan-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {model.pricingType === 'FREE_TIER' ? 'FREE TIER' : model.pricingType}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-300">Art Style</label>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((style) => (
              <button
                key={style}
                onClick={() => setSelectedStyle(style)}
                className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                  selectedStyle === style
                    ? 'bg-gradient-to-r from-violet-500 to-cyan-500 text-white'
                    : 'bg-[#09090b] border border-white/[0.08] text-zinc-400 hover:text-white'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-300">Aspect Ratio</label>
          <div className="flex gap-2">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.id}
                onClick={() => setSelectedRatio(ratio.id)}
                className={`flex-1 py-2 rounded-xl flex flex-col items-center justify-center border transition-all ${
                  selectedRatio === ratio.id
                    ? 'bg-violet-500/20 border-violet-500 text-violet-400'
                    : 'bg-[#09090b] border-white/[0.08] text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span className="text-lg leading-none">{ratio.icon}</span>
                <span className="text-xs mt-1">{ratio.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-zinc-300">Steps</label>
            <span className="text-xs text-zinc-400">{steps}</span>
          </div>
          <input
            type="range"
            min="20"
            max="50"
            value={steps}
            onChange={(e) => setSteps(Number(e.target.value))}
            className="w-full accent-violet-500"
          />
        </div>

        <div className="mt-auto pt-4 border-t border-white/[0.08]">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={!prompt || isGenerating || !selectedModel}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-semibold transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
          >
            {isGenerating ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={20} />
                <span>Generating...</span>
              </div>
            ) : (
              <span>Generate Image</span>
            )}
            {!isGenerating && (
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            )}
          </button>
          <div className="text-center text-xs text-zinc-500 mt-3">
            {activeModel ? (
              activeModel.isFree ? 'Free generation' : `Costs ${activeModel.creditsPerGeneration || activeModel.pricePerGeneration} credits per image`
            ) : 'Select a model to view costs'}
          </div>
        </div>
      </div>

      {/* Right Panel - Gallery */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
        {isGenerating && (
          <div className="w-full h-64 rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6 flex flex-col items-center justify-center">
            <div className="w-full max-w-md space-y-4">
              <div className="flex items-center justify-between text-violet-400 font-medium">
                <span className="animate-pulse">Generating your masterpiece...</span>
                <Sparkles size={18} className="animate-spin-slow" />
              </div>
              <div className="h-2 w-full bg-[#09090b] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 animate-pulse w-full origin-left scale-x-100 transition-transform duration-1000"></div>
              </div>
            </div>
          </div>
        )}

        {generatedImages.length === 0 && !isGenerating ? (
          <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.01]">
            <ImageIcon size={64} className="text-zinc-600 mb-4" />
            <h3 className="text-xl font-semibold text-zinc-400 mb-2">No images yet</h3>
            <p className="text-zinc-500 max-w-sm text-center text-sm">
              Enter a prompt on the left and click generate to create beautiful AI art. Try &quot;A futuristic city at sunset, cyberpunk style&quot;
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedImages.map((img, idx) => {
              const url = typeof img === 'object' ? img.url : img;
              return (
                <motion.div
                  key={typeof img === 'object' && img.id ? img.id : idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.03] aspect-square"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Generated" className="w-full h-full object-cover" />

                  {/* Top-Right Quick Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(img);
                    }}
                    aria-label="Delete image"
                    title="Delete image"
                    className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-black/60 hover:bg-red-500 text-white/80 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10 shadow-md backdrop-blur-sm"
                  >
                    <Trash2 size={16} />
                  </button>

                  {/* Center Hover Action Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                    <button onClick={() => handleDownload(url)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors" title="Download Image">
                      <Download size={20} />
                    </button>
                    <button onClick={() => handleFavorite(img)} className={`p-3 rounded-full transition-colors ${favorites.has(url) ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-white/10 hover:bg-white/20 text-white'}`} title={favorites.has(url) ? 'Favorited' : 'Favorite'}>
                      <Heart size={20} className={favorites.has(url) ? 'fill-current' : ''} />
                    </button>
                    <button onClick={() => handleSchedule(img)} className="p-3 bg-violet-600 hover:bg-violet-500 rounded-full text-white transition-colors shadow-lg" title="Schedule Post">
                      <Calendar size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(img)}
                      className="p-3 bg-white/10 hover:bg-red-500/80 rounded-full text-white transition-colors"
                      aria-label="Delete image"
                      title="Delete image"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
