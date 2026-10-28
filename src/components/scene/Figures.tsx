"use client";

import { MutableRefObject, RefObject, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { invitation } from "@/config/invitation";

const { palette } = invitation;
const SKIN = "#D9AE8D";

type HandsRef = MutableRefObject<{ k: number }>;

/** Procedural lace motif: ivory satin with fine floral tracery. */
function useLaceTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    g.fillStyle = "#FBF4E6";
    g.fillRect(0, 0, 256, 256);
    g.strokeStyle = "rgba(150,115,40,0.4)";
    g.fillStyle = "rgba(201,162,39,0.3)";
    g.lineWidth = 1.2;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const cx = x * 64 + 32 + (y % 2) * 0;
        const cy = y * 64 + 32;
        for (let p = 0; p < 6; p++) {
          const a = (p / 6) * Math.PI * 2;
          g.beginPath();
          g.ellipse(cx + Math.cos(a) * 11, cy + Math.sin(a) * 11, 9, 4, a, 0, Math.PI * 2);
          g.stroke();
        }
        g.beginPath();
        g.arc(cx, cy, 3, 0, Math.PI * 2);
        g.fill();
        g.beginPath();
        g.moveTo(cx + 32, cy);
        g.arc(cx + 32, cy, 3, 0, Math.PI * 2);
        g.fill();
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(5, 2);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, []);
}

