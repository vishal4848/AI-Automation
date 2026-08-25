"use client"
import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export const AIBrain = () => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const neuronsRef = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Points>(null);
  const { viewport, mouse } = useThree();

  const scale = viewport.width < 768 ? 0.6 : 1;

  const ringsData = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number],
      radius: 1.8 + Math.random() * 1.7,
      speed: (Math.random() - 0.5) * 0.5,
      color: i % 2 === 0 ? '#8b5cf6' : '#06b6d4'
    }));
  }, []);

  const neuronsData = useMemo(() => {
    return Array.from({ length: 40 }, () => {
      const radius = 2.5 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      return {
        initialPos: new THREE.Vector3(x, y, z),
        speed: 0.1 + Math.random() * 0.2,
        radius,
        phase: Math.random() * Math.PI * 2
      };
    });
  }, []);

  const [cloudPos, cloudCols] = useMemo(() => {
    const count = 500;
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const c1 = new THREE.Color('#8b5cf6');
    const c2 = new THREE.Color('#06b6d4');
    const mc = new THREE.Color();

    for(let i=0; i<count; i++) {
      const r = 4 + Math.random() * 2;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(Math.random() * 2 - 1);
      pos[i*3] = r * Math.sin(p) * Math.cos(t);
      pos[i*3+1] = r * Math.sin(p) * Math.sin(t);
      pos[i*3+2] = r * Math.cos(p);

      mc.lerpColors(c1, c2, Math.random());
      cols[i*3] = mc.r;
      cols[i*3+1] = mc.g;
      cols[i*3+2] = mc.b;
    }
    return [pos, cols];
  }, []);

  useFrame((state, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.2;
      coreRef.current.rotation.x += delta * 0.1;
    }

    if (ringsRef.current) {
      ringsRef.current.children.forEach((ring, i) => {
        ring.rotation.x += delta * ringsData[i].speed;
        ring.rotation.y += delta * ringsData[i].speed;
      });
    }

    if (neuronsRef.current) {
      neuronsRef.current.children.forEach((neuron, i) => {
        if(neuron.type === 'Mesh') {
            const data = neuronsData[Math.floor(i/2)]; 
            const time = state.clock.elapsedTime * data.speed + data.phase;
            
            neuron.position.x = data.initialPos.x * Math.cos(time);
            neuron.position.z = data.initialPos.z * Math.sin(time);
            neuron.position.y = data.initialPos.y + Math.sin(time * 2) * 0.5;

            const line = neuronsRef.current!.children[i+1] as THREE.Line;
            if(line) {
                const positions = line.geometry.attributes.position.array as Float32Array;
                positions[3] = neuron.position.x;
                positions[4] = neuron.position.y;
                positions[5] = neuron.position.z;
                line.geometry.attributes.position.needsUpdate = true;
            }
        }
      });
    }

    if (cloudRef.current) {
      cloudRef.current.rotation.y -= delta * 0.1;
      cloudRef.current.rotation.z -= delta * 0.05;
    }

    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.5;
      
      const targetRotationX = (mouse.y * Math.PI) / 12; 
      const targetRotationY = (mouse.x * Math.PI) / 12;
      
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotationX, 0.1);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotationY, 0.1);
    }
  });

  return (
    <group ref={groupRef} scale={scale}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshPhysicalMaterial
          roughness={0}
          metalness={0.8}
          transmission={0.3}
          emissive="#8b5cf6"
          emissiveIntensity={2}
          toneMapped={false}
          transparent
          opacity={0.9}
        />
      </mesh>

      <group ref={ringsRef}>
        {ringsData.map((data, i) => (
          <mesh key={i} rotation={data.rotation}>
            <torusGeometry args={[data.radius, 0.02, 16, 100]} />
            <meshStandardMaterial color={data.color} emissive={data.color} emissiveIntensity={2} toneMapped={false} />
          </mesh>
        ))}
      </group>

      <group ref={neuronsRef}>
        {neuronsData.map((data, i) => (
          <group key={i}>
            <mesh position={data.initialPos}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3} toneMapped={false} />
            </mesh>
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[new Float32Array([0, 0, 0, data.initialPos.x, data.initialPos.y, data.initialPos.z]), 3]}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#06b6d4" transparent opacity={0.3} />
            </line>
          </group>
        ))}
      </group>

      <points ref={cloudRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[cloudPos, 3]} />
          <bufferAttribute attach="attributes-color" args={[cloudCols, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.05} vertexColors transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
};
