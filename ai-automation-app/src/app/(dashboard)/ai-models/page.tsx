'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Sparkles,
  Layers,
  Film,
  Image as ImageIcon,
  Type,
  FileText,
  SlidersHorizontal,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Coins,
  Zap,
  X,
  Key,
  ShieldCheck,
  Check,
  RotateCcw,
  Info,
  ChevronRight,
  Upload,
  Cpu,
  Mic
} from 'lucide-react';

interface ModelExample {
  title: string;
  description: string;
  samplePrompt: string;
}

interface AIModel {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  category: 'IMAGE' | 'VIDEO' | 'TEXT' | 'AUDIO';
  isFree: boolean;
  pricingType: 'FREE TIER' | 'PAID' | 'USAGE-BASED' | 'PRO' | 'LOCAL';
  creditsPerGeneration: number;
  pricePerGeneration: number;
  description?: string;
  howItWorks?: string;
  bestFor?: string;
  strengths?: string[];
  limitations?: string[];
  inputTypes?: string[];
  outputTypes?: string[];
  supportedCapabilities?: string[];
  pricingReference?: string;
  documentationUrl?: string;
  requiresCredentials?: string;
  qualityScore?: number;
  speedScore?: string;
  costScore?: string;
  examples?: ModelExample[];
  supportsTextToImage?: boolean;
  supportsImageToImage?: boolean;
  supportsTextToVideo?: boolean;
  supportsImageToVideo?: boolean;
  supportsNegativePrompt?: boolean;
  supportsSeed?: boolean;
  maxResolution?: string;
  maxDuration?: number;
  capabilities?: any;
  supportedInputs?: any;
}

interface ProviderStatus {
  id: string;
  name: string;
  configured: boolean;
  envVar: string;
  description?: string;
  categories: string[];
  modelsCount?: number;
}

