import { useState, useEffect } from 'react';

export const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0, rawX: 0, rawY: 0 });

  useEffect(() => {
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const updateMousePosition = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth) * 2 - 1;
      targetY = -(e.clientY / window.innerHeight) * 2 + 1;
      
      setMousePosition(prev => ({
        ...prev,
        rawX: e.clientX,
        rawY: e.clientY
      }));
    };

    window.addEventListener('mousemove', updateMousePosition);

    let animationFrameId: number;
    const render = () => {
      currentX += (targetX - currentX) * 0.1;
      currentY += (targetY - currentY) * 0.1;
      
      setMousePosition(prev => ({
        ...prev,
        x: currentX,
        y: currentY
      }));
      
      animationFrameId = requestAnimationFrame(render);
    };
    
    render();

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return mousePosition;
};
