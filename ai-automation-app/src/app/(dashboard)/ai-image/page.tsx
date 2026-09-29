'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Download, 
  Heart, 
  Trash2, 
  Calendar, 
  Loader2, 
  AlertCircle, 
  Check, 
  Mic, 
  MicOff, 
  Upload, 
  X,
  Maximize2,
  Info,
  Copy,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { getAIModels } from '@/lib/api/ai-api';
import { useQueryClient } from '@tanstack/react-query';
import { downloadMedia } from '@/lib/utils';

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
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [referenceImage, setReferenceImage] = useState<string>('');
  const [isUploadingRef, setIsUploadingRef] = useState(false);
  const [isListening, setIsListening] = useState(false);
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
  
  // Full view, zoom, details & action states
  const [fullViewImage, setFullViewImage] = useState<any | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [detailsImage, setDetailsImage] = useState<any | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
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

  // ESC key handler and body scroll lock for modals
  useEffect(() => {
    if (fullViewImage || detailsImage || imageToDelete) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setFullViewImage(null);
          setDetailsImage(null);
          setImageToDelete(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [fullViewImage, detailsImage, imageToDelete]);

  const activeModel = models.find(m => m.name === selectedModel);

  // Available unique providers
  const availableProviders = Array.from(new Set(models.map(m => (m.provider || '').toLowerCase()))).filter(Boolean);

  // Filter models by selected provider
  const filteredModels = selectedProvider === 'all'
    ? models
    : models.filter(m => (m.provider || '').toLowerCase() === selectedProvider.toLowerCase());

  // Handle reference image upload
  const handleReferenceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingRef(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setReferenceImage(event.target?.result as string);
      setIsUploadingRef(false);
    };
    reader.onerror = () => setIsUploadingRef(false);
    reader.readAsDataURL(file);
  };

  // Handle image paste from clipboard
  const handlePasteImage = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            if (ev.target?.result) {
              setReferenceImage(ev.target.result as string);
            }
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  };

  // Voice recognition handler
  const handleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser.');
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

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
          referenceImage: referenceImage || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const newImgObj = {
          id: data.id || data.image?.id || `img-${Date.now()}`,
          url: data.imageUrl || data.image || data.url,
          prompt: data.prompt || data.image?.prompt || prompt,
          model: data.model || selectedModel,
          provider: data.provider || activeModel?.provider || 'Replicate',
          style: data.style || selectedStyle,
          ratio: data.ratio || selectedRatio,
          createdAt: data.createdAt || new Date().toISOString(),
          cloudinaryId: data.cloudinaryId,
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

  const handleDownloadImage = async (img: any) => {
    const url = typeof img === 'object' ? img.url : img;
    const id = typeof img === 'object' ? (img.id || img.url) : img;
    if (!url) return;
    setDownloadingId(id);
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      const isWebp = url.includes('.webp');
      const isJpg = url.includes('.jpg') || url.includes('.jpeg');
      const ext = isWebp ? 'webp' : isJpg ? 'jpg' : 'png';
      const filename = `ai-generated-${dateStr}.${ext}`;

      const success = await downloadMedia(url, filename);
      if (success) {
        setNotification({ type: 'success', text: `Downloaded ${filename}` });
        setTimeout(() => setNotification(null), 3500);
      } else {
        throw new Error('Download failed. Please try again.');
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Download failed.' });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCopyUrl = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setNotification({ type: 'success', text: 'Image URL copied' });
      setTimeout(() => {
        setCopiedId(null);
        setNotification(null);
      }, 2500);
    } catch {
      setNotification({ type: 'error', text: 'Failed to copy URL to clipboard' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleViewFullSize = (img: any) => {
    setFullViewImage(img);
    setZoomLevel(1);
  };

  const handleViewDetails = (img: any) => {
    setDetailsImage(img);
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
          resourceType: 'image',
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
          const errMsg = data.error || data.message || '';
          if (errMsg.includes('ASSET_IN_USE_BY_SCHEDULED_POST')) {
            throw new Error('This image is currently being used by an active scheduled post and cannot be deleted.');
          }
          throw new Error(errMsg || 'Failed to delete image from server.');
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

        {/* AI Provider Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">AI Provider</label>
          <select
            value={selectedProvider}
            onChange={(e) => {
              const prov = e.target.value;
              setSelectedProvider(prov);
              const filtered = prov === 'all' ? models : models.filter((m) => (m.provider || '').toLowerCase() === prov.toLowerCase());
              if (filtered.length > 0 && !filtered.some((m) => m.name === selectedModel)) {
                setSelectedModel(filtered[0].name);
              }
            }}
            className="w-full p-2.5 rounded-xl bg-[#09090b] border border-white/[0.08] text-xs text-zinc-300 focus:border-violet-500 focus:outline-none transition-all capitalize"
          >
            <option value="all">All Providers</option>
            {availableProviders.map((p) => (
              <option key={p} value={p}>
                {p === 'replicate' ? 'Replicate' : p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Model Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-300">Model</label>
            <span className="text-[11px] text-zinc-500">
              {filteredModels.length} available
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto custom-scrollbar p-0.5">
            {filteredModels.length === 0 && <div className="col-span-2 text-xs text-zinc-500 py-2">Loading models...</div>}
            {filteredModels.map((model) => (
              <button
                key={model.name}
                type="button"
                onClick={() => setSelectedModel(model.name)}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                  selectedModel === model.name
                    ? 'bg-violet-500/20 border-violet-500 text-white shadow-[0_0_12px_rgba(139,92,246,0.2)]'
                    : 'bg-[#09090b] border-white/[0.08] text-zinc-400 hover:border-white/20'
                }`}
              >
                <div className="font-semibold text-sm truncate">{model.displayName || model.name}</div>
                <div className="flex flex-col mt-1 gap-1">
                  <span className="text-[11px] opacity-70 capitalize">{model.provider}</span>
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

        {/* Reference Image Upload & Paste */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Upload size={13} className="text-violet-400" />
              <span>Reference Image</span>
              <span className="text-[10px] text-zinc-500 font-normal">Optional</span>
            </label>
            {referenceImage && (
              <button
                type="button"
                onClick={() => setReferenceImage('')}
                className="text-[10px] text-zinc-400 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <X size={12} /> Remove
              </button>
            )}
          </div>

          {referenceImage ? (
            <div className="relative w-full h-24 rounded-xl overflow-hidden border border-violet-500/40 bg-black/40 flex items-center justify-center group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={referenceImage} alt="Reference" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setReferenceImage('')}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 text-zinc-300 hover:text-white transition-opacity opacity-0 group-hover:opacity-100"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-20 border border-dashed border-white/[0.12] rounded-xl hover:border-violet-500/50 bg-[#09090b]/50 cursor-pointer transition-all group">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleReferenceImageUpload}
              />
              <div className="flex items-center gap-2 text-xs text-zinc-400 group-hover:text-violet-300">
                <Upload size={14} />
                <span>Upload from device or paste image</span>
              </div>
              <span className="text-[10px] text-zinc-500 mt-1">PNG, JPG, WebP up to 10MB</span>
            </label>
          )}

          {referenceImage && activeModel && !activeModel.capabilities?.supportsImageToImage && !activeModel.supportedInputs?.supportsReferenceImage && (
            <p className="text-[11px] text-amber-400/90 bg-amber-400/10 border border-amber-400/20 rounded-lg p-2">
              Note: &apos;{activeModel.displayName || activeModel.name}&apos; is text-to-image only. Reference image will be skipped.
            </p>
          )}
        </div>

        {/* Prompt with Voice Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-300">Prompt</label>
            <button
              type="button"
              onClick={handleVoiceInput}
              title={isListening ? 'Stop voice recording' : 'Speak prompt'}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                isListening
                  ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                  : 'bg-[#09090b] border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20'
              }`}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              <span className="text-[10px]">{isListening ? 'Listening...' : 'Voice'}</span>
            </button>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onPaste={handlePasteImage}
            placeholder="Describe what you want to see, or click Voice / paste an image..."
            className="w-full h-24 p-3 rounded-xl bg-[#09090b] border border-white/[0.08] focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all resize-none text-sm"
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
              className="w-full p-3 rounded-xl bg-[#09090b] border border-white/[0.08] focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all text-sm"
            />
          </div>
        )}

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
            {generatedImages.map((img, idx) => {
              const url = typeof img === 'object' ? img.url : img;
              const imgId = typeof img === 'object' && img.id ? img.id : `img-${idx}`;
              const isFav = favorites.has(url);
              const isDownloading = downloadingId === (img.id || url);
              const isCopied = copiedId === (img.id || url);

              return (
                <motion.div
                  key={imgId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative rounded-2xl overflow-hidden border border-white/[0.08] bg-[#121215] flex flex-col transition-all hover:border-violet-500/40 shadow-lg"
                >
                  {/* Card Header Info */}
                  <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-white/[0.06] bg-black/20 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-zinc-300 truncate max-w-[170px]" title={img.prompt || 'AI Generated Image'}>
                        {img.prompt || 'AI Generated Image'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {img.provider && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 capitalize">
                          {img.provider}
                        </span>
                      )}
                      <button
                        onClick={() => handleFavorite(img)}
                        aria-label="Favorite image"
                        title={isFav ? 'Favorited' : 'Favorite'}
                        className={`p-1 rounded-lg transition-colors ${
                          isFav ? 'text-rose-500 hover:text-rose-400' : 'text-zinc-500 hover:text-white'
                        }`}
                      >
                        <Heart size={14} className={isFav ? 'fill-current' : ''} />
                      </button>
                    </div>
                  </div>

                  {/* Image Container with click to full-size */}
                  <div
                    onClick={() => handleViewFullSize(img)}
                    className="relative aspect-square w-full overflow-hidden bg-black/40 cursor-pointer group/img"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={img.prompt || 'Generated'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="px-3 py-1.5 rounded-full bg-black/75 border border-white/20 text-white text-xs font-medium flex items-center gap-1.5 backdrop-blur-sm shadow-xl">
                        <Maximize2 size={13} />
                        <span>Click to Expand</span>
                      </span>
                    </div>
                  </div>

                  {/* Result Action Bar */}
                  <div className="p-2.5 border-t border-white/[0.06] bg-black/40 flex items-center justify-between gap-1 flex-wrap">
                    <div className="flex items-center gap-1 flex-wrap">
                      {/* Full View */}
                      <button
                        onClick={() => handleViewFullSize(img)}
                        aria-label="View image full size"
                        title="View image full size"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-medium transition-all"
                      >
                        <Maximize2 size={13} className="text-violet-400" />
                        <span className="hidden sm:inline">Full View</span>
                      </button>

                      {/* Download */}
                      <button
                        onClick={() => handleDownloadImage(img)}
                        disabled={isDownloading}
                        aria-label="Download image"
                        title="Download image"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-medium transition-all disabled:opacity-50"
                      >
                        {isDownloading ? (
                          <Loader2 size={13} className="animate-spin text-cyan-400" />
                        ) : (
                          <Download size={13} className="text-cyan-400" />
                        )}
                        <span className="hidden sm:inline">{isDownloading ? 'Saving...' : 'Download'}</span>
                      </button>

                      {/* Schedule */}
                      <button
                        onClick={() => handleSchedule(img)}
                        aria-label="Schedule image post"
                        title="Schedule image post"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 border border-violet-500/30 text-xs font-medium transition-all shadow-sm"
                      >
                        <Calendar size={13} className="text-violet-300" />
                        <span className="hidden sm:inline">Schedule</span>
                      </button>

                      {/* Details */}
                      <button
                        onClick={() => handleViewDetails(img)}
                        aria-label="View details"
                        title="View details"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-medium transition-all"
                      >
                        <Info size={13} className="text-zinc-400" />
                        <span className="hidden md:inline">Details</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Copy URL */}
                      <button
                        onClick={() => handleCopyUrl(url, img.id || url)}
                        aria-label="Copy image URL"
                        title="Copy image URL"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                      >
                        {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteClick(img)}
                        aria-label="Delete image"
                        title="Delete image"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full Screen Image Viewer Modal */}
      {fullViewImage && (
        <div
          onClick={() => setFullViewImage(null)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in select-none"
        >
          {/* Top Bar with title & controls */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 inset-x-4 max-w-5xl mx-auto flex items-center justify-between z-20"
          >
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-medium text-zinc-300 backdrop-blur-sm border border-white/10">
                {fullViewImage.model || 'AI Image'}
              </span>
              <p className="text-xs text-zinc-400 truncate max-w-sm hidden sm:block">
                {fullViewImage.prompt || 'Generated Image'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center bg-white/10 border border-white/10 rounded-xl p-1 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                  aria-label="Zoom out"
                  title="Zoom out"
                  className="p-1.5 text-zinc-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-[11px] font-mono text-zinc-300 px-2 min-w-[42px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
                  aria-label="Zoom in"
                  title="Zoom in"
                  className="p-1.5 text-zinc-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  aria-label="Reset zoom"
                  title="Reset zoom"
                  className="p-1.5 text-zinc-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-0.5"
                >
                  <RotateCcw size={14} />
                </button>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setFullViewImage(null)}
                aria-label="Close full size viewer"
                title="Close (ESC)"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Center Image Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-[95vw] max-h-[85vh] flex items-center justify-center overflow-auto custom-scrollbar p-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fullViewImage.url || fullViewImage}
              alt={fullViewImage.prompt || 'Generated'}
              style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease-out' }}
              className="max-w-[95vw] max-h-[80vh] w-auto h-auto object-contain rounded-xl shadow-2xl border border-white/10 select-none"
            />
          </div>

          {/* Bottom Quick Action Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-5 inset-x-4 max-w-md mx-auto flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-black/80 border border-white/10 backdrop-blur-md shadow-2xl z-20"
          >
            <button
              onClick={() => handleDownloadImage(fullViewImage)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-all"
            >
              <Download size={14} />
              <span>Download</span>
            </button>
            <button
              onClick={() => handleSchedule(fullViewImage)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-medium text-white transition-all shadow-md"
            >
              <Calendar size={14} />
              <span>Schedule Post</span>
            </button>
            <button
              onClick={() => handleCopyUrl(fullViewImage.url || fullViewImage, fullViewImage.id || fullViewImage.url)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-all"
            >
              <Copy size={14} />
              <span>Copy URL</span>
            </button>
            <button
              onClick={() => {
                setDetailsImage(fullViewImage);
                setFullViewImage(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-all"
            >
              <Info size={14} />
              <span>Details</span>
            </button>
          </div>
        </div>
      )}

      {/* Image Details Modal */}
      {detailsImage && (
        <div
          onClick={() => setDetailsImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#18181b] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <Info size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Image Details</h3>
                  <p className="text-xs text-zinc-400">Metadata and generation specs</p>
                </div>
              </div>
              <button
                onClick={() => setDetailsImage(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Preview Thumbnail */}
            <div className="w-full h-48 rounded-xl overflow-hidden bg-black/50 border border-white/10 flex items-center justify-center relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={detailsImage.url || detailsImage}
                alt="Preview"
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => {
                  setFullViewImage(detailsImage);
                  setDetailsImage(null);
                }}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-xs text-white transition-opacity font-medium"
              >
                <Maximize2 size={14} /> Expand Full Size
              </button>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-zinc-500">Source</span>
                <p className="font-medium text-zinc-200">AI Generated</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-zinc-500">Provider</span>
                <p className="font-medium text-zinc-200 capitalize">{detailsImage.provider || 'Replicate'}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-zinc-500">Model</span>
                <p className="font-medium text-zinc-200 truncate">{detailsImage.model || 'FLUX Schnell'}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-zinc-500">Aspect Ratio</span>
                <p className="font-medium text-zinc-200">{detailsImage.ratio || '1:1'}</p>
              </div>
              {detailsImage.style && (
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-0.5">
                  <span className="text-[10px] uppercase font-semibold text-zinc-500">Art Style</span>
                  <p className="font-medium text-zinc-200">{detailsImage.style}</p>
                </div>
              )}
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-zinc-500">Created At</span>
                <p className="font-medium text-zinc-200">
                  {detailsImage.createdAt ? new Date(detailsImage.createdAt).toLocaleDateString() : 'Recent'}
                </p>
              </div>
            </div>

            {/* Prompt block with copy button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300">Prompt</span>
                <button
                  onClick={() => {
                    if (detailsImage.prompt) {
                      navigator.clipboard.writeText(detailsImage.prompt);
                      setNotification({ type: 'success', text: 'Prompt copied to clipboard' });
                      setTimeout(() => setNotification(null), 3000);
                    }
                  }}
                  className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                >
                  <Copy size={11} /> Copy Prompt
                </button>
              </div>
              <p className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-zinc-300 leading-relaxed max-h-24 overflow-y-auto custom-scrollbar">
                {detailsImage.prompt || 'No prompt recorded'}
              </p>
            </div>

            {/* Asset ID & URL */}
            {detailsImage.id && (
              <div className="text-[11px] text-zinc-500 flex items-center justify-between pt-1">
                <span>Asset ID: <code className="text-zinc-400 font-mono">{detailsImage.id}</code></span>
              </div>
            )}

            {/* Actions in Footer */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => handleDownloadImage(detailsImage)}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors flex items-center gap-1.5"
              >
                <Download size={14} /> Download
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = detailsImage;
                  setDetailsImage(null);
                  handleSchedule(item);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors flex items-center gap-1.5 shadow-md"
              >
                <Calendar size={14} /> Schedule Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
