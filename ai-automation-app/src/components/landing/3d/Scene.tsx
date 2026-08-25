"use client"
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, PerformanceMonitor, Stars } from '@react-three/drei';
import { Bloom, EffectComposer, FXAA, ToneMapping } from '@react-three/postprocessing';
import { Suspense, useState, useEffect } from 'react';
import { Background } from './Background';
import { AIBrain } from './AIBrain';
import * as THREE from 'three';

interface SceneProps {
  className?: string;
  style?: React.CSSProperties;
  showBrain?: boolean;
  brainRef?: React.RefObject<THREE.Group | null>;
}

export default function Scene({ className, style, showBrain = true, brainRef }: SceneProps) {
  const [dpr, setDpr] = useState(1.5);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={className || "w-full h-full"} style={{ width: '100%', height: '100%', ...style }} />;
  }

  return (
    <div className={className || "w-full h-full"} style={{ width: '100%', height: '100%', position: 'relative', ...style }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        shadows
        gl={{ antialias: false, powerPreference: 'high-performance', alpha: true }}
        dpr={dpr as any}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} />
        <AdaptiveDpr pixelated />
        
        <color attach="background" args={['#09090b']} />
        
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} color="#8b5cf6" intensity={2} />
        <pointLight position={[-5, -5, -5]} color="#06b6d4" intensity={2} />

        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

        <Suspense fallback={null}>
          <Background />
          {showBrain && (
            <group ref={brainRef as any}>
              <AIBrain />
            </group>
          )}
          
          <EffectComposer multisampling={0}>
            <Bloom luminanceThreshold={0.2} intensity={1.5} mipmapBlur />
            <FXAA />
            <ToneMapping />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
