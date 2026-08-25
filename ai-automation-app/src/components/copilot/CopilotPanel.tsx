'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Minus, MoreHorizontal } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  "Write a prompt",
  "Caption ideas",
  "Hashtag suggestions",
  "Best posting time"
];

export function CopilotPanel({ isOpen, onClose }: CopilotPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi there! I am your AI Copilot. How can I help you create content today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content })
      });
      
      let aiContent = "I'm a bit busy right now. Could you try again later?";
      if (res.ok) {
        const data = await res.json();
        if (data.reply) aiContent = data.reply;
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Oops, I encountered an error connecting to my brain.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (text: string) => {
    setInputValue(text);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-24 right-6 w-[380px] h-[550px] z-50 flex flex-col rounded-2xl bg-[#09090b]/95 backdrop-blur-xl border border-violet-500/30 shadow-[0_10px_40px_rgba(139,92,246,0.15)] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white">
                  <Sparkles size={16} />
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#09090b]" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-zinc-100">AI Copilot</h3>
                <p className="text-[10px] text-green-400">Online</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Minus size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
              >
                <div 
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-violet-600 to-cyan-600 text-white rounded-tr-sm' 
                      : 'bg-white/[0.05] border border-white/[0.08] text-zinc-200 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-zinc-600 mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            
            {isLoading && (
              <div className="self-start max-w-[85%] flex items-center gap-2 px-4 py-3 rounded-2xl rounded-tl-sm bg-white/[0.05] border border-white/[0.08]">
                <MoreHorizontal size={20} className="text-zinc-500 animate-pulse" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-white/[0.08] bg-white/[0.02]">
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar hide-scroll-bar">
              {QUICK_ACTIONS.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickAction(action)}
                  className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.05] text-[11px] text-zinc-300 transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
            <form onSubmit={handleSend} className="relative mt-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything..."
                className="w-full pl-4 pr-12 py-3 rounded-xl bg-[#09090b] border border-white/[0.1] focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none text-sm text-zinc-100 placeholder:text-zinc-600 transition-all"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-1.5 top-1.5 p-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} className="ml-0.5" />
              </button>
            </form>
            <div className="text-center mt-2 text-[10px] text-zinc-600">
              Powered by Mistral AI
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