/** Two-segment arm that eases from a relaxed pose toward an engaged pose as hands.k goes 0 -> 1. */
function Arm({
  x,
  y,
  hands,
  rest,
  engaged,
  upperColor,
  foreColor,
  upperLen = 0.32,
  foreLen = 0.3,
  radius = 0.045,
  sleeveCap,
}: {
  x: number;
  y: number;
  hands: HandsRef;
  rest: { u: [number, number]; f: number };
  engaged: { u: [number, number]; f: number };
  upperColor: string;
  foreColor: string;
  upperLen?: number;
  foreLen?: number;
  radius?: number;
  sleeveCap?: string;
}) {
  const upper = useRef<THREE.Group>(null);
  const fore = useRef<THREE.Group>(null);
  useFrame(() => {
    const k = hands.current.k;
    const L = THREE.MathUtils.lerp;
    if (upper.current) {
      upper.current.rotation.x = L(rest.u[0], engaged.u[0], k);
      upper.current.rotation.z = L(rest.u[1], engaged.u[1], k);
    }
    if (fore.current) fore.current.rotation.x = L(rest.f, engaged.f, k);
  });
  return (
    <group ref={upper} position={[x, y, 0]}>
      <mesh position={[0, -upperLen / 2, 0]} castShadow>
        <capsuleGeometry args={[radius, upperLen - radius, 4, 10]} />
        <meshStandardMaterial color={upperColor} roughness={0.7} />
      </mesh>
      {sleeveCap && (
        <mesh position={[0, -0.05, 0]}>
          <sphereGeometry args={[radius * 1.35, 12, 10]} />
          <meshStandardMaterial color={sleeveCap} roughness={0.75} />
        </mesh>
      )}
      <group ref={fore} position={[0, -upperLen, 0]}>
        <mesh position={[0, -foreLen / 2, 0]} castShadow>
          <capsuleGeometry args={[radius * 0.85, foreLen - radius, 4, 10]} />
          <meshStandardMaterial color={foreColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, -foreLen - 0.02, 0]} castShadow>
          <sphereGeometry args={[radius * 0.95, 12, 10]} />
          <meshStandardMaterial color={SKIN} roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

function Head({ y, r, hair, bun }: { y: number; r: number; hair: string; bun?: boolean }) {
  return (
    <group position={[0, y, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[r, 24, 20]} />
        <meshStandardMaterial color={SKIN} roughness={0.6} />
      </mesh>
      <mesh position={[0, r * 0.22, -r * 0.3]} scale={[1, 1, 1]} castShadow>
        <sphereGeometry args={[r * 1.07, 24, 20]} />
        <meshStandardMaterial color={hair} roughness={0.55} />
      </mesh>
      {bun && (
        <mesh position={[0, r * 1.15, -r * 0.55]} castShadow>
          <sphereGeometry args={[r * 0.5, 16, 14]} />
          <meshStandardMaterial color={hair} roughness={0.55} />
        </mesh>
      )}
      {/* neck */}
      <mesh position={[0, -r * 1.15, 0]}>
        <cylinderGeometry args={[r * 0.38, r * 0.45, r * 0.9, 12]} />
        <meshStandardMaterial color={SKIN} roughness={0.6} />
      </mesh>
    </group>
  );
}

export function Bride({
  skirtRef,
  hands,
}: {
  skirtRef: RefObject<THREE.Group>;
  hands: HandsRef;
}) {
  const lace = useLaceTexture();
  const rose = { color: palette.rose, metalness: 0.85, roughness: 0.3 };

  // Gown silhouette: fitted waist flowing into a full, softly bell-shaped skirt.
  const skirtProfile = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 18; i++) {
      const t = i / 18; // 0 hem -> 1 waist
      const radius = 0.15 + Math.pow(1 - t, 1.55) * 0.68;
      pts.push(new THREE.Vector2(radius, 0.05 + t * 0.93));
    }
    return pts;
  }, []);
  const tulleProfile = useMemo(
    () => skirtProfile.map((p, i) => new THREE.Vector2(p.x * 1.05 + (i < 12 ? 0.03 : 0), p.y - 0.02)),
    [skirtProfile],
  );
  const scallops = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => {
        const a = (i / 40) * Math.PI * 2;
        return [Math.cos(a) * 0.865, 0.045, Math.sin(a) * 0.865] as [number, number, number];
      }),
    [],
  );

  return (
    <group>
      <group ref={skirtRef}>
        <mesh castShadow receiveShadow>
          <latheGeometry args={[skirtProfile, 56]} />
          <meshStandardMaterial map={lace} roughness={0.55} metalness={0.02} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <latheGeometry args={[tulleProfile, 56]} />
          <meshStandardMaterial color="#FFFDF7" roughness={0.9} transparent opacity={0.42} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        {scallops.map((p, i) => (
          <mesh key={i} position={p} scale={[1, 0.55, 1]}>
            <sphereGeometry args={[0.052, 8, 6]} />
            <meshStandardMaterial color="#FBF4E6" roughness={0.7} />
          </mesh>
        ))}
        <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.86, 0.01, 6, 80]} />
          <meshStandardMaterial {...rose} />
        </mesh>
      </group>

      {/* bodice */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.14, 0.46, 24]} />
        <meshStandardMaterial map={lace} roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.44, 0]} scale={[1, 0.5, 0.6]} castShadow>
        <sphereGeometry args={[0.22, 20, 14]} />
        <meshStandardMaterial color="#FBF4E6" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.98, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.15, 0.015, 8, 40]} />
        <meshStandardMaterial {...rose} />
      </mesh>

      <Head y={1.67} r={0.125} hair="#3A2418" bun />
      {/* sheer veil falling from the bun, open at the front */}
      <mesh position={[0, 1.3, -0.1]} rotation={[0.1, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.46, 1.0, 32, 1, true, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color={palette.ivory} transparent opacity={0.32} roughness={0.9} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* pearl hair comb */}
      {[-0.05, -0.017, 0.017, 0.05].map((x) => (
        <mesh key={x} position={[x, 1.79, -0.03]}>
          <sphereGeometry args={[0.011, 8, 6]} />
          <meshStandardMaterial color="#fff8f0" roughness={0.25} metalness={0.2} />
        </mesh>
      ))}

      {/* holding arm: her right (local -x) meets his left in the middle */}
      <Arm
        x={-0.2}
        y={1.42}
        hands={hands}
        rest={{ u: [0.04, 0.14], f: -0.15 }}
        engaged={{ u: [-0.75, 0.0], f: -1.15 }}
        upperColor="#FBF4E6"
        foreColor={SKIN}
        radius={0.04}
        sleeveCap="#FBF4E6"
      />
      {/* her left hand rests on his arm */}
      <Arm
        x={0.2}
        y={1.42}
        hands={hands}
        rest={{ u: [0.04, -0.14], f: -0.15 }}
        engaged={{ u: [-0.55, -0.12], f: -0.95 }}
        upperColor="#FBF4E6"
        foreColor={SKIN}
        radius={0.04}
        sleeveCap="#FBF4E6"
      />
    </group>
  );
}

