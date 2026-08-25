"use client"
import { useRef, useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'ghost' | 'outline';
}

export const MagneticButton = ({ children, className = '', onClick, href, variant = 'primary' }: MagneticButtonProps) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!buttonRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;
    
    // Magnetic pull strength (less = stronger)
    setPosition({ x: distanceX * 0.2, y: distanceY * 0.2 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const baseClasses = "relative inline-flex items-center justify-center px-6 py-2.5 rounded-full font-medium transition-all duration-300 overflow-hidden";
  
  const variants = {
    primary: "bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]",
    ghost: "bg-transparent text-white/90 hover:text-white border border-white/20 hover:border-white/50",
    outline: "bg-transparent text-white border border-[#8b5cf6] hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]",
  };

  const content = (
    <motion.div
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className="inline-block"
    >
      <div 
        className={`${baseClasses} ${variants[variant]} ${className}`}
        onClick={onClick}
      >
        <span className="relative z-10">{children}</span>
        {isHovered && variant === 'primary' && (
          <motion.div
            layoutId="glow"
            className="absolute inset-0 bg-white/20 blur-md rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </div>
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return <button onClick={onClick} className="p-0 bg-transparent border-none outline-none">{content}</button>;
};