export default function AIModelExplorer() {
  const router = useRouter();

  const [models, setModels] = useState<AIModel[]>([]);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');
  const [selectedPricing, setSelectedPricing] = useState<string>('all');
  const [selectedCapability, setSelectedCapability] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'speed' | 'cost' | 'quality'>('recommended');

  // Drawer / Modal States
  const [selectedModelForDetails, setSelectedModelForDetails] = useState<AIModel | null>(null);
  const [configModalProvider, setConfigModalProvider] = useState<ProviderStatus | null>(null);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);

  // Fetch models & provider statuses
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [modelsRes, providersRes] = await Promise.all([
          fetch('/api/models'),
          fetch('/api/models/providers'),
        ]);

        const modelsJson = await modelsRes.json();
        const providersJson = await providersRes.json();

        const modelList = Array.isArray(modelsJson)
          ? modelsJson
          : modelsJson.models || modelsJson.data || [];
        setModels(modelList);

        const provList = Array.isArray(providersJson)
          ? providersJson
          : Array.isArray(providersJson.providers)
          ? providersJson.providers
          : Array.isArray(providersJson.data)
          ? providersJson.data
          : Array.isArray(providersJson.providers?.data)
          ? providersJson.providers.data
          : [];
        setProviders(provList);
      } catch (err: any) {
        console.error('Failed to load AI model explorer data:', err);
        setError('Unable to load models from backend registry.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Keyboard ESC listener for drawers/modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedModelForDetails(null);
        setConfigModalProvider(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Provider configuration lookup helper
  const isProviderConfigured = (providerName: string): boolean => {
    const prov = providers.find(
      (p) => p.id.toLowerCase() === (providerName || '').toLowerCase()
    );
    return prov ? prov.configured : true;
  };

  const getProviderInfo = (providerName: string): ProviderStatus | undefined => {
    return providers.find(
      (p) => p.id.toLowerCase() === (providerName || '').toLowerCase()
    );
  };

  // Launch studio action
  const handleUseModel = (model: AIModel, samplePrompt?: string) => {
    const isConfigured = isProviderConfigured(model.provider);
    if (!isConfigured) {
      const provInfo = getProviderInfo(model.provider);
      if (provInfo) {
        setConfigModalProvider(provInfo);
        return;
      }
    }

    let targetPath = '';
    const params = new URLSearchParams();
    params.set('model', model.name);
    params.set('provider', model.provider);
    if (samplePrompt) {
      params.set('prompt', samplePrompt);
    }

    if (model.category === 'IMAGE') {
      targetPath = `/ai-image?${params.toString()}`;
    } else if (model.category === 'VIDEO') {
      targetPath = `/ai-video?${params.toString()}`;
    } else if (model.category === 'TEXT') {
      if (samplePrompt) {
        params.set('topic', samplePrompt);
      }
      targetPath = `/ai-caption?${params.toString()}`;
    } else {
      targetPath = `/ai-image?${params.toString()}`;
    }

    router.push(targetPath);
  };

  // Filter and sort models
  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = (model.displayName || '').toLowerCase().includes(query);
        const matchesId = (model.name || '').toLowerCase().includes(query);
        const matchesProvider = (model.provider || '').toLowerCase().includes(query);
        const matchesDesc = (model.description || '').toLowerCase().includes(query);
        const matchesBestFor = (model.bestFor || '').toLowerCase().includes(query);
        const matchesCaps = (model.supportedCapabilities || []).some((c) =>
          c.toLowerCase().includes(query)
        );

        if (
          !matchesName &&
          !matchesId &&
          !matchesProvider &&
          !matchesDesc &&
          !matchesBestFor &&
          !matchesCaps
        ) {
          return false;
        }
      }

      // 2. Provider Filter
      if (selectedProvider !== 'all') {
        const p = (model.provider || '').toLowerCase();
        const n = (model.name || '').toLowerCase();
        const dn = (model.displayName || '').toLowerCase();
        if (selectedProvider === 'openai') {
          if (p !== 'openai' && !n.includes('openai') && !dn.includes('chatgpt')) return false;
        } else if (selectedProvider === 'gemini') {
          if (p !== 'gemini' && !n.includes('google') && !n.includes('gemini') && !n.includes('imagen') && !dn.includes('gemini')) return false;
        } else if (p !== selectedProvider.toLowerCase()) {
          return false;
        }
      }

      // 3. Category Tab Filter
      if (selectedCategoryTab === 'image') {
        if (model.category !== 'IMAGE') return false;
      } else if (selectedCategoryTab === 'video') {
        if (model.category !== 'VIDEO') return false;
      } else if (selectedCategoryTab === 'editing') {
        const isEditing =
          model.supportsImageToImage ||
          model.capabilities?.supportsImageToImage ||
          model.supportedInputs?.supportsReferenceImage ||
          (model.supportedCapabilities || []).some((c: string) =>
            c.toLowerCase().includes('edit') ||
            c.toLowerCase().includes('upscal') ||
            c.toLowerCase().includes('background'),
          );
        if (!isEditing) return false;
      } else if (selectedCategoryTab === 'text') {
        if (model.category !== 'TEXT') return false;
      } else if (selectedCategoryTab === 'understanding') {
        const isUnderstanding =
          model.capabilities?.supportsMultimodal ||
          (model.supportedCapabilities || []).some((c: string) =>
            c.toLowerCase().includes('understanding') || c.toLowerCase().includes('multimodal'),
          );
        if (!isUnderstanding) return false;
      } else if (selectedCategoryTab === 'audio') {
        if (model.category !== 'AUDIO') return false;
      }

      // 4. Pricing Category Filter
      if (selectedPricing !== 'all') {
        const modelPricing = (model.pricingType || '').toUpperCase();
        if (selectedPricing === 'FREE TIER') {
          if (modelPricing !== 'FREE TIER' && modelPricing !== 'FREE_TIER' && !model.isFree) {
            return false;
          }
        } else if (selectedPricing === 'USAGE-BASED') {
          if (modelPricing !== 'USAGE-BASED' && modelPricing !== 'USAGE_BASED') {
            return false;
          }
        } else if (selectedPricing === 'PAID') {
          if (modelPricing !== 'PAID' && modelPricing !== 'PRO') {
            return false;
          }
        }
      }

      // 5. Capability Filter
      if (selectedCapability !== 'all') {
        if (selectedCapability === 'image-generation') {
          if (!model.supportsTextToImage && model.category !== 'IMAGE') return false;
        } else if (selectedCapability === 'video-generation') {
          if (!model.supportsTextToVideo && model.category !== 'VIDEO') return false;
        } else if (selectedCapability === 'image-editing') {
          const isEditing =
            model.supportsImageToImage ||
            model.capabilities?.supportsImageToImage ||
            model.supportedInputs?.supportsReferenceImage ||
            (model.supportedCapabilities || []).some((c: string) =>
              c.toLowerCase().includes('edit') ||
              c.toLowerCase().includes('upscal') ||
              c.toLowerCase().includes('background'),
            );
          if (!isEditing) return false;
        } else if (selectedCapability === 'text-generation') {
          if (model.category !== 'TEXT' && !model.capabilities?.supportsPromptEnhance) return false;
        } else if (selectedCapability === 'image-understanding') {
          const isUnderstanding =
            model.capabilities?.supportsMultimodal ||
            (model.supportedCapabilities || []).some((c: string) =>
              c.toLowerCase().includes('understanding') || c.toLowerCase().includes('multimodal'),
            );
          if (!isUnderstanding) return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'quality') {
        return (b.qualityScore || 9.0) - (a.qualityScore || 9.0);
      }
      if (sortBy === 'cost') {
        return (a.creditsPerGeneration || 0) - (b.creditsPerGeneration || 0);
      }
      if (sortBy === 'speed') {
        const isFastA = (a.speedScore || '').toLowerCase().includes('fast') || (a.speedScore || '').toLowerCase().includes('instant');
        const isFastB = (b.speedScore || '').toLowerCase().includes('fast') || (b.speedScore || '').toLowerCase().includes('instant');
        if (isFastA && !isFastB) return -1;
        if (!isFastA && isFastB) return 1;
        return 0;
      }
      // 'recommended': high quality and top providers first
      return (b.qualityScore || 9.0) - (a.qualityScore || 9.0);
    });
  }, [
    models,
    searchQuery,
    selectedProvider,
    selectedCategoryTab,
    selectedPricing,
    selectedCapability,
    sortBy,
  ]);

  // Provider badge color and icon helper
  const getProviderBadge = (provider: string) => {
    const p = (provider || '').toLowerCase();
    switch (p) {
      case 'replicate':
        return {
          bg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
          dot: 'bg-violet-400',
          label: 'Replicate',
        };
      case 'openai':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          dot: 'bg-emerald-400',
          label: 'OpenAI',
        };
      case 'gemini':
        return {
          bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          dot: 'bg-cyan-400',
          label: 'Google Gemini',
        };
      case 'fal':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          dot: 'bg-amber-400',
          label: 'Fal.ai',
        };
      case 'huggingface':
        return {
          bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
          dot: 'bg-yellow-400',
          label: 'Hugging Face',
        };
      default:
        return {
          bg: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
          dot: 'bg-zinc-400',
          label: provider,
        };
    }
  };

  // Pricing label style helper
  const getPricingBadge = (pricingType?: string, isFree?: boolean) => {
    const pt = (pricingType || '').toUpperCase();
    if (pt === 'FREE TIER' || pt === 'FREE_TIER' || isFree) {
      return {
        label: 'Free',
        className: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      };
    }
    if (pt === 'USAGE-BASED' || pt === 'USAGE_BASED') {
      return {
        label: 'Usage-based pricing',
        className: 'bg-violet-500/15 text-violet-300 border border-violet-500/30',
      };
    }
    if (pt === 'PAID' || pt === 'PRO') {
      return {
        label: 'Paid',
        className: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      };
    }
    return {
      label: 'Not verified',
      className: 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30',
    };
  };

  const ALL_CATEGORY_TABS = [
    { id: 'all', label: 'All Models', icon: Layers },
    { id: 'image', label: 'Image Generation', icon: ImageIcon },
    { id: 'video', label: 'Video Generation', icon: Film },
    { id: 'editing', label: 'Image Editing', icon: Upload },
    { id: 'text', label: 'Text & Prompts', icon: Type },
    { id: 'understanding', label: 'Image Understanding', icon: Sparkles },
    { id: 'audio', label: 'Audio & Other', icon: Mic },
  ];

  const categoryTabs = useMemo(() => {
    return ALL_CATEGORY_TABS.filter((tab) => {
      if (tab.id === 'all') return true;
      if (tab.id === 'image') return models.some((m) => m.category === 'IMAGE');
      if (tab.id === 'video') return models.some((m) => m.category === 'VIDEO');
      if (tab.id === 'editing')
        return models.some(
          (m) =>
            m.supportsImageToImage ||
            m.capabilities?.supportsImageToImage ||
            m.supportedInputs?.supportsReferenceImage ||
            (m.supportedCapabilities || []).some((c) =>
              c.toLowerCase().includes('edit') ||
              c.toLowerCase().includes('upscal') ||
              c.toLowerCase().includes('background'),
            ),
        );
      if (tab.id === 'text') return models.some((m) => m.category === 'TEXT');
      if (tab.id === 'understanding')
        return models.some(
          (m) =>
            m.capabilities?.supportsMultimodal ||
            (m.supportedCapabilities || []).some((c) =>
              c.toLowerCase().includes('understanding') || c.toLowerCase().includes('multimodal'),
            ),
        );
      if (tab.id === 'audio') return models.some((m) => m.category === 'AUDIO');
      return false;
    });
  }, [models]);

  return (
    <div className="flex flex-col gap-6 text-zinc-100 min-h-screen pb-16">
      {/* ─── Header Section ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              <Layers size={22} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-purple-300 to-cyan-400">
              AI Model Explorer
            </h1>
          </div>
          <p className="text-sm text-zinc-400 max-w-xl">
            Discover the right AI model for every creative task.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="relative z-10 flex items-center gap-3 self-start md:self-auto">
          <div className="px-3.5 py-2 rounded-xl bg-[#09090b] border border-white/[0.08] flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-400 font-medium">Registry:</span>
            <span className="text-white font-semibold">{models.length} Models</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-[#09090b] border border-white/[0.08] flex items-center gap-2 text-xs">
            <Cpu size={14} className="text-violet-400" />
            <span className="text-zinc-400 font-medium">Providers:</span>
            <span className="text-white font-semibold">{providers.length || 5} Connected</span>
          </div>
        </div>
      </div>

      {/* ─── Category Tabs ─── */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
        {categoryTabs.map((tab) => {
          const isActive = selectedCategoryTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategoryTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] border border-violet-400/30'
                  : 'bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.06]'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-zinc-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Search and Filters Bar ─── */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by model name, provider, capabilities, or use cases..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#09090b] border border-white/[0.08] text-xs text-zinc-200 placeholder:text-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Provider Filter */}
        <div className="w-full md:w-44">
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[#09090b] border border-white/[0.08] text-xs text-zinc-300 focus:border-violet-500 focus:outline-none transition-all capitalize"
          >
            <option value="all">All Providers</option>
            <option value="replicate">Replicate</option>
            <option value="openai">OpenAI / ChatGPT</option>
            <option value="gemini">Google Gemini</option>
            <option value="fal">Fal.ai</option>
            <option value="huggingface">Hugging Face</option>
          </select>
        </div>

        {/* Pricing Filter */}
        <div className="w-full md:w-36">
          <select
            value={selectedPricing}
            onChange={(e) => setSelectedPricing(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[#09090b] border border-white/[0.08] text-xs text-zinc-300 focus:border-violet-500 focus:outline-none transition-all"
          >
            <option value="all">All Pricing</option>
            <option value="FREE TIER">Free Tier</option>
            <option value="USAGE-BASED">Usage-Based</option>
            <option value="PAID">Paid / Pro</option>
          </select>
        </div>

        {/* Capability Filter */}
        <div className="w-full md:w-44">
          <select
            value={selectedCapability}
            onChange={(e) => setSelectedCapability(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[#09090b] border border-white/[0.08] text-xs text-zinc-300 focus:border-violet-500 focus:outline-none transition-all"
          >
            <option value="all">All Capabilities</option>
            <option value="image-generation">Image Generation</option>
            <option value="video-generation">Video Generation</option>
            <option value="image-editing">Image Editing</option>
            <option value="text-generation">Text Generation</option>
            <option value="image-understanding">Image Understanding</option>
          </select>
        </div>

        {/* Sort Filter */}
        <div className="w-full md:w-36">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2.5 rounded-xl bg-[#09090b] border border-white/[0.08] text-xs text-zinc-300 focus:border-violet-500 focus:outline-none transition-all"
          >
            <option value="recommended">Recommended</option>
            <option value="quality">Top Quality</option>
            <option value="speed">Fastest Speed</option>
            <option value="cost">Lowest Cost</option>
          </select>
        </div>
      </div>

      {/* ─── Active Filter Pills (if any applied) ─── */}
      {(selectedProvider !== 'all' || selectedPricing !== 'all' || selectedCapability !== 'all' || searchQuery) && (
        <div className="flex items-center gap-2 flex-wrap text-xs text-zinc-400">
          <span>Active filters:</span>
          {searchQuery && (
            <span className="px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 flex items-center gap-1.5">
              <span>Query: "{searchQuery}"</span>
              <button onClick={() => setSearchQuery('')} className="hover:text-white">
                <X size={12} />
              </button>
            </span>
          )}
          {selectedProvider !== 'all' && (
            <span className="px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 flex items-center gap-1.5 capitalize">
              <span>Provider: {selectedProvider}</span>
              <button onClick={() => setSelectedProvider('all')} className="hover:text-white">
                <X size={12} />
              </button>
            </span>
          )}
          {selectedPricing !== 'all' && (
            <span className="px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 flex items-center gap-1.5">
              <span>Pricing: {selectedPricing}</span>
              <button onClick={() => setSelectedPricing('all')} className="hover:text-white">
                <X size={12} />
              </button>
            </span>
          )}
          {selectedCapability !== 'all' && (
            <span className="px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 flex items-center gap-1.5 capitalize">
              <span>Capability: {selectedCapability.replace(/-/g, ' ')}</span>
              <button onClick={() => setSelectedCapability('all')} className="hover:text-white">
                <X size={12} />
              </button>
            </span>
          )}
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedProvider('all');
              setSelectedPricing('all');
              setSelectedCapability('all');
            }}
            className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2 ml-1"
          >
            Reset all
          </button>
        </div>
      )}

      {/* ─── Model Cards Grid ─── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="w-24 h-5 bg-white/10 rounded-md" />
                <div className="w-20 h-5 bg-white/10 rounded-md" />
              </div>
              <div className="w-3/4 h-6 bg-white/10 rounded-md" />
              <div className="w-full h-12 bg-white/5 rounded-md" />
              <div className="flex gap-2">
                <div className="w-16 h-5 bg-white/5 rounded-md" />
                <div className="w-20 h-5 bg-white/5 rounded-md" />
              </div>
              <div className="w-full h-10 bg-white/10 rounded-xl mt-4" />
            </div>
          ))}
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-3">
          <div className="p-3 rounded-full bg-white/[0.05] text-zinc-400">
            <Search size={28} />
          </div>
          <h3 className="text-base font-semibold text-zinc-200">No matching AI models found</h3>
          <p className="text-xs text-zinc-400 max-w-sm">
            Try adjusting your search keywords, clearing capability filters, or selecting "All Providers" to discover models.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedProvider('all');
              setSelectedCategoryTab('all');
              setSelectedPricing('all');
              setSelectedCapability('all');
            }}
            className="mt-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <RotateCcw size={13} />
            <span>Clear Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredModels.map((model) => {
            const providerBadge = getProviderBadge(model.provider);
            const pricingBadge = getPricingBadge(model.pricingType, model.isFree);
            const configured = isProviderConfigured(model.provider);

            return (
              <motion.div
                key={model.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-[#09090b] border border-white/[0.08] hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.12)] transition-all duration-300"
              >
                <div>
                  {/* Top Header Row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 ${providerBadge.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${providerBadge.dot}`} />
                      <span>{providerBadge.label}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${pricingBadge.className}`}>
                        {pricingBadge.label}
                      </span>
                      {!configured && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                          <Key size={10} />
                          <span>Config Req.</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Model Name & ID */}
                  <div className="mb-2">
                    <h3 className="font-bold text-base text-zinc-100 group-hover:text-violet-300 transition-colors flex items-center gap-1.5">
                      <span>{model.displayName || model.name}</span>
                    </h3>
                    <p className="text-[11px] font-mono text-zinc-500 truncate" title={model.name}>
                      {model.name}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-300 leading-relaxed mb-3 line-clamp-3">
                    {model.description ||
                      `${model.displayName} is an advanced ${model.category.toLowerCase()} AI model optimized for high-fidelity generation.`}
                  </p>

                  {/* Working (How it works) */}
                  <div className="mb-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-300 mb-1">
                      <Cpu size={12} className="text-violet-400" />
                      <span>Working</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                      {model.howItWorks ||
                        (model as any).defaultParams?.howItWorks ||
                        'Direct natural language prompt comprehension and multi-stage diffusion rendering.'}
                    </p>
                  </div>

                  {/* Used For (What it is used for) */}
                  <div className="mb-3.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 mb-1">
                      <Sparkles size={12} className="text-emerald-400" />
                      <span>Used For</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                      {model.bestFor ||
                        (model as any).defaultParams?.bestFor ||
                        'Visual content creation, marketing creatives, social campaigns, and artistic assets.'}
                    </p>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedModelForDetails(model)}
                      className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-semibold border border-white/[0.08] transition-colors text-center"
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUseModel(model)}
                      className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-semibold shadow-[0_0_12px_rgba(139,92,246,0.25)] transition-all flex items-center justify-center gap-1.5 group/btn"
                    >
                      <span>Use Model</span>
                      <ArrowRight
                        size={13}
                        className="group-hover/btn:translate-x-0.5 transition-transform"
                      />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─── Detail Drawer / Slide-Over Modal ─── */}
      <AnimatePresence>
        {selectedModelForDetails && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedModelForDetails(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Slide-over Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-full max-w-2xl h-full bg-[#0d0d12] border-l border-white/[0.1] shadow-2xl flex flex-col z-10 overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                        getProviderBadge(selectedModelForDetails.provider).bg
                      }`}
                    >
                      {getProviderBadge(selectedModelForDetails.provider).label}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        getPricingBadge(
                          selectedModelForDetails.pricingType,
                          selectedModelForDetails.isFree
                        ).className
                      }`}
                    >
                      {
                        getPricingBadge(
                          selectedModelForDetails.pricingType,
                          selectedModelForDetails.isFree
                        ).label
                      }
                    </span>
                    {!isProviderConfigured(selectedModelForDetails.provider) && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                        <Key size={10} />
                        <span>Config Required</span>
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {selectedModelForDetails.displayName || selectedModelForDetails.name}
                  </h2>
                  <p className="text-xs font-mono text-zinc-400">
                    {selectedModelForDetails.name}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedModelForDetails(null)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Content Scroll Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {/* 1. Overview & High-level mechanism */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Info size={14} className="text-violet-400" />
                    <span>Overview & Architecture</span>
                  </h4>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2.5 text-xs text-zinc-300 leading-relaxed">
                    <p>{selectedModelForDetails.description}</p>
                    {selectedModelForDetails.howItWorks && (
                      <p className="text-zinc-400">
                        <strong className="text-zinc-200">How it works: </strong>
                        {selectedModelForDetails.howItWorks}
                      </p>
                    )}
                    {selectedModelForDetails.bestFor && (
                      <p className="text-zinc-400">
                        <strong className="text-zinc-200">Best use cases: </strong>
                        {selectedModelForDetails.bestFor}
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Strengths & Limitations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 size={13} />
                      <span>Strengths</span>
                    </h4>
                    <div className="p-3.5 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 space-y-2">
                      {(selectedModelForDetails.strengths || [
                        'High prompt adherence',
                        'Consistent lighting and details',
                        'Optimized inference latency',
                      ]).map((str, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                          <Check size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                          <span>{str}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Limitations */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle size={13} />
                      <span>Limitations</span>
                    </h4>
                    <div className="p-3.5 rounded-xl bg-amber-500/[0.04] border border-amber-500/20 space-y-2">
                      {(selectedModelForDetails.limitations || [
                        'Requires API credits per generation',
                        'Fixed parameter presets apply',
                      ]).map((lim, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                          <span>{lim}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Input & Output Specifications */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <SlidersHorizontal size={14} className="text-cyan-400" />
                    <span>Inputs & Generation Specs</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                      <span className="text-[10px] text-zinc-500 uppercase">Input Types</span>
                      <p className="font-semibold text-zinc-200">
                        {selectedModelForDetails.inputTypes?.join(', ') || 'Text Prompt, Aspect Ratio'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                      <span className="text-[10px] text-zinc-500 uppercase">Output Format</span>
                      <p className="font-semibold text-zinc-200">
                        {selectedModelForDetails.outputTypes?.join(', ') ||
                          (selectedModelForDetails.category === 'VIDEO' ? 'MP4 Video' : 'Image WebP/PNG')}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                      <span className="text-[10px] text-zinc-500 uppercase">Max Resolution</span>
                      <p className="font-semibold text-zinc-200">
                        {selectedModelForDetails.maxResolution || '1024x1024 (HD)'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                      <span className="text-[10px] text-zinc-500 uppercase">Reference Images</span>
                      <p className="font-semibold text-zinc-200">
                        {selectedModelForDetails.supportedInputs?.supportsReferenceImage ||
                        selectedModelForDetails.supportsImageToImage ||
                        selectedModelForDetails.supportsImageToVideo
                          ? 'Supported'
                          : 'Not Supported'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4. Verified Pricing & Performance Reference */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Coins size={14} className="text-violet-400" />
                    <span>Verified Cost & Performance</span>
                  </h4>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                      <span className="text-zinc-400">Pricing Reference:</span>
                      <span className="font-semibold text-zinc-200 text-right">
                        {selectedModelForDetails.pricingReference || 'Varies by usage tier'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                      <span className="text-zinc-400">Typical Latency / Speed:</span>
                      <span className="font-semibold text-zinc-200">
                        {selectedModelForDetails.speedScore || '2-5 seconds'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Required Environment Variable:</span>
                      <code className="px-2 py-0.5 rounded bg-black/60 border border-white/[0.1] text-violet-300 font-mono text-[11px]">
                        {selectedModelForDetails.requiresCredentials ||
                          getProviderInfo(selectedModelForDetails.provider)?.envVar ||
                          'CONFIGURED'}
                      </code>
                    </div>
                  </div>
                </div>

                {/* 5. Practical Examples with "Try in Studio" */}
                {selectedModelForDetails.examples && selectedModelForDetails.examples.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles size={14} className="text-amber-400" />
                      <span>Practical Examples & Sample Prompts</span>
                    </h4>
                    <div className="space-y-3">
                      {selectedModelForDetails.examples.map((ex, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <h5 className="font-bold text-zinc-200">{ex.title}</h5>
                            <button
                              type="button"
                              onClick={() => handleUseModel(selectedModelForDetails, ex.samplePrompt)}
                              className="px-2.5 py-1 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-[11px] font-semibold transition-colors flex items-center gap-1"
                            >
                              <span>Try Example</span>
                              <ArrowRight size={11} />
                            </button>
                          </div>
                          <p className="text-zinc-400 text-[11px]">{ex.description}</p>
                          <div className="p-2.5 rounded-lg bg-[#09090b] border border-white/[0.04] text-zinc-300 font-mono text-[11px] leading-relaxed select-all">
                            "{ex.samplePrompt}"
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-5 border-t border-white/[0.08] bg-[#0d0d12] flex items-center gap-3">
                {selectedModelForDetails.documentationUrl && (
                  <a
                    href={selectedModelForDetails.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white text-xs font-semibold border border-white/[0.08] transition-colors flex items-center gap-1.5"
                  >
                    <span>View Docs</span>
                    <ExternalLink size={13} />
                  </a>
                )}

                {!isProviderConfigured(selectedModelForDetails.provider) ? (
                  <button
                    type="button"
                    onClick={() => {
                      const prov = getProviderInfo(selectedModelForDetails.provider);
                      if (prov) setConfigModalProvider(prov);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Key size={14} />
                    <span>Configure Provider Credentials</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUseModel(selectedModelForDetails)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-semibold shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all flex items-center justify-center gap-2"
                  >
                    <span>Open in {selectedModelForDetails.category === 'VIDEO' ? 'Video Studio' : selectedModelForDetails.category === 'TEXT' ? 'Caption Studio' : 'Image Studio'}</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Provider Configuration Helper Modal ─── */}
      <AnimatePresence>
        {configModalProvider && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfigModalProvider(null)}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md p-6 rounded-2xl bg-[#0d0d12] border border-white/[0.1] shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                    <Key size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">
                      Configure {configModalProvider.name}
                    </h3>
                    <p className="text-xs text-zinc-400">API credentials required to generate</p>
                  </div>
                </div>
                <button
                  onClick={() => setConfigModalProvider(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-xs text-zinc-300">
                <p>
                  To run models from <strong>{configModalProvider.name}</strong>, add your API key to
                  the backend environment configuration:
                </p>
                <div className="p-2.5 rounded-lg bg-black border border-white/[0.1] font-mono text-violet-300 text-[11px] flex items-center justify-between">
                  <span>{configModalProvider.envVar}=your_key_here</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Update <code className="text-zinc-400">ai-automation-backend/.env</code> and restart the backend server.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfigModalProvider(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 text-xs font-semibold transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfigModalProvider(null);
                    router.push('/settings');
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors text-center"
                >
                  Go to Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
