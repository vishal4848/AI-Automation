"use client"
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Background = () => {
  const particlesRef = useRef<THREE.Points>(null);
  const spheresRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.Group>(null);

  const particleCount = 3000;
  
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const cols = new Float32Array(particleCount * 3);
    
    const colorCyan = new THREE.Color('#06b6d4');
    const colorPurple = new THREE.Color('#8b5cf6');
    const mixedColor = new THREE.Color();
    
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
      
      const ratio = Math.random();
      mixedColor.lerpColors(colorCyan, colorPurple, ratio);
      cols[i * 3] = mixedColor.r;
      cols[i * 3 + 1] = mixedColor.g;
      cols[i * 3 + 2] = mixedColor.b;
    }
    return [pos, cols];
  }, [particleCount]);

  const sphereData = useMemo(() => {
    return Array.from({ length: 8 }, () => ({
      position: [
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      ] as [number, number, number],
      scale: 0.3 + Math.random() * 0.5,
      color: Math.random() > 0.5 ? '#8b5cf6' : '#06b6d4',
      phaseOffset: Math.random() * Math.PI * 2,
      speed: 0.2 + Math.random() * 0.5
    }));
  }, []);

  const nodeData = useMemo(() => {
    return Array.from({ length: 20 }, () => ({
      position: [
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40
      ] as [number, number, number],
      rotationSpeed: [
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      ] as [number, number, number],
      color: Math.random() > 0.6 ? '#ffffff' : Math.random() > 0.5 ? '#8b5cf6' : '#06b6d4'
    }));
  }, []);

  useFrame((state, delta) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += delta * 0.5; // drift upward
        positions[i * 3] += Math.sin(state.clock.elapsedTime + i) * 0.002; // drift sideways
        
        if (positions[i * 3 + 1] > 50) {
          positions[i * 3 + 1] = -50;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (spheresRef.current) {
      spheresRef.current.children.forEach((child, i) => {
        const data = sphereData[i];
        child.position.y = data.position[1] + Math.sin(state.clock.elapsedTime * data.speed + data.phaseOffset) * 2;
      });
    }

    if (nodesRef.current) {
      nodesRef.current.children.forEach((child, i) => {
        const data = nodeData[i];
        child.rotation.x += data.rotationSpeed[0];
        child.rotation.y += data.rotationSpeed[1];
        child.rotation.z += data.rotationSpeed[2];
      });
    }
  });

  return (
    <>
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.1}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>

      <group ref={spheresRef}>
        {sphereData.map((data, i) => (
          <mesh key={i} position={data.position} scale={data.scale}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial
              color={data.color}
              emissive={data.color}
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      <gridHelper args={[50, 50, '#8b5cf6', '#06b6d4']} position={[0, -5, 0]} material-opacity={0.1} material-transparent />

      <group ref={nodesRef}>
        {nodeData.map((data, i) => (
          <mesh key={i} position={data.position}>
            <octahedronGeometry args={[0.5, 0]} />
            <meshStandardMaterial
              color={data.color}
              emissive={data.color}
              emissiveIntensity={1.5}
              wireframe
            />
          </mesh>
        ))}
      </group>
    </>
  );
};
