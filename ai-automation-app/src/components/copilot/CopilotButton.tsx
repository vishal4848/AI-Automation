'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

interface CopilotButtonProps {
  isOpen: boolean;
  onClick: () => void;
  unreadCount: number;
}

export function CopilotButton({ isOpen, onClick, unreadCount }: CopilotButtonProps) {
  return (
    <motion.div 
      className="fixed bottom-6 right-6 z-50"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <div className="relative group">
        {/* Animated ring */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 animate-ping opacity-20" />
        )}
        
        <button
          onClick={onClick}
          className="relative w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 shadow-[0_0_20px_rgba(139,92,246,0.4)] flex items-center justify-center text-white hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-shadow"
        >
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0, scale: isOpen ? 0 : 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Sparkles size={24} />
          </motion.div>
          <motion.div
            animate={{ rotate: isOpen ? 0 : -90, scale: isOpen ? 1 : 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <X size={24} />
          </motion.div>
        </button>

        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && !isOpen && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-[#09090b] flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
            >
              {unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
