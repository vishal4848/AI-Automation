'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Film, Download, Share2, BookmarkPlus, Loader2, PlayCircle, AlertCircle } from 'lucide-react';
import { getAIModels } from '@/lib/api/ai-api';
import { useQueryClient } from '@tanstack/react-query';

const STYLES = ['Cinematic', 'Animation', 'Documentary', '3D Render', 'Retro', 'VFX'];
const DURATIONS = [
  { val: 3, label: '3s' },
  { val: 5, label: '5s' },
  { val: 8, label: '8s' },
  { val: 15, label: '15s' },
];

export default function AIVideoStudio() {
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Cinematic');
  const [duration, setDuration] = useState(5);
  const [resolution, setResolution] = useState('1080p');
  const [motionIntensity, setMotionIntensity] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const queryClient = useQueryClient();

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
    loadModels();
  }, []);

  const activeModel = models.find(m => m.name === selectedModel);

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
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.video || data.videoUrl) {
          if (videoUrl) {
            setHistory(prev => [videoUrl, ...prev].slice(0, 3));
          }
          setVideoUrl(data.video || data.videoUrl);
          queryClient.invalidateQueries({ queryKey: ['analytics'] });
        }
      } else {
        setErrorMsg(data.error || 'Failed to generate video.');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Error generating video.');
    } finally {
      setIsGenerating(false);
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

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the motion and scene..."
            className="w-full h-32 p-3 rounded-xl bg-[#09090b] border border-white/[0.08] focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all resize-none"
          />
        </div>

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
                    ? 'bg-cyan-500/20 border-cyan-500 text-white'
                    : 'bg-[#09090b] border-white/[0.08] text-zinc-400 hover:border-white/20'
                }`}
              >
                <div className="font-semibold text-sm">{model.displayName || model.name}</div>
                <div className="flex flex-col mt-1 gap-1">
                  <span className="text-xs opacity-70 capitalize">{model.provider}</span>
                  {model.pricingType && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit ${
                      model.pricingType === 'FREE TIER' ? 'bg-green-500/20 text-green-400' :
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

        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-300">Style</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full p-3 rounded-xl bg-[#09090b] border border-white/[0.08] focus:border-cyan-500 focus:outline-none text-zinc-300"
          >
            {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-300">Duration</label>
          <div className="grid grid-cols-4 gap-2">
            {DURATIONS.map(d => (
              <button
                key={d.val}
                onClick={() => setDuration(d.val)}
                className={`py-2 rounded-xl border text-sm font-medium transition-all ${
                  duration === d.val
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                    : 'bg-[#09090b] border-white/[0.08] text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-300">Resolution</label>
          <div className="flex gap-2">
            {['720p', '1080p'].map(r => (
              <button
                key={r}
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
        ) : videoUrl ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col gap-4"
          >
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center">
              <video 
                src={videoUrl} 
                controls 
                autoPlay 
                loop 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex justify-end gap-3 border-t border-white/[0.08] pt-4">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors">
                <Share2 size={16} /> Share
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors">
                <BookmarkPlus size={16} /> Save to Library
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-sm font-medium transition-all">
                <Download size={16} /> Download
              </button>
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

        {history.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-zinc-400 px-1">Recent Videos</h4>
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {history.map((url, i) => (
                <div key={i} className="min-w-[200px] aspect-video rounded-xl bg-black border border-white/[0.08] overflow-hidden relative group">
                  <video src={url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <PlayCircle size={32} className="text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
