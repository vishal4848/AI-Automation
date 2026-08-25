import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';

// Singleton lenis instance shared across the app
let globalLenis: Lenis | null = null;

export const useLenis = () => {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Re-use existing instance if already created
    if (globalLenis) {
      lenisRef.current = globalLenis;
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    globalLenis = lenis;
    lenisRef.current = lenis;

    const ticker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(ticker);
      lenis.destroy();
      globalLenis = null;
    };
  }, []);

  return lenisRef.current;
};
