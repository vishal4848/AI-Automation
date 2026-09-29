'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Film, 
  Download, 
  Share2, 
  Loader2, 
  PlayCircle, 
  AlertCircle, 
  Mic, 
  MicOff, 
  Upload, 
  X,
  Maximize2,
  Calendar,
  Info,
  Copy,
  Trash2,
  Check,
  Play,
  RotateCcw
} from 'lucide-react';
import { getAIModels } from '@/lib/api/ai-api';
import { useQueryClient } from '@tanstack/react-query';
import { downloadMedia } from '@/lib/utils';

const STYLES = ['Cinematic', 'Animation', 'Documentary', '3D Render', 'Retro', 'VFX'];
const DEFAULT_DURATIONS = [
  { val: 3, label: '3s' },
  { val: 5, label: '5s' },
  { val: 8, label: '8s' },
  { val: 15, label: '15s' },
];

export default function AIVideoStudio() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [models, setModels] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [inputImage, setInputImage] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [style, setStyle] = useState('Cinematic');
  const [duration, setDuration] = useState(5);
  const [resolution, setResolution] = useState('720p');
  const [motionIntensity, setMotionIntensity] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);

  // Active generated video & recent generation history
  const [activeVideo, setActiveVideo] = useState<any | null>(null);
  const [recentVideos, setRecentVideos] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Modals & Action States
  const [fullViewVideo, setFullViewVideo] = useState<any | null>(null);
  const [detailsVideo, setDetailsVideo] = useState<any | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadModels() {
      try {
        const res = await fetch('/api/ai/models?category=VIDEO');
        const data = await res.json();
        if (data.success && data.models?.length > 0) {
          setModels(data.models);
          setSelectedModel(data.models[0].name);
        }
      } catch (err) {
        console.error('Failed to load video models:', err);
      }
    }

    async function loadRecentVideos() {
      try {
        const res = await fetch('/api/videos?limit=10');
        const data = await res.json();
        const list = data.videos || data.data?.videos || [];
        if (Array.isArray(list) && list.length > 0) {
          setRecentVideos(list);
          setActiveVideo((prev: any) => prev || list[0]);
        }
      } catch (err) {
        console.error('Failed to load recent videos:', err);
      }
    }

    loadModels();
    loadRecentVideos();
  }, []);

  // Modal ESC key listener and scroll lock
  useEffect(() => {
    if (fullViewVideo || detailsVideo || videoToDelete) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setFullViewVideo(null);
          setDetailsVideo(null);
          setVideoToDelete(null);
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
  }, [fullViewVideo, detailsVideo, videoToDelete]);

  const activeModel = models.find(m => m.name === selectedModel);

  // Available unique video providers
  const availableProviders = Array.from(new Set(models.map(m => (m.provider || '').toLowerCase()))).filter(Boolean);

  // Filtered models by selected provider
  const filteredModels = selectedProvider === 'all'
    ? models
    : models.filter(m => (m.provider || '').toLowerCase() === selectedProvider.toLowerCase());

  // Check if model supports reference image / image-to-video
  const supportsImageToVideo =
    Boolean(activeModel?.capabilities?.supportsImageToVideo) ||
    Boolean(activeModel?.supportedInputs?.supportsReferenceImage);

  // Handle reference image upload
  const handleReferenceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setInputImage(event.target?.result as string);
      setIsUploadingImage(false);
    };
    reader.onerror = () => setIsUploadingImage(false);
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
              setInputImage(ev.target.result as string);
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
      const res = await fetch('/api/ai/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style,
          duration,
          resolution,
          motionIntensity,
          model: selectedModel,
          provider: activeModel?.provider,
          inputImage: inputImage || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.video || data.videoUrl) {
          const finalUrl = data.video || data.videoUrl;
          const newVidObj = {
            id: data.id || `vid-${Date.now()}`,
            url: finalUrl,
            secureUrl: finalUrl,
            prompt: data.prompt || prompt,
            model: data.model || selectedModel,
            provider: data.provider || activeModel?.provider || 'replicate',
            duration,
            resolution,
            style,
            createdAt: new Date().toISOString(),
          };
          setActiveVideo(newVidObj);
          setRecentVideos(prev => [newVidObj, ...prev.filter(v => v.id !== newVidObj.id)]);
          queryClient.invalidateQueries({ queryKey: ['analytics'] });
          queryClient.invalidateQueries({ queryKey: ['content-library-videos'] });
          setIsGenerating(false);
          setNotification({ type: 'success', text: 'Video generated successfully!' });
          setTimeout(() => setNotification(null), 3500);
          return;
        }

        // If processing asynchronously, poll for completion
        if (data.id && data.status === 'PROCESSING') {
          const videoId = data.id;
          let attempts = 0;
          const maxAttempts = 60; // 60 * 4s = 240s
          const interval = setInterval(async () => {
            attempts++;
            try {
              const statusRes = await fetch(`/api/videos/${videoId}/status`);
              if (statusRes.ok) {
                const statusData = await statusRes.json();
                if (statusData.status === 'COMPLETED' && (statusData.url || statusData.secureUrl)) {
                  clearInterval(interval);
                  const finalUrl = statusData.url || statusData.secureUrl;
                  const newVidObj = {
                    id: statusData.id || videoId,
                    url: finalUrl,
                    secureUrl: finalUrl,
                    prompt: statusData.prompt || prompt,
                    model: statusData.model || selectedModel,
                    provider: statusData.provider || activeModel?.provider || 'replicate',
                    duration: statusData.duration || duration,
                    resolution,
                    style,
                    createdAt: statusData.createdAt || new Date().toISOString(),
                  };
                  setActiveVideo(newVidObj);
                  setRecentVideos(prev => [newVidObj, ...prev.filter(v => v.id !== newVidObj.id)]);
                  queryClient.invalidateQueries({ queryKey: ['analytics'] });
                  queryClient.invalidateQueries({ queryKey: ['content-library-videos'] });
                  setIsGenerating(false);
                  setNotification({ type: 'success', text: 'Video generated successfully!' });
                  setTimeout(() => setNotification(null), 3500);
                  return;
                }
                if (statusData.status === 'FAILED') {
                  clearInterval(interval);
                  setErrorMsg('Video generation failed.');
                  setIsGenerating(false);
                  return;
                }
              }
            } catch (pollErr) {
              console.warn('Polling error:', pollErr);
            }

            if (attempts >= maxAttempts) {
              clearInterval(interval);
              setErrorMsg('Video generation timed out. Please check Content Library shortly.');
              setIsGenerating(false);
            }
          }, 4000);
          return;
        }
      } else {
        setErrorMsg(data.error || 'Failed to generate video.');
        setIsGenerating(false);
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Error generating video.');
      setIsGenerating(false);
    }
  };

  const handleDownloadVideo = async (video: any) => {
    const url = typeof video === 'object' ? (video.secureUrl || video.url) : video;
    const id = typeof video === 'object' ? (video.id || video.url) : video;
    if (!url) return;
    setDownloadingId(id);
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      const isWebm = url.includes('.webm');
      const isMov = url.includes('.mov');
      const ext = isWebm ? 'webm' : isMov ? 'mov' : 'mp4';
      const filename = `ai-generated-video-${dateStr}.${ext}`;

      const success = await downloadMedia(url, filename);
      if (success) {
        setNotification({ type: 'success', text: `Downloaded ${filename}` });
        setTimeout(() => setNotification(null), 3500);
      } else {
        throw new Error('Could not download video file.');
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
      setNotification({ type: 'success', text: 'Video URL copied' });
      setTimeout(() => {
        setCopiedId(null);
        setNotification(null);
      }, 2500);
    } catch {
      setNotification({ type: 'error', text: 'Failed to copy URL to clipboard' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleViewFullSize = (video: any) => {
    setFullViewVideo(video);
  };

  const handleViewDetails = (video: any) => {
    setDetailsVideo(video);
  };

  const handleSchedule = (video: any) => {
    const url = typeof video === 'object' ? (video.secureUrl || video.url) : video;
    const videoPrompt = (typeof video === 'object' ? video.prompt : '') || prompt || 'Generated with AI Automation';
    const id = typeof video === 'object' ? video.id : undefined;

    try {
      sessionStorage.setItem(
        'scheduler_prefill',
        JSON.stringify({
          mediaUrl: url,
          caption: videoPrompt,
          videoId: id,
          resourceType: 'video',
        }),
      );
    } catch {}

    const isShortHttp = url && !url.startsWith('data:') && url.length < 500;
    let targetUrl = `/scheduler?autoOpen=true`;
    if (id) {
      targetUrl += `&videoId=${encodeURIComponent(id)}`;
    }
    if (isShortHttp) {
      targetUrl += `&mediaUrl=${encodeURIComponent(url)}&caption=${encodeURIComponent(videoPrompt)}`;
    }
    router.push(targetUrl);
  };

  const handleDeleteClick = (video: any) => {
    setVideoToDelete(video);
  };

  const handleConfirmDelete = async () => {
    if (!videoToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      const id = videoToDelete.id;
      const url = videoToDelete.secureUrl || videoToDelete.url;

      if (id && !id.startsWith('vid-') && !id.startsWith('temp-')) {
        const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok && !data.deleted && !data.success) {
          const errMsg = data.error || data.message || '';
          if (errMsg.includes('ASSET_IN_USE_BY_SCHEDULED_POST')) {
            throw new Error('This video is currently being used by an active scheduled post and cannot be deleted.');
          }
          throw new Error(errMsg || 'Failed to delete video from server.');
        }
      }

      setRecentVideos(prev => prev.filter(item => {
        const itemUrl = item.secureUrl || item.url;
        if (id && item.id) return item.id !== id;
        return itemUrl !== url;
      }));

      if (activeVideo && (activeVideo.id === id || (activeVideo.secureUrl || activeVideo.url) === url)) {
        setActiveVideo((prev: any) => {
          const remaining = recentVideos.filter(item => item.id !== id);
          return remaining.length > 0 ? remaining[0] : null;
        });
      }

      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['content-library-videos'] });
      setVideoToDelete(null);
      setNotification({ type: 'success', text: 'Video deleted successfully.' });
      setTimeout(() => setNotification(null), 3500);
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Failed to delete video.' });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsDeleting(false);
    }
  };


  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)] text-zinc-100">
      {/* Left Panel */}
      <div className="w-full lg:w-[380px] flex flex-col gap-6 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 text-white">
            <Film size={24} />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-cyan-500">
            Video Studio
          </h1>
        </div>

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
            className="w-full p-2.5 rounded-xl bg-[#09090b] border border-white/[0.08] text-xs text-zinc-300 focus:border-cyan-500 focus:outline-none transition-all capitalize"
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
            <span className="text-[11px] text-zinc-500">{filteredModels.length} available</span>
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
                    ? 'bg-cyan-500/20 border-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'bg-[#09090b] border-white/[0.08] text-zinc-400 hover:border-white/20'
                }`}
              >
                <div className="font-semibold text-sm truncate">{model.displayName || model.name}</div>
                <div className="flex flex-col mt-1 gap-1">
                  <span className="text-[11px] opacity-70 capitalize">{model.provider}</span>
                  {model.pricingType && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit ${
                      model.pricingType === 'FREE TIER' || model.pricingType === 'FREE_TIER' ? 'bg-green-500/20 text-green-400' :
                      model.pricingType === 'LOCAL' ? 'bg-cyan-500/20 text-cyan-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {model.pricingType}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Reference Image / Start Frame (for Image-to-Video models) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Upload size={13} className="text-cyan-400" />
              <span>Start Frame / Reference Image</span>
              <span className="text-[10px] text-zinc-500 font-normal">Optional</span>
            </label>
            {inputImage && (
              <button
                type="button"
                onClick={() => setInputImage('')}
                className="text-[10px] text-zinc-400 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <X size={12} /> Remove
              </button>
            )}
          </div>

          {inputImage ? (
            <div className="relative w-full h-24 rounded-xl overflow-hidden border border-cyan-500/40 bg-black/40 flex items-center justify-center group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={inputImage} alt="Reference frame" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setInputImage('')}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 text-zinc-300 hover:text-white transition-opacity opacity-0 group-hover:opacity-100"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-20 border border-dashed border-white/[0.12] rounded-xl hover:border-cyan-500/50 bg-[#09090b]/50 cursor-pointer transition-all group">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleReferenceImageUpload}
              />
              <div className="flex items-center gap-2 text-xs text-zinc-400 group-hover:text-cyan-300">
                <Upload size={14} />
                <span>Upload starting frame or paste image</span>
              </div>
              <span className="text-[10px] text-zinc-500 mt-1">Image-to-Video models will animate this image</span>
            </label>
          )}

          {inputImage && activeModel && !supportsImageToVideo && (
            <p className="text-[11px] text-amber-400/90 bg-amber-400/10 border border-amber-400/20 rounded-lg p-2">
              Note: &apos;{activeModel.displayName || activeModel.name}&apos; is text-to-video only. Starting frame will be skipped.
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
            placeholder="Describe the motion and scene, or speak prompt / paste image..."
            className="w-full h-28 p-3 rounded-xl bg-[#09090b] border border-white/[0.08] focus:border-cyan-500 focus:outline-none transition-all resize-none text-sm"
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-300">Style</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full p-3 rounded-xl bg-[#09090b] border border-white/[0.08] focus:border-cyan-500 focus:outline-none text-zinc-300 text-sm"
          >
            {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-300">Duration</label>
          <div className="grid grid-cols-4 gap-2">
            {(activeModel?.supportedInputs?.durations || [3, 5, 8, 10]).map((d: number) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={`py-2 rounded-xl border text-sm font-medium transition-all ${
                  duration === d
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                    : 'bg-[#09090b] border-white/[0.08] text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-300">Resolution</label>
          <div className="flex gap-2">
            {(activeModel?.supportedInputs?.resolutions || ['480p', '720p', '1080p']).map((r: string) => (
              <button
                key={r}
                type="button"
                onClick={() => setResolution(r)}
                className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                  resolution === r
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                    : 'bg-[#09090b] border-white/[0.08] text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>


        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-zinc-300">Motion Intensity</label>
            <span className="text-xs text-zinc-400">{motionIntensity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={motionIntensity}
            onChange={(e) => setMotionIntensity(Number(e.target.value))}
            className="w-full accent-cyan-500"
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
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-semibold transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
          >
            {isGenerating ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={20} />
                <span>Processing...</span>
              </div>
            ) : (
              <span>Generate Video</span>
            )}
          </button>
          <div className="text-center text-xs text-zinc-500 mt-3 flex flex-col gap-1">
            <span>Video generation takes 30-120 seconds.</span>
            <span>
              {activeModel ? (
                activeModel.isFree ? 'Free generation' : `Costs ${activeModel.creditsPerGeneration || activeModel.pricePerGeneration} credits`
              ) : 'Select a model to view costs'}
            </span>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
        {isGenerating ? (
          <div className="flex-1 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
            <Film size={64} className="text-cyan-500 mb-6 animate-pulse" />
            <h3 className="text-2xl font-semibold text-zinc-200 mb-2">Rendering Video</h3>
            <p className="text-zinc-500 mb-8 max-w-md">Our AI is computing complex motion and scene structures. This usually takes a minute.</p>
            <div className="w-full max-w-md h-2 bg-[#09090b] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 animate-[pulse_2s_ease-in-out_infinite] w-full"></div>
            </div>
          </div>
        ) : activeVideo ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-white/[0.08] bg-[#121215] flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Active Video Header Info */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.06] bg-black/20 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1 rounded bg-cyan-500/10 text-cyan-400">
                  <Film size={14} />
                </div>
                <span className="font-semibold text-zinc-200 truncate max-w-sm" title={activeVideo.prompt}>
                  {activeVideo.prompt || 'Generated Video'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {activeVideo.duration && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300">
                    {activeVideo.duration}s
                  </span>
                )}
                {activeVideo.resolution && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300">
                    {activeVideo.resolution}
                  </span>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 capitalize">
                  {activeVideo.provider || 'Replicate'}
                </span>
              </div>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video rounded-none overflow-hidden bg-black flex items-center justify-center">
              <video 
                key={activeVideo.secureUrl || activeVideo.url}
                src={activeVideo.secureUrl || activeVideo.url} 
                controls 
                autoPlay 
                loop 
                className="w-full h-full object-contain"
              />
            </div>

            {/* Action Bar */}
            <div className="p-3 border-t border-white/[0.06] bg-black/40 flex items-center justify-between gap-1 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Full View */}
                <button
                  type="button"
                  onClick={() => handleViewFullSize(activeVideo)}
                  aria-label="View video full size"
                  title="View video full size"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-medium transition-all"
                >
                  <Maximize2 size={14} className="text-cyan-400" />
                  <span>Full View</span>
                </button>

                {/* Download */}
                <button
                  type="button"
                  onClick={() => handleDownloadVideo(activeVideo)}
                  disabled={downloadingId === (activeVideo.id || activeVideo.url)}
                  aria-label="Download video"
                  title="Download video"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-medium transition-all disabled:opacity-50"
                >
                  {downloadingId === (activeVideo.id || activeVideo.url) ? (
                    <Loader2 size={14} className="animate-spin text-cyan-400" />
                  ) : (
                    <Download size={14} className="text-cyan-400" />
                  )}
                  <span>{downloadingId === (activeVideo.id || activeVideo.url) ? 'Saving...' : 'Download'}</span>
                </button>

                {/* Schedule */}
                <button
                  type="button"
                  onClick={() => handleSchedule(activeVideo)}
                  aria-label="Schedule video post"
                  title="Schedule video post"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/30 text-xs font-medium transition-all shadow-sm"
                >
                  <Calendar size={14} className="text-cyan-300" />
                  <span>Schedule</span>
                </button>

                {/* Details */}
                <button
                  type="button"
                  onClick={() => handleViewDetails(activeVideo)}
                  aria-label="View details"
                  title="View details"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-medium transition-all"
                >
                  <Info size={14} className="text-zinc-400" />
                  <span>Details</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                {/* Copy URL */}
                <button
                  type="button"
                  onClick={() => handleCopyUrl(activeVideo.secureUrl || activeVideo.url, activeVideo.id || activeVideo.url)}
                  aria-label="Copy video URL"
                  title="Copy video URL"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                >
                  {copiedId === (activeVideo.id || activeVideo.url) ? (
                    <Check size={15} className="text-emerald-400" />
                  ) : (
                    <Copy size={15} />
                  )}
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDeleteClick(activeVideo)}
                  aria-label="Delete video"
                  title="Delete video"
                  className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-all"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 rounded-2xl bg-white/[0.01] border border-dashed border-white/[0.1] flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
            <PlayCircle size={64} className="text-zinc-600 mb-4" />
            <h3 className="text-xl font-semibold text-zinc-400 mb-2">Video Canvas</h3>
            <p className="text-zinc-500 max-w-sm text-sm">
              Your generated videos will appear here. Dial in your settings on the left to get started.
            </p>
          </div>
        )}

        {/* Recent Generated Videos */}
        {recentVideos.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                <Film size={15} className="text-cyan-400" />
                <span>Recent Videos ({recentVideos.length})</span>
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {recentVideos.map((vid, i) => {
                const vidUrl = vid.secureUrl || vid.url;
                const isSelected = activeVideo && (activeVideo.id === vid.id || (activeVideo.secureUrl || activeVideo.url) === vidUrl);
                const isDownloadingThis = downloadingId === (vid.id || vidUrl);

                return (
                  <div
                    key={vid.id || i}
                    onClick={() => setActiveVideo(vid)}
                    className={`group rounded-xl border p-2 bg-[#121215] flex flex-col gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/50'
                        : 'border-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center">
                      <video src={vidUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-lg">
                          <Play size={14} className="ml-0.5 fill-current" />
                        </div>
                      </div>
                      {vid.duration && (
                        <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] font-mono px-1.5 py-0.5 rounded text-white font-bold">
                          {vid.duration}s
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-zinc-300 font-medium truncate" title={vid.prompt}>
                        {vid.prompt || 'Generated Video'}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500">
                        <span className="capitalize">{vid.model || 'Video Model'}</span>
                        <span>{vid.createdAt ? new Date(vid.createdAt).toLocaleDateString() : 'Recent'}</span>
                      </div>
                    </div>

                    {/* Compact Action Row */}
                    <div className="flex items-center justify-between border-t border-white/[0.06] pt-1.5 mt-auto">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewFullSize(vid);
                          }}
                          aria-label="View video full size"
                          title="Full Size"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
                        >
                          <Maximize2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadVideo(vid);
                          }}
                          disabled={isDownloadingThis}
                          aria-label="Download video"
                          title="Download"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors disabled:opacity-50"
                        >
                          {isDownloadingThis ? <Loader2 size={13} className="animate-spin text-cyan-400" /> : <Download size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSchedule(vid);
                          }}
                          aria-label="Schedule video post"
                          title="Schedule"
                          className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-colors"
                        >
                          <Calendar size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(vid);
                          }}
                          aria-label="View details"
                          title="Details"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 transition-colors"
                        >
                          <Info size={13} />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyUrl(vidUrl, vid.id || vidUrl);
                          }}
                          aria-label="Copy video URL"
                          title="Copy URL"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                        >
                          {copiedId === (vid.id || vidUrl) ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(vid);
                          }}
                          aria-label="Delete video"
                          title="Delete"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Full Screen Video Modal */}
      {fullViewVideo && (
        <div
          onClick={() => setFullViewVideo(null)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in select-none"
        >
          {/* Top Bar with title & close */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 inset-x-4 max-w-5xl mx-auto flex items-center justify-between z-20"
          >
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-medium text-cyan-300 backdrop-blur-sm border border-white/10">
                {fullViewVideo.model || 'AI Video'}
              </span>
              <p className="text-xs text-zinc-400 truncate max-w-sm hidden sm:block">
                {fullViewVideo.prompt || 'Generated Video'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setFullViewVideo(null)}
              aria-label="Close full size viewer"
              title="Close (ESC)"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Large Video Player */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-[95vw] max-h-[82vh] flex items-center justify-center p-2"
          >
            <video
              src={fullViewVideo.secureUrl || fullViewVideo.url || fullViewVideo}
              controls
              autoPlay
              loop
              className="max-w-[95vw] max-h-[78vh] w-auto h-auto rounded-xl shadow-2xl border border-white/10 object-contain"
            />
          </div>

          {/* Bottom Quick Action Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-5 inset-x-4 max-w-md mx-auto flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-black/80 border border-white/10 backdrop-blur-md shadow-2xl z-20"
          >
            <button
              type="button"
              onClick={() => handleDownloadVideo(fullViewVideo)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-all"
            >
              <Download size={14} />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={() => handleSchedule(fullViewVideo)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-medium text-white transition-all shadow-md"
            >
              <Calendar size={14} />
              <span>Schedule Post</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopyUrl(fullViewVideo.secureUrl || fullViewVideo.url, fullViewVideo.id || fullViewVideo.url)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-all"
            >
              <Copy size={14} />
              <span>Copy URL</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDetailsVideo(fullViewVideo);
                setFullViewVideo(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-all"
            >
              <Info size={14} />
              <span>Details</span>
            </button>
          </div>
        </div>
      )}

      {/* Video Details Modal */}
      {detailsVideo && (
        <div
          onClick={() => setDetailsVideo(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#18181b] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Info size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Video Details</h3>
                  <p className="text-xs text-zinc-400">Metadata and generation specs</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailsVideo(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Preview Player */}
            <div className="w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/10 flex items-center justify-center relative">
              <video
                src={detailsVideo.secureUrl || detailsVideo.url || detailsVideo}
                controls
                className="w-full h-full object-contain"
              />
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-zinc-500">Source</span>
                <p className="font-medium text-zinc-200">AI Generated</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-zinc-500">Provider</span>
                <p className="font-medium text-zinc-200 capitalize">{detailsVideo.provider || 'Replicate'}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-zinc-500">Model</span>
                <p className="font-medium text-zinc-200 truncate">{detailsVideo.model || 'WAN 2.1'}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-zinc-500">Duration</span>
                <p className="font-medium text-zinc-200">{detailsVideo.duration ? `${detailsVideo.duration}s` : '5s'}</p>
              </div>
              {detailsVideo.resolution && (
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-0.5">
                  <span className="text-[10px] uppercase font-semibold text-zinc-500">Resolution</span>
                  <p className="font-medium text-zinc-200">{detailsVideo.resolution}</p>
                </div>
              )}
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-zinc-500">Created At</span>
                <p className="font-medium text-zinc-200">
                  {detailsVideo.createdAt ? new Date(detailsVideo.createdAt).toLocaleDateString() : 'Recent'}
                </p>
              </div>
            </div>

            {/* Prompt block with copy button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300">Prompt</span>
                <button
                  type="button"
                  onClick={() => {
                    if (detailsVideo.prompt) {
                      navigator.clipboard.writeText(detailsVideo.prompt);
                      setNotification({ type: 'success', text: 'Prompt copied to clipboard' });
                      setTimeout(() => setNotification(null), 3000);
                    }
                  }}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                  <Copy size={11} /> Copy Prompt
                </button>
              </div>
              <p className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-zinc-300 leading-relaxed max-h-24 overflow-y-auto custom-scrollbar">
                {detailsVideo.prompt || 'No prompt recorded'}
              </p>
            </div>

            {/* Asset ID */}
            {detailsVideo.id && (
              <div className="text-[11px] text-zinc-500 flex items-center justify-between pt-1">
                <span>Asset ID: <code className="text-zinc-400 font-mono">{detailsVideo.id}</code></span>
              </div>
            )}

            {/* Actions in Footer */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => handleDownloadVideo(detailsVideo)}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors flex items-center gap-1.5"
              >
                <Download size={14} /> Download
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = detailsVideo;
                  setDetailsVideo(null);
                  handleSchedule(item);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center gap-1.5 shadow-md"
              >
                <Calendar size={14} /> Schedule Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {videoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Delete this video?</h3>
                <p className="text-xs text-zinc-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-400">
              Are you sure you want to permanently delete this AI-generated video? Any active scheduled post using this video will prevent deletion.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setVideoToDelete(null)}
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
    </div>
  );
}
