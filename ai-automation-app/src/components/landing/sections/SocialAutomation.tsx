"use client";

import React from 'react';
import { Globe, Camera, Briefcase, Share2, PlayCircle, Hash, Video, MonitorPlay } from 'lucide-react';
import { motion } from 'framer-motion';

const platforms = [
  { name: 'Instagram', icon: Camera,      color: 'text-pink-500',  orbitRadius: 130, duration: 20, delay: 0 },
  { name: 'Facebook',  icon: Globe,       color: 'text-blue-500',  orbitRadius: 170, duration: 25, delay: 3 },
  { name: 'LinkedIn',  icon: Briefcase,   color: 'text-blue-400',  orbitRadius: 210, duration: 30, delay: 6 },
  { name: 'YouTube',   icon: PlayCircle,  color: 'text-red-500',   orbitRadius: 250, duration: 35, delay: 9 },
  { name: 'TikTok',   icon: Video,       color: 'text-white',     orbitRadius: 150, duration: 22, delay: 2 },
  { name: 'Pinterest', icon: MonitorPlay, color: 'text-red-600',   orbitRadius: 190, duration: 28, delay: 5 },
  { name: 'Threads',   icon: Hash,        color: 'text-gray-300',  orbitRadius: 230, duration: 32, delay: 8 },
  { name: 'Twitter',   icon: Share2,      color: 'text-sky-400',   orbitRadius: 270, duration: 38, delay: 11 },
];

const features = [
  "Auto-formatting for each platform's requirements",
  "Smart scheduling based on audience activity",
  "Unified analytics dashboard",
  "Cross-platform comment management",
];

export default function SocialAutomation() {
  return (
    <section id="social" className="py-24 relative overflow-hidden bg-[#09090b]">
      <style>{`
        @keyframes sa-orbit {
          from { transform: rotate(0deg) translateX(var(--sa-r)) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(var(--sa-r)) rotate(-360deg); }
        }
        @keyframes sa-pulse {
          0%   { transform: translate(-50%,-50%) scale(0.9); opacity: 0.6; }
          100% { transform: translate(-50%,-50%) scale(2.2); opacity: 0; }
        }
        .sa-orbit-item {
          position: absolute;
          top: -24px;
          left: -24px;
          width: 48px;
          height: 48px;
          animation: sa-orbit var(--sa-dur) linear infinite;
          animation-delay: var(--sa-delay);
        }
        .sa-orbit-item:hover { animation-play-state: paused; }
        .sa-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(139,92,246,0.25);
          top: 50%;
          left: 50%;
          animation: sa-pulse 4s cubic-bezier(0.215,0.61,0.355,1) infinite;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">

        {/* Left — Orbit Visualisation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative h-[560px] flex items-center justify-center"
        >
          {/* Pulse rings */}
          <div className="sa-ring w-32  h-32"  style={{ animationDelay: '0s' }} />
          <div className="sa-ring w-52  h-52"  style={{ animationDelay: '1s' }} />
          <div className="sa-ring w-72  h-72"  style={{ animationDelay: '2s' }} />
          <div className="sa-ring w-96  h-96"  style={{ animationDelay: '3s' }} />

          {/* AI core */}
          <div className="relative z-10 w-20 h-20 rounded-full bg-black border border-white/10 flex items-center justify-center shadow-[0_0_50px_rgba(139,92,246,0.5)] backdrop-blur-xl">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-600/30 to-cyan-400/20 animate-pulse" />
            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
              AI
            </span>
          </div>

          {/* Orbiting icons */}
          <div className="absolute top-1/2 left-1/2 w-0 h-0">
            {platforms.map((p) => (
              <div
                key={p.name}
                className="sa-orbit-item group cursor-pointer flex items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-md hover:scale-125 transition-transform"
                style={{
                  '--sa-r':     `${p.orbitRadius}px`,
                  '--sa-dur':   `${p.duration}s`,
                  '--sa-delay': `-${p.delay}s`,
                } as React.CSSProperties}
                title={p.name}
              >
                <p.icon className={`w-5 h-5 ${p.color}`} />
                <span className="absolute top-full mt-2 hidden group-hover:block whitespace-nowrap bg-zinc-900 border border-white/10 px-2 py-1 rounded text-[11px] text-white z-20">
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right — Copy */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div>
            <p className="text-sm font-semibold text-purple-400 uppercase tracking-widest mb-3">
              All Platforms
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              One Platform,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-400">
                Every Network
              </span>
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Connect all your accounts and let our AI handle the distribution. Seamlessly post, engage, and grow across every major social platform from a single dashboard.
            </p>
          </div>

          <ul className="space-y-4">
            {features.map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 text-zinc-300"
              >
                <div className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {item}
              </motion.li>
            ))}
          </ul>

          <a
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:-translate-y-0.5 transition-all"
          >
            Connect Your Accounts
          </a>
        </motion.div>

      </div>
    </section>
  );
}
