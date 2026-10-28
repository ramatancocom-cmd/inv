"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { invitation } from "@/config/invitation";

const { palette } = invitation;

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Rose petals drifting down through the scene. */
function Petals({ count, still }: { count: number; still: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const petals = useMemo(() => {
    const r = rng(7);
    return Array.from({ length: count }, () => ({
      x: (r() - 0.5) * 6.4,
      y: r() * 5.6,
      z: -1.4 + r() * 3.6,
      speed: 0.12 + r() * 0.22,
      sway: 0.2 + r() * 0.5,
      phase: r() * Math.PI * 2,
      spin: (r() - 0.5) * 2.4,
      s: 0.7 + r() * 0.6,
    }));
  }, [count]);

  useLayoutEffect(() => {
    const m = ref.current!;
    const colors = [new THREE.Color(palette.blush), new THREE.Color("#FDF6E2"), new THREE.Color(palette.rose)];
    petals.forEach((_, i) => m.setColorAt(i, colors[i % 3]));
    m.instanceColor!.needsUpdate = true;
  }, [petals]);

  useFrame((state, dt) => {
    const m = ref.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    petals.forEach((p, i) => {
      if (!still) {
        p.y -= p.speed * Math.min(dt, 0.05);
        if (p.y < 0.22) p.y = 5.6;
      }
      dummy.position.set(p.x + Math.sin(t * 0.6 + p.phase) * p.sway, p.y, p.z + Math.cos(t * 0.5 + p.phase) * 0.15);
      dummy.rotation.set(t * p.spin + p.phase, t * p.spin * 0.7, p.phase);
      dummy.scale.set(0.06 * p.s, 0.038 * p.s, 0.012 * p.s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshStandardMaterial roughness={0.7} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

/** Rose-gold lantern with a softly flickering candle glow. */
function Lantern({ position, high, scale = 1 }: { position: [number, number, number]; high: boolean; scale?: number }) {
  const flame = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const seed = position[0] * 3.1;
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const f = 0.85 + Math.sin(t * 7 + seed) * 0.06 + Math.sin(t * 13.3 + seed) * 0.05;
    if (flame.current) flame.current.emissiveIntensity = 2.6 * f;
    if (light.current) light.current.intensity = 2.4 * f;
  });
  const metal = { color: palette.rose, metalness: 0.85, roughness: 0.3 };
  return (
    <group position={position} scale={scale}>
      {/* base, cap and ring */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.19, 0.04, 6]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <coneGeometry args={[0.2, 0.16, 6]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <torusGeometry args={[0.045, 0.01, 6, 16]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      {/* corner posts */}
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.16, 0.22, Math.sin(a) * 0.16]}>
            <cylinderGeometry args={[0.008, 0.008, 0.4, 4]} />
            <meshStandardMaterial {...metal} />
          </mesh>
        );
      })}
      {/* glass */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.155, 0.155, 0.4, 6, 1, true]} />
        <meshStandardMaterial color="#fff4ea" transparent opacity={0.16} roughness={0.1} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* candle + flame */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.16, 12]} />
        <meshStandardMaterial color={palette.ivory} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.235, 0]} scale={[1, 1.7, 1]}>
        <sphereGeometry args={[0.022, 10, 8]} />
        <meshStandardMaterial ref={flame} color="#ffd6a0" emissive="#ffb35c" emissiveIntensity={2.6} toneMapped={false} />
      </mesh>
      {high && <pointLight ref={light} position={[0, 0.3, 0]} color="#ffb870" intensity={2.4} distance={2.6} decay={2} />}
    </group>
  );
}

export default function Ambience({ quality, reduceMotion }: { quality: "high" | "low"; reduceMotion: boolean }) {
  const high = quality === "high";
  return (
    <>
      <Petals count={high ? 70 : 28} still={reduceMotion} />
      <Lantern position={[-2.15, 0.18, 1.05]} high={high} />
      <Lantern position={[-2.35, 0.18, 0.45]} high={high} scale={0.72} />
      <Lantern position={[2.3, 0.18, -0.5]} high={high} scale={0.85} />
      {!reduceMotion && (
        <Sparkles
          count={high ? 60 : 24}
          scale={[6.5, 4.5, 3]}
          position={[0, 2.4, -0.3]}
          size={high ? 2.4 : 2}
          speed={0.25}
          opacity={0.7}
          color="#ffd9b8"
        />
      )}
    </>
  );
}
