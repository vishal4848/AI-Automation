"use client";

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PenLine, Cpu, Sparkles, Calendar, Send, BarChart3 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  { step: "01", title: "Enter Your Prompt", desc: "Describe what you want to create", icon: PenLine, color: "#8b5cf6" },
  { step: "02", title: "AI Processing", desc: "Our AI models generate content instantly", icon: Cpu, color: "#06b6d4" },
  { step: "03", title: "Generate Content", desc: "Get images, videos, captions ready", icon: Sparkles, color: "#10b981" },
  { step: "04", title: "Schedule Posts", desc: "Pick optimal times for each platform", icon: Calendar, color: "#f59e0b" },
  { step: "05", title: "Auto Publish", desc: "Content goes live across all accounts", icon: Send, color: "#ec4899" },
  { step: "06", title: "Track Analytics", desc: "Monitor performance in real time", icon: BarChart3, color: "#8b5cf6" }
];

export default function Workflow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !dotRef.current) return;

    gsap.to(dotRef.current, {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top center',
        end: 'bottom center',
        scrub: 0.5,
      },
      top: '100%',
      ease: 'none'
    });
  }, []);

  return (
    <section id="workflow" className="py-32 bg-zinc-950 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-900/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10" ref={containerRef}>
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            How It Works
          </motion.h2>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Desktop Line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-white/[0.08] -translate-x-1/2">
            <div 
              ref={dotRef}
              className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_15px_#06b6d4] z-20"
              style={{ top: '0%' }}
            />
          </div>

          <div className="flex flex-col gap-12 md:gap-24">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0;
              const Icon = step.icon;
              
              return (
                <div key={index} className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 ${isEven ? '' : 'md:flex-row-reverse'}`}>
                  
                  {/* Card Container */}
                  <div className={`w-full md:w-1/2 flex ${isEven ? 'md:justify-end' : 'md:justify-start'}`}>
                    <motion.div
                      initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      whileHover={{ scale: 1.02 }}
                      className="relative w-full max-w-md bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 overflow-hidden group transition-all duration-300"
                    >
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                        style={{ backgroundColor: step.color }}
                      />
                      
                      <div 
                        className="absolute -right-4 -top-10 text-[120px] font-black opacity-5 select-none transition-transform duration-500 group-hover:scale-110"
                        style={{ color: step.color }}
                      >
                        {step.step}
                      </div>

                      <div className="relative z-10 flex items-start gap-6">
                        <div 
                          className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                          style={{ background: `linear-gradient(135deg, ${step.color}20, transparent)`, border: `1px solid ${step.color}40` }}
                        >
                          <Icon className="w-8 h-8" style={{ color: step.color }} />
                        </div>
                        
                        <div>
                          <div className="text-sm font-bold mb-2 tracking-wider" style={{ color: step.color }}>
                            STEP {step.step}
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                          <p className="text-zinc-400 leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* Empty space for alternative side on desktop */}
                  <div className="hidden md:block md:w-1/2" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
