"use client";

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function FloatingPanels() {
  const groupRef = useRef<THREE.Group>(null);
  
  const panels = useMemo(() => {
    return Array.from({ length: 5 }).map((_, i) => {
      const angle = (i / 5) * Math.PI * 2;
      const radius = 2.5;
      return {
        position: [Math.cos(angle) * radius, (Math.random() - 0.5) * 2, Math.sin(angle) * radius] as [number, number, number],
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5
      };
    });
  }, []);

  const panelRefs = useRef<(THREE.Group | null)[]>([]);
  const particleRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.05;
    }

    panelRefs.current.forEach((group, i) => {
      if (group) {
        group.position.y = panels[i].position[1] + Math.sin(time * panels[i].speed + panels[i].phase) * 0.5;
        group.rotation.y = Math.sin(time * 0.2 + i) * 0.2;
      }
    });

    particleRefs.current.forEach((particle, i) => {
      if (particle) {
        const p1 = panelRefs.current[i];
        const p2 = panelRefs.current[(i + 1) % panels.length];
        
        if (p1 && p2) {
          const t = (time * 0.5 + i * 0.2) % 1;
          particle.position.lerpVectors(p1.position, p2.position, t);
        }
      }
    });
  });

  return (
    <group ref={groupRef}>
      {panels.map((panel, i) => (
        <group key={i} position={panel.position} ref={(el) => { panelRefs.current[i] = el; }}>
          <mesh>
            <boxGeometry args={[1.5, 1, 0.05]} />
            <meshPhysicalMaterial 
              color="#09090b"
              transmission={0.4}
              opacity={0.9}
              transparent
              roughness={0.1}
              metalness={0.5}
            />
            <mesh scale={[1.02, 1.02, 1.02]}>
              <boxGeometry args={[1.5, 1, 0.05]} />
              <meshBasicMaterial color={i % 2 === 0 ? "#8b5cf6" : "#06b6d4"} wireframe transparent opacity={0.3} />
            </mesh>
          </mesh>
        </group>
      ))}

      {panels.map((_, i) => (
        <mesh key={`particle-${i}`} ref={(el) => { particleRefs.current[i] = el; }}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color={i % 2 === 0 ? "#8b5cf6" : "#06b6d4"} />
        </mesh>
      ))}
      
      <DynamicLines panels={panels} panelRefs={panelRefs} />
    </group>
  );
}

function DynamicLines({ panels, panelRefs }: { panels: any[], panelRefs: React.MutableRefObject<(THREE.Group | null)[]> }) {
  return (
    <>
      {panels.map((_, i) => (
        <LineConnection key={i} p1Ref={panelRefs} i1={i} i2={(i + 1) % panels.length} />
      ))}
    </>
  );
}

function LineConnection({ p1Ref, i1, i2 }: { p1Ref: React.MutableRefObject<(THREE.Group | null)[]>, i1: number, i2: number }) {
  const lineRef = useRef<THREE.Line>(null);

  const lineMesh = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const mat = new THREE.LineBasicMaterial({
      color: i1 % 2 === 0 ? '#8b5cf6' : '#06b6d4',
      transparent: true,
      opacity: 0.3,
    });
    const l = new THREE.Line(geo, mat);
    return l;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    if (lineMesh && p1Ref.current[i1] && p1Ref.current[i2]) {
      const positions = lineMesh.geometry.attributes.position.array as Float32Array;
      const v1 = p1Ref.current[i1]!.position;
      const v2 = p1Ref.current[i2]!.position;
      positions[0] = v1.x; positions[1] = v1.y; positions[2] = v1.z;
      positions[3] = v2.x; positions[4] = v2.y; positions[5] = v2.z;
      lineMesh.geometry.attributes.position.needsUpdate = true;
    }
  });

  return <primitive object={lineMesh} ref={lineRef} />;
}

