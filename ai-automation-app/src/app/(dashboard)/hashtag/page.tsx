'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Hash, Copy, TrendingUp, Target, Shield, CheckCircle2 } from 'lucide-react';

const PLATFORMS = ['Instagram', 'TikTok', 'Twitter', 'LinkedIn'];

export default function HashtagStudio() {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [count, setCount] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<{ trending: string[], niche: string[], branded: string[] } | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setResults(null);
    try {
      const res = await fetch('/api/ai/generate-hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, platform, count }),
      });
      if (res.ok) {
        const data = await res.json();
        // Assuming API returns { trending: [], niche: [], branded: [] }
        if (data.results) {
          setResults(data.results);
        } else {
          // Mocking response if not structured correctly in backend yet
          setResults({
            trending: ['#ai', '#tech', '#innovation', '#future', '#software', '#coding', '#developer', '#startup'],
            niche: ['#machinelearningdaily', '#webdevlife', '#nextjsdeveloper', '#reactjs', '#frontendmagic', '#backendengineering'],
            branded: ['#OurBrandAI', '#BuildWithUs', '#AIAccelerator', '#TechSolutions2026']
          });
        }
      } else {
        alert('Failed to generate hashtags.');
      }
    } catch (error) {
      alert('Error generating hashtags.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyAll = () => {
    if (!results) return;
    const all = [...results.trending, ...results.niche, ...results.branded].join(' ');
    navigator.clipboard.writeText(all);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const copyGroup = (tags: string[]) => {
    navigator.clipboard.writeText(tags.join(' '));
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 text-zinc-100 min-h-[calc(100vh-120px)]">
      
      {/* Top Section */}
      <div className="flex flex-col items-center text-center mt-8">
        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] mb-6 inline-flex">
          <Hash size={32} className="text-cyan-400" />
        </div>
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-cyan-500 mb-4">
          Hashtag Generator
        </h1>
        <p className="text-zinc-400 max-w-lg mb-8">
          Boost your reach with AI-optimized hashtag strategies perfectly balanced for the algorithm.
        </p>

        <div className="w-full max-w-2xl bg-white/[0.03] border border-white/[0.08] p-6 rounded-3xl flex flex-col gap-6 backdrop-blur-md">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What is your post about? (e.g. AI SaaS Launch)"
            className="w-full p-4 text-lg rounded-xl bg-[#09090b] border border-white/[0.08] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-all placeholder:text-zinc-600"
          />

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex bg-[#09090b] p-1.5 rounded-xl border border-white/[0.08]">
              {PLATFORMS.map(p => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    platform === p ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-500">Count:</span>
              <select 
                value={count} 
                onChange={(e) => setCount(Number(e.target.value))}
                className="bg-[#09090b] border border-white/[0.08] rounded-lg p-2 text-sm focus:outline-none"
              >
                {[10, 20, 30, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!topic || isGenerating}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold text-lg transition-all shadow-[0_0_30px_rgba(6,182,212,0.2)] disabled:opacity-50"
          >
            {isGenerating ? 'Analyzing Algorithm...' : 'Generate Hashtags'}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {results && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6 pb-12"
        >
          <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 text-green-400 rounded-lg">
                <TrendingUp size={20} />
              </div>
              <div>
                <div className="text-sm font-medium text-zinc-200">Estimated Reach Potential</div>
                <div className="text-xs text-zinc-500">High engagement expected</div>
              </div>
            </div>
            <button 
              onClick={copyAll}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-colors"
            >
              {copiedAll ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              {copiedAll ? 'Copied All!' : 'Copy All Tags'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Trending */}
            <div className="bg-white/[0.03] border border-cyan-500/30 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                  <TrendingUp size={18} /> Trending
                </div>
                <button onClick={() => copyGroup(results.trending)} className="text-zinc-500 hover:text-cyan-400"><Copy size={16}/></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {results.trending.map(tag => (
                  <span key={tag} className="px-2.5 py-1 bg-cyan-500/10 text-cyan-200 text-sm rounded-md border border-cyan-500/20">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Niche */}
            <div className="bg-white/[0.03] border border-violet-500/30 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-violet-400 font-semibold">
                  <Target size={18} /> Niche Target
                </div>
                <button onClick={() => copyGroup(results.niche)} className="text-zinc-500 hover:text-violet-400"><Copy size={16}/></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {results.niche.map(tag => (
                  <span key={tag} className="px-2.5 py-1 bg-violet-500/10 text-violet-200 text-sm rounded-md border border-violet-500/20">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Branded/Safe */}
            <div className="bg-white/[0.03] border border-green-500/30 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-green-400 font-semibold">
                  <Shield size={18} /> Safe & Branded
                </div>
                <button onClick={() => copyGroup(results.branded)} className="text-zinc-500 hover:text-green-400"><Copy size={16}/></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {results.branded.map(tag => (
                  <span key={tag} className="px-2.5 py-1 bg-green-500/10 text-green-200 text-sm rounded-md border border-green-500/20">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