export function Groom({ hands }: { hands: HandsRef }) {
  const suit = palette.suit;
  const rose = { color: palette.rose, metalness: 0.85, roughness: 0.3 };
  return (
    <group>
      {/* legs + shoes */}
      {[-0.095, 0.095].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.085, 0.075, 0.92, 14]} />
            <meshStandardMaterial color={suit} roughness={0.7} />
          </mesh>
          <mesh position={[x, 0.04, 0.06]} castShadow>
            <boxGeometry args={[0.13, 0.08, 0.28]} />
            <meshStandardMaterial color="#0A0E18" roughness={0.35} metalness={0.2} />
          </mesh>
        </group>
      ))}

      {/* jacket */}
      <mesh position={[0, 1.22, 0]} castShadow>
        <cylinderGeometry args={[0.235, 0.2, 0.7, 24]} />
        <meshStandardMaterial color={suit} roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.215, 0.14, 24]} />
        <meshStandardMaterial color={suit} roughness={0.72} />
      </mesh>
      <mesh position={[0, 1.55, 0]} scale={[1, 0.42, 0.62]} castShadow>
        <sphereGeometry args={[0.26, 20, 14]} />
        <meshStandardMaterial color={suit} roughness={0.72} />
      </mesh>
      {/* ivory shirt and lapels */}
      <mesh position={[0, 1.3, 0.18]}>
        <boxGeometry args={[0.1, 0.46, 0.05]} />
        <meshStandardMaterial color={palette.ivory} roughness={0.6} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.085, 1.3, 0.2]} rotation={[0, 0, s * -0.14]}>
          <boxGeometry args={[0.07, 0.5, 0.025]} />
          <meshStandardMaterial color="#100D0E" roughness={0.5} />
        </mesh>
      ))}
      {/* rose accents: buttons, pocket square, bow tie */}
      {[1.12, 1.02].map((y) => (
        <mesh key={y} position={[0, y, 0.215]}>
          <sphereGeometry args={[0.014, 10, 8]} />
          <meshStandardMaterial {...rose} />
        </mesh>
      ))}
      <mesh position={[0.13, 1.37, 0.205]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.06, 0.04, 0.02]} />
        <meshStandardMaterial {...rose} />
      </mesh>
      <group position={[0, 1.5, 0.19]}>
        <mesh position={[-0.03, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.03, 0.05, 8]} />
          <meshStandardMaterial {...rose} />
        </mesh>
        <mesh position={[0.03, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.03, 0.05, 8]} />
          <meshStandardMaterial {...rose} />
        </mesh>
      </group>
      {/* ivory boutonniere */}
      <mesh position={[-0.13, 1.38, 0.215]}>
        <sphereGeometry args={[0.024, 10, 8]} />
        <meshStandardMaterial color={palette.ivory} roughness={0.7} />
      </mesh>

      <Head y={1.79} r={0.138} hair="#1A1410" />

      {/* his left (local +x) holds hers; right arm rests at her waist */}
      <Arm
        x={0.25}
        y={1.52}
        hands={hands}
        rest={{ u: [0.03, -0.12], f: -0.15 }}
        engaged={{ u: [-0.78, 0.0], f: -1.12 }}
        upperColor={suit}
        foreColor={suit}
        upperLen={0.34}
        foreLen={0.32}
        radius={0.05}
        sleeveCap={suit}
      />
      <Arm
        x={-0.25}
        y={1.52}
        hands={hands}
        rest={{ u: [0.03, 0.12], f: -0.15 }}
        engaged={{ u: [-0.5, 0.12], f: -0.9 }}
        upperColor={suit}
        foreColor={suit}
        upperLen={0.34}
        foreLen={0.32}
        radius={0.05}
        sleeveCap={suit}
      />
    </group>
  );
}
