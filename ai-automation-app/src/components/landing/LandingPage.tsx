"use client"
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLenis } from '@/hooks/useLenis';
import { Loader } from './ui/Loader';
import { CustomCursor } from './ui/CustomCursor';
import { LandingNavbar } from './ui/LandingNavbar';
import Hero from './sections/Hero';
import Features from './sections/Features';
import Workflow from './sections/Workflow';
import ProductShowcase from './sections/ProductShowcase';
import SocialAutomation from './sections/SocialAutomation';
import AIShowcase from './sections/AIShowcase';
import Testimonials from './sections/Testimonials';
import Pricing from './sections/Pricing';
import Footer from './sections/Footer';

export default function LandingPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  useLenis();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: fine)');
    const updateCursor = () => {
      if (mediaQuery.matches) {
        document.body.style.cursor = 'none';
      } else {
        document.body.style.cursor = 'auto';
      }
    };
    updateCursor();
    mediaQuery.addEventListener('change', updateCursor);
    return () => {
      mediaQuery.removeEventListener('change', updateCursor);
      document.body.style.cursor = 'auto';
    };
  }, []);

  return (
    <main className="bg-[#09090b] min-h-screen text-white overflow-x-hidden relative">
      <AnimatePresence>
        {!isLoaded && <Loader onComplete={() => setIsLoaded(true)} />}
      </AnimatePresence>

      <CustomCursor />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.8 }}
      >
        <LandingNavbar />
        <section id="hero">
          <Hero />
        </section>
        <section id="features">
          <Features />
        </section>
        <section id="workflow">
          <Workflow />
        </section>
        <section id="product">
          <ProductShowcase />
        </section>
        <section id="social">
          <SocialAutomation />
        </section>
        <section id="showcase">
          <AIShowcase />
        </section>
        <section id="testimonials">
          <Testimonials />
        </section>
        <section id="pricing">
          <Pricing />
        </section>
        <Footer />
      </motion.div>
    </main>
  );
}
