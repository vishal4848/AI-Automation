'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PenTool, Copy, Edit2, Bookmark, RefreshCw, Hash, Type } from 'lucide-react';

const PLATFORMS = ['Instagram', 'Twitter', 'LinkedIn', 'TikTok', 'YouTube'];
const TONES = [
  { id: 'professional', label: 'Professional' },
  { id: 'casual', label: 'Casual' },
  { id: 'funny', label: 'Funny' },
  { id: 'inspirational', label: 'Inspirational' },
  { id: 'educational', label: 'Educational' },
];
const LENGTHS = [
  { id: 'short', label: 'Short (~50 words)' },
  { id: 'medium', label: 'Medium (~100 words)' },
  { id: 'long', label: 'Long (~200 words)' },
];

export default function AICaptionStudio() {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [useEmojis, setUseEmojis] = useState(true);
  const [useCTA, setUseCTA] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [captions, setCaptions] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setCaptions([]);
    try {
      const res = await fetch('/api/ai/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic, platform, tone, length, useEmojis, useCTA
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // Assuming API returns { captions: string[] }
        if (data.captions) {
          setCaptions(data.captions);
        }
      } else {
        alert('Failed to generate captions.');
      }
    } catch (error) {
      alert('Error generating captions.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast here
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)] text-zinc-100">
      {/* Left Form */}
      <div className="w-full lg:w-[420px] flex flex-col gap-6 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 text-white">
            <PenTool size={24} />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-cyan-500">
            Caption Studio
          </h1>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">What is the post about?</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="E.g., Launching our new AI product that helps developers code faster..."
            className="w-full h-24 p-3 rounded-xl bg-[#09090b] border border-white/[0.08] focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all resize-none"
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-300">Platform</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  platform === p
                    ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg'
                    : 'bg-[#09090b] border border-white/[0.08] text-zinc-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-300">Tone of Voice</label>
          <div className="grid grid-cols-2 gap-2">
            {TONES.map(t => (
              <button
                key={t.id}
                onClick={() => setTone(t.id)}
                className={`p-2.5 rounded-xl border text-sm font-medium transition-all ${
                  tone === t.id
                    ? 'bg-violet-500/20 border-violet-500 text-violet-300'
                    : 'bg-[#09090b] border-white/[0.08] text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-300">Length</label>
          <div className="flex flex-col gap-2">
            {LENGTHS.map(l => (
              <button
                key={l.id}
                onClick={() => setLength(l.id)}
                className={`p-3 rounded-xl border text-sm text-left transition-all ${
                  length === l.id
                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300'
                    : 'bg-[#09090b] border-white/[0.08] text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">Include Emojis</span>
            <div className={`w-12 h-6 rounded-full transition-colors relative ${useEmojis ? 'bg-violet-500' : 'bg-white/10'}`} onClick={() => setUseEmojis(!useEmojis)}>
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${useEmojis ? 'translate-x-7' : 'translate-x-1'}`} />
            </div>
          </label>
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">Include Call to Action (CTA)</span>
            <div className={`w-12 h-6 rounded-full transition-colors relative ${useCTA ? 'bg-cyan-500' : 'bg-white/10'}`} onClick={() => setUseCTA(!useCTA)}>
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${useCTA ? 'translate-x-7' : 'translate-x-1'}`} />
            </div>
          </label>
        </div>

        <div className="mt-auto pt-6 border-t border-white/[0.08]">
          <button
            onClick={handleGenerate}
            disabled={!topic || isGenerating}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Drafting...' : 'Generate Captions'}
          </button>
        </div>
      </div>

      {/* Right Results */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {isGenerating ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-white/10 rounded w-full mb-4"></div>
                <div className="h-4 bg-white/10 rounded w-5/6 mb-4"></div>
                <div className="h-4 bg-white/10 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : captions.length > 0 ? (
          <div className="space-y-6 pb-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-semibold text-zinc-200">Generated Variations</h2>
              <span className="text-sm text-zinc-500">Pick your favorite</span>
            </div>
            
            {captions.map((cap, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] group hover:border-violet-500/50 transition-colors"
              >
                <div className="whitespace-pre-wrap text-zinc-300 text-[15px] leading-relaxed mb-6 font-light">
                  {cap}
                </div>
                
                <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 text-xs text-zinc-400">
                      <Type size={12} /> {cap.split(' ').length} words
                    </span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 text-xs text-zinc-400">
                      <Hash size={12} /> {cap.match(/#/g)?.length || 0} tags
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors" title="Regenerate">
                      <RefreshCw size={16} />
                    </button>
                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors" title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors" title="Save">
                      <Bookmark size={16} />
                    </button>
                    <button 
                      onClick={() => copyToClipboard(cap)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors ml-2"
                    >
                      <Copy size={16} /> Copy
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center mb-6">
              <PenTool size={32} className="text-violet-400" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-200 mb-3">Craft the perfect message</h3>
            <p className="text-zinc-500">
              Stop staring at a blank screen. Describe your post on the left, choose your platform and tone, and our AI will write highly engaging captions tailored to your audience.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
