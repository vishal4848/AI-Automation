"use client"
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Loader = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2500;
    const interval = 20;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const nextProgress = Math.min(100, (currentStep / steps) * 100);
      setProgress(nextProgress);

      if (currentStep >= steps) {
        clearInterval(timer);
        setTimeout(onComplete, 200);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  const text = "AI AUTOMATION";
  
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100000] bg-[#09090b] flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none flex justify-center items-center">
        <div className="w-[200vw] h-[200vh] bg-[radial-gradient(circle_at_center,_#8b5cf6_0%,_transparent_20%)] animate-pulse" />
      </div>

      <div className="relative w-48 h-48 mb-8">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="88"
            className="stroke-white/10"
            strokeWidth="2"
            fill="none"
          />
          <motion.circle
            cx="96"
            cy="96"
            r="88"
            className="stroke-[#8b5cf6]"
            strokeWidth="4"
            fill="none"
            strokeDasharray="553"
            strokeDashoffset={553 - (553 * progress) / 100}
            strokeLinecap="round"
          />
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-24 h-24">
            {[0, 72, 144, 216, 288].map((angle, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 w-3 h-3 bg-[#06b6d4] rounded-full shadow-[0_0_10px_#06b6d4]"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: 1, 
                  scale: [1, 1.5, 1],
                  x: Math.cos((angle * Math.PI) / 180) * 30 - 6,
                  y: Math.sin((angle * Math.PI) / 180) * 30 - 6
                }}
                transition={{ delay: i * 0.1, duration: 1, repeat: Infinity }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex space-x-1 mb-4">
        {text.split('').map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 + 0.5, duration: 0.5 }}
            className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4]"
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </div>
      
      <div className="text-white/50 font-mono text-sm">
        INITIALIZING NEURAL NETWORK {Math.floor(progress)}%
      </div>
    </motion.div>
  );
};
