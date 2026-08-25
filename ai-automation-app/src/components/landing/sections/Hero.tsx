"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, Play, ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import { MagneticButton } from '@/components/landing/ui/MagneticButton';

const Scene = dynamic(() => import('@/components/landing/3d/Scene'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-zinc-950/30" />
});

gsap.registerPlugin(ScrollTrigger);

const heroTexts = [
  "Generate AI Images",
  "Create AI Videos",
  "Schedule Posts",
  "Automate Content"
];

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % heroTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
        pin: true,
      }
    });

    tl.to('.hero-content', {
      y: -150,
      opacity: 0,
      duration: 1,
      ease: 'power2.inOut'
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  const headline = "AI Automation";

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-zinc-950 pt-20"
    >
      {/* Full-screen Scene background */}
      <div className="absolute inset-0 z-0 opacity-30 w-full h-full">
        <Scene showBrain={false} className="w-full h-full" />
      </div>
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-zinc-950/50 to-zinc-950 z-0 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center w-full hero-content">
        
        {/* Left Side */}
        <div className="w-full md:w-1/2 flex flex-col items-start text-left">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-cyan-500/20 to-violet-500/20 animate-pulse" />
            <Sparkles className="w-4 h-4 text-violet-400 relative z-10" />
            <span className="text-sm font-medium text-zinc-300 relative z-10">🚀 Trusted by 50,000+ creators</span>
          </motion.div>

          <h1 className="text-6xl md:text-8xl font-black mb-6 flex flex-wrap overflow-hidden leading-tight">
            {headline.split('').map((char, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className={char === ' ' ? 'mr-4' : 'bg-clip-text text-transparent bg-gradient-to-br from-violet-500 to-cyan-500'}
              >
                {char}
              </motion.span>
            ))}
          </h1>

          <div className="h-12 mb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={textIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="text-xl md:text-2xl text-zinc-300 font-medium"
              >
                {heroTexts[textIndex]}
              </motion.div>
            </AnimatePresence>
          </div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-zinc-400 text-lg mb-10 max-w-xl"
          >
            Streamline your entire content workflow. From generation to publishing, let AI handle the heavy lifting while you focus on growth.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex flex-wrap items-center gap-4 mb-16"
          >
            <MagneticButton>
              <div className="px-8 py-4 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-bold text-lg flex items-center gap-2 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.5)] transition-shadow cursor-pointer">
                Start Free <ArrowRight className="w-5 h-5" />
              </div>
            </MagneticButton>
            
            <MagneticButton>
              <div className="px-8 py-4 rounded-full bg-white/[0.03] border border-white/[0.08] text-white font-bold text-lg flex items-center gap-2 hover:bg-white/[0.05] transition-colors relative overflow-hidden group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/10 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <Play className="w-5 h-5" /> Watch Demo
              </div>
            </MagneticButton>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="flex items-center gap-8"
          >
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-white">50K+</span>
              <span className="text-sm text-zinc-500">Users</span>
            </div>
            <div className="w-px h-12 bg-white/[0.08]" />
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-white">2M+</span>
              <span className="text-sm text-zinc-500">Images</span>
            </div>
            <div className="w-px h-12 bg-white/[0.08]" />
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-white">99%</span>
              <span className="text-sm text-zinc-500">Uptime</span>
            </div>
          </motion.div>
        </div>

        {/* Right Side */}
        <div className="hidden md:flex w-1/2 items-center justify-center relative">
          <div className="absolute w-[500px] h-[500px] bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-violet-500/20 to-transparent rounded-full blur-[80px]" />
          <div className="w-[500px] h-[500px] relative z-10">
            <Scene showBrain={true} className="w-full h-full" />
          </div>
        </div>

      </div>
    </section>
  );
}
