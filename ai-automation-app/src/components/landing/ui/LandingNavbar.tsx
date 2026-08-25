"use client"
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Menu, X, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { useLenis } from '@/hooks/useLenis';
import { MagneticButton } from './MagneticButton';

export const LandingNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    if (lenis) {
      lenis.scrollTo(id, { offset: -80 });
    } else {
      const el = document.getElementById(id.replace('#', ''));
      if(el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How it Works', href: '#workflow' },
    { name: 'Pricing', href: '#pricing' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-black/40 backdrop-blur-xl border-b border-white/5 py-3' 
            : 'bg-transparent py-5'
        }`}
      >
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <Sparkles className="w-6 h-6 text-[#06b6d4] group-hover:text-[#8b5cf6] transition-colors" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 group-hover:from-[#8b5cf6] group-hover:to-[#06b6d4] transition-all">
                AI Automation
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => scrollTo(link.href)}
                  className="text-sm text-white/70 hover:text-white transition-colors relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] transition-all duration-300 group-hover:w-full" />
                </button>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/login" className="text-sm text-white/70 hover:text-white transition-colors px-4 py-2">
                Sign In
              </Link>
              <MagneticButton href="/login" variant="primary">
                Get Started
              </MagneticButton>
            </div>

            <button
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col pt-24 px-6 md:hidden"
          >
            <button
              className="absolute top-6 right-6 text-white p-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col gap-6 text-xl">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => scrollTo(link.href)}
                  className="text-left text-white/70 hover:text-white transition-colors py-2 border-b border-white/10"
                >
                  {link.name}
                </button>
              ))}
              <Link
                href="/login"
                className="text-left text-white/70 hover:text-white transition-colors py-2 border-b border-white/10 mt-4"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="mt-4 bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] text-white text-center py-3 rounded-full font-medium"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
