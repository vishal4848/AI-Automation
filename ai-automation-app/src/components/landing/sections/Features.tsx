"use client";

import React, { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import { Sparkles, Video, MessageSquare, Hash, Calendar, BarChart3, Send, Archive } from 'lucide-react';

const features = [
  { icon: Sparkles, title: "AI Image Generation", desc: "Generate stunning images with FLUX, SD, and DALL-E models", color: "#8b5cf6", gradient: "from-violet-500/20 to-purple-500/20" },
  { icon: Video, title: "AI Video Generation", desc: "Create cinematic videos from text prompts via Fal.ai", color: "#06b6d4", gradient: "from-cyan-500/20 to-blue-500/20" },
  { icon: MessageSquare, title: "Caption Generator", desc: "AI-powered captions for every platform and tone", color: "#10b981", gradient: "from-emerald-500/20 to-teal-500/20" },
  { icon: Hash, title: "Hashtag Generator", desc: "Trending, niche, and branded hashtags in seconds", color: "#f59e0b", gradient: "from-amber-500/20 to-yellow-500/20" },
  { icon: Calendar, title: "Social Scheduler", desc: "Plan and auto-publish to all platforms at peak times", color: "#ec4899", gradient: "from-pink-500/20 to-rose-500/20" },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Real-time insights across all your social accounts", color: "#06b6d4", gradient: "from-cyan-500/20 to-sky-500/20" },
  { icon: Send, title: "Auto Publishing", desc: "Set it and forget it — AI handles the posting schedule", color: "#8b5cf6", gradient: "from-violet-500/20 to-indigo-500/20" },
  { icon: Archive, title: "Content Library", desc: "Organize all your AI-generated assets in one place", color: "#10b981", gradient: "from-emerald-500/20 to-green-500/20" }
];

function FeatureCard({ feature, index }: { feature: typeof features[0], index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useMotionTemplate`${mouseYSpring}deg`;
  const rotateY = useMotionTemplate`${mouseXSpring}deg`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct * 15);
    y.set(yPct * -15);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d"
      }}
      className="group relative h-full bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 transition-colors duration-300 hover:border-transparent cursor-pointer overflow-hidden"
    >
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
        style={{ boxShadow: `inset 0 0 0 1px ${feature.color}, 0 0 30px -10px ${feature.color}` }}
      />
      
      <div 
        className={`w-14 h-14 rounded-xl mb-6 flex items-center justify-center bg-gradient-to-br ${feature.gradient} transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3`}
        style={{ transform: "translateZ(30px)" }}
      >
        <Icon className="w-7 h-7" style={{ color: feature.color }} />
      </div>

      <h3 
        className="text-xl font-bold text-white mb-3"
        style={{ transform: "translateZ(20px)" }}
      >
        {feature.title}
      </h3>
      
      <p 
        className="text-zinc-400 text-sm leading-relaxed mb-6"
        style={{ transform: "translateZ(10px)" }}
      >
        {feature.desc}
      </p>

      <div 
        className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ transform: "translateZ(20px)" }}
      >
        <span className="text-sm font-semibold flex items-center gap-2" style={{ color: feature.color }}>
          Learn more <span className="text-lg">→</span>
        </span>
      </div>
    </motion.div>
  );
}

export default function Features() {
  return (
    <section id="features" className="py-32 bg-zinc-950 relative z-10">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Everything You Need
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-lg max-w-2xl mx-auto"
          >
            A complete suite of AI-powered tools designed to 10x your content creation and distribution workflow.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ perspective: 1000 }}>
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
