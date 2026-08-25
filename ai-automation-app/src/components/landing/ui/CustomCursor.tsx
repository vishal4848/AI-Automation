"use client"
import { useEffect, useRef, useState } from 'react';

export const CustomCursor = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  
  const [isMobile, setIsMobile] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(pointer: coarse)').matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
      }

      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === 'a' || 
        target.tagName.toLowerCase() === 'button' ||
        target.closest('a') ||
        target.closest('button')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', onMouseMove);

    let animationFrameId: number;
    const render = () => {
      ringX += (mouseX - ringX) * 0.1;
      ringY += (mouseY - ringY) * 0.1;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX}px, ${ringY}px)`;
      }
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <>
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
          isHovering 
            ? 'w-[60px] h-[60px] border border-white/50 mix-blend-difference' 
            : 'w-[40px] h-[40px] border border-[#8b5cf6]/50'
        }`}
        style={{
          boxShadow: isHovering ? 'none' : '0 0 10px rgba(139, 92, 246, 0.3)',
        }}
      />
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-3 h-3 bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] rounded-full pointer-events-none z-[10000] -translate-x-1/2 -translate-y-1/2"
        style={{
          boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)',
        }}
      />
    </>
  );
};
