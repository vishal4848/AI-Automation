"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { CheckCircle2, Globe, Share2, Briefcase, PlayCircle } from 'lucide-react';

const ProductShowcaseCanvas = dynamic(
  () => import('@/components/landing/3d/ProductShowcaseCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
        Loading 3D preview...
      </div>
    ),
  }
);

const featuresList = [
  "Cross-platform content generation",
  "Automated posting schedules",
  "AI-driven engagement analytics",
  "Smart hashtag suggestions"
];

export default function ProductShowcase() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <section id="product" className="py-32 bg-zinc-950 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left Side */}
          <div className="w-full lg:w-1/2">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold text-white mb-8"
            >
              See It In <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-cyan-500">Action</span>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-zinc-400 text-lg mb-10"
            >
              Experience the power of a complete AI command center. Visualize your entire content ecosystem in one centralized dashboard.
            </motion.p>

            <div className="flex flex-col gap-4 mb-12">
              {featuresList.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                  <span className="text-zinc-200 text-lg">{feature}</span>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-6">
              {[
                { label: "Images Generated", value: "2M+" },
                { label: "Videos Rendered", value: "500K+" },
                { label: "Captions Written", value: "10M+" }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-zinc-500">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Side - 3D Canvas */}
          <div className="w-full lg:w-1/2 h-[500px] relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/10 to-cyan-500/10 rounded-3xl border border-white/[0.08] pointer-events-none" />
            {mounted && <ProductShowcaseCanvas />}
          </div>

        </div>

        {/* Bottom Platform Badges */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-20 pt-10 border-t border-white/[0.08] flex justify-center items-center gap-8 md:gap-16 flex-wrap opacity-50 grayscale hover:grayscale-0 transition-all duration-500"
        >
          <Globe className="w-8 h-8 text-white" />
          <Share2 className="w-8 h-8 text-white" />
          <Briefcase className="w-8 h-8 text-white" />
          <PlayCircle className="w-8 h-8 text-white" />
        </motion.div>
      </div>
    </section>
  );
}
