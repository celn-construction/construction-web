'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, RoundedBox } from '@react-three/drei';
import type { Group } from 'three';

const rects = [
  { x: 3, y: 3, w: 3, h: 18 },
  { x: 3, y: 3, w: 18, h: 3 },
  { x: 18, y: 3, w: 3, h: 10 },
  { x: 10, y: 9, w: 2.5, h: 12 },
] as const;

const DEPTH = 2.5;
const SCALE = 0.18;

function LogoMesh() {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.6;
    }
  });

  return (
    <group ref={groupRef} scale={SCALE}>
      {rects.map((r, i) => {
        const cx = r.x + r.w / 2 - 12;
        const cy = 12 - (r.y + r.h / 2);
        return (
          <RoundedBox
            key={i}
            args={[r.w, r.h, DEPTH]}
            position={[cx, cy, 0]}
            radius={0.35}
            smoothness={4}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color="#1a1d2b"
              metalness={0.6}
              roughness={0.25}
            />
          </RoundedBox>
        );
      })}
    </group>
  );
}

export default function Logo3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 40 }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-5, -3, -2]} intensity={0.4} />
      <Environment preset="studio" />
      <LogoMesh />
    </Canvas>
  );
}
