"use client";

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Float, OrbitControls } from '@react-three/drei';
import FloatingPanels from './FloatingPanels';

export default function ProductShowcaseCanvas() {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 45 }} className="rounded-3xl w-full h-full">
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
        <FloatingPanels />
      </Float>
      <Environment preset="city" />
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  );
}
