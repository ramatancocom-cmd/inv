"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { invitation } from "@/config/invitation";
import Arch from "./Arch";
import { Bride, Groom } from "./Figures";
import FramedPhoto from "./FramedPhoto";
import Ambience from "./Ambience";
import { Suspense } from "react";
import Sky, { nightAmount } from "./Sky";
import { invitationOpened, resetSceneTime, sceneTime } from "./time";

const { palette } = invitation;

export type Quality = "high" | "low";

/** Timeline (seconds): 0-3.2 entrance + turn, then a continuous slow dance. */
const ENTRANCE = 3.2;
const smooth = (x: number) => {
  const t = Math.min(Math.max(x, 0), 1);
  return t * t * (3 - 2 * t);
};

/** Shared pointer state: drag-to-turn angle and the tap-to-twirl trigger. */
export type Interaction = {
  down: boolean;
  startX: number;
  startY: number;
  lastX: number;
  moved: number;
  horizontal: boolean | null;
  angle: number;
  velocity: number;
  lastInput: number;
  twirlAt: number | null;
};

const TWIRL = 2.6;

function Couple({ reduceMotion, ix, onInteract }: { reduceMotion: boolean; ix: Interaction; onInteract: () => void }) {
  const root = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const bride = useRef<THREE.Group>(null);
  const groom = useRef<THREE.Group>(null);
  const skirt = useRef<THREE.Group>(null);
  const hands = useRef({ k: 0 });

  useFrame((state) => {
    // Tap-to-twirl: one full, eased turn together with a flare of the skirt.
    let flare = 0;
    if (spin.current) {
      const p = ix.twirlAt === null ? 1 : (sceneTime() - ix.twirlAt) / TWIRL;
      if (p >= 1) {
        ix.twirlAt = null;
        spin.current.rotation.y = 0;
      } else {
        const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        spin.current.rotation.y = e * Math.PI * 2;
        flare = Math.sin(p * Math.PI);
        spin.current.position.y = flare * 0.06;
      }
    }
    const t = reduceMotion ? 99 : sceneTime();
    const turn = smooth((t - 0.4) / (ENTRANCE - 0.4));
    const enter = smooth(t / 2.2);
    const dance = smooth((t - ENTRANCE) / 2);
    const w = t - ENTRANCE;

    // Entrance: they step in from the sides, turn from the audience toward each other.
    const gap = THREE.MathUtils.lerp(1.5, 0.5, enter);
    if (bride.current && groom.current) {
      bride.current.position.x = -gap;
      groom.current.position.x = gap;
      bride.current.rotation.y = THREE.MathUtils.lerp(0.35, Math.PI / 2, turn);
      groom.current.rotation.y = THREE.MathUtils.lerp(-0.35, -Math.PI / 2, turn);
    }
    hands.current.k = turn;

    // Slow waltz sweep and a gentle rise/fall.
    if (root.current) {
      const sweep = reduceMotion ? 0 : Math.sin(w * 0.45) * 0.38 * dance;
      root.current.rotation.y = sweep;
      root.current.position.y = reduceMotion ? 0 : Math.sin(w * 0.9) * 0.025 * dance;
    }
    if (skirt.current && !reduceMotion) {
      skirt.current.rotation.z = Math.sin(w * 0.9 + 0.6) * 0.035 * dance;
      skirt.current.rotation.x = Math.cos(w * 0.9) * 0.025 * dance;
      const s = 1 + Math.sin(w * 1.8) * 0.012 * dance + flare * 0.14;
      skirt.current.scale.set(s, 1 - flare * 0.04, s);
    }
  });

  return (
    <group ref={root}>
      <group
        ref={spin}
        onClick={(e) => {
          e.stopPropagation();
          if (ix.moved > 8 || ix.twirlAt !== null || reduceMotion) return;
          ix.twirlAt = -1; // resolved to the clock time on the next frame
          onInteract();
        }}
        onPointerOver={() => {
          if (!reduceMotion) document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <group ref={bride} position={[-1.5, 0.18, 0.05]}>
          <Bride skirtRef={skirt} hands={hands} />
        </group>
        <group ref={groom} position={[1.5, 0.18, 0.05]}>
          <Groom hands={hands} />
        </group>
      </group>
    </group>
  );
}

/** Everything on the platform; turns with horizontal drags and drifts back home when idle. */
function World({ ix, children }: { ix: Interaction; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, dt) => {
    if (ix.twirlAt === -1) ix.twirlAt = sceneTime();
    if (!ix.down) {
      ix.angle += ix.velocity;
      ix.velocity *= 0.92;
      // After a few quiet seconds, glide back to the front view.
      if (performance.now() - ix.lastInput > 3500) {
        ix.angle = wrap(ix.angle);
        ix.angle -= ix.angle * Math.min(dt * 1.2, 0.05);
      }
    }
    if (ref.current) ref.current.rotation.y = ix.angle;
  });
  return <group ref={ref}>{children}</group>;
}

/** Shortest equivalent angle in (-PI, PI]. */
function wrap(a: number) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

function Rig({
  pointerParallax,
  reduceMotion,
}: {
  pointerParallax: boolean;
  reduceMotion: boolean;
}) {
  const look = useMemo(() => new THREE.Vector3(0, 2.35, 0), []);
  useFrame((state) => {
    const t = sceneTime();
    const reveal = reduceMotion ? 1 : smooth(t / 5);
    const px = pointerParallax ? state.pointer.x : 0;
    const py = pointerParallax ? state.pointer.y : 0;
    const cam = state.camera as THREE.PerspectiveCamera;
    // Fit the arch and platform for any aspect ratio.
    const half = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const fit = Math.max(2.5 / half, 2.8 / (half * cam.aspect));
    // Slow cinematic drift once the reveal settles.
    const drift = reduceMotion ? 0 : reveal;
    const tx = px * 0.9 + Math.sin(t * 0.11) * 0.9 * drift;
    const ty = 2.5 + py * 0.25 + (1 - reveal) * 0.8 + Math.sin(t * 0.07) * 0.18 * drift;
    const tz = fit + 0.6 + (1 - reveal) * 3;
    cam.position.x += (tx - cam.position.x) * 0.05;
    cam.position.y += (ty - cam.position.y) * 0.05;
    cam.position.z += (tz - cam.position.z) * 0.05;
    cam.lookAt(look);
  });
  return null;
}

/** Warm sunset light that cools and softens as night falls. */
function DayNightLights({ high, reduceMotion }: { high: boolean; reduceMotion: boolean }) {
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.PointLight>(null);
  const moon = useRef<THREE.PointLight>(null);
  const warm = useMemo(() => new THREE.Color("#ffd2a0"), []);
  const cool = useMemo(() => new THREE.Color("#d6d8f2"), []);
  useFrame((state) => {
    const n = nightAmount(sceneTime(), reduceMotion);
    if (hemi.current) hemi.current.intensity = THREE.MathUtils.lerp(0.75, 0.42, n);
    if (sun.current) {
      sun.current.intensity = THREE.MathUtils.lerp(2.3, 1.15, n);
      sun.current.color.copy(warm).lerp(cool, n);
    }
    if (fill.current) fill.current.intensity = THREE.MathUtils.lerp(14, 8, n);
    if (moon.current) moon.current.intensity = THREE.MathUtils.lerp(0, 10, n);
  });
  return (
    <>
      <hemisphereLight ref={hemi} args={["#fff1d6", "#5a4630", 0.75]} />
      <directionalLight
        ref={sun}
        position={[4, 6, 5]}
        intensity={2.3}
        color="#ffd2a0"
        castShadow={high}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={5}
        shadow-camera-bottom={-1}
        shadow-bias={-0.0004}
      />
      <pointLight ref={fill} position={[-4, 2.5, 3]} intensity={14} color="#f0c890" distance={12} />
      <pointLight position={[0, 3.5, 2.5]} intensity={9} color="#ffcf8a" distance={10} />
      <pointLight ref={moon} position={[-3.5, 5.5, 1]} intensity={0} color="#e8dcff" distance={14} />
    </>
  );
}

export default function Scene3D({
  quality,
  active,
  pointerParallax,
  reduceMotion,
  onInteract,
}: {
  quality: Quality;
  active: boolean;
  pointerParallax: boolean;
  reduceMotion: boolean;
  onInteract?: () => void;
}) {
  const high = quality === "high";
  // If the scene loads after the envelope was opened, start its timeline now.
  useState(() => {
    if (invitationOpened()) resetSceneTime();
    return 0;
  });
  const ix = useRef<Interaction>({
    down: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    moved: 0,
    horizontal: null,
    angle: 0,
    velocity: 0,
    lastInput: 0,
    twirlAt: null,
  }).current;
  const interacted = () => onInteract?.();

  // Horizontal drags turn the scene; vertical swipes are left to the page so scrolling never breaks.
  const onPointerDown = (e: React.PointerEvent) => {
    if (reduceMotion) return;
    Object.assign(ix, { down: true, startX: e.clientX, startY: e.clientY, lastX: e.clientX, moved: 0, horizontal: null, velocity: 0 });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!ix.down) return;
    const dx = e.clientX - ix.startX;
    const dy = e.clientY - ix.startY;
    ix.moved = Math.max(ix.moved, Math.hypot(dx, dy));
    if (ix.horizontal === null && ix.moved > 6) ix.horizontal = Math.abs(dx) > Math.abs(dy);
    if (!ix.horizontal) return;
    const step = (e.clientX - ix.lastX) * 0.008;
    ix.angle += step;
    ix.velocity = step;
    ix.lastX = e.clientX;
    ix.lastInput = performance.now();
    interacted();
  };
  const onPointerUp = () => {
    ix.down = false;
    ix.lastInput = performance.now();
  };

  return (
    <div
      className="h-full w-full"
      style={{ touchAction: "pan-y", cursor: reduceMotion ? undefined : "grab" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={high ? [1, 1.75] : [1, 1.1]}
        shadows={high}
        camera={{ position: [0, 3.0, 14], fov: 32, near: 0.1, far: 60 }}
        gl={{ antialias: high, alpha: true, powerPreference: high ? "high-performance" : "low-power" }}
        style={{ touchAction: "pan-y" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <DayNightLights high={high} reduceMotion={reduceMotion} />
        {high && (
          <Environment resolution={128} frames={1}>
            <Lightformer form="rect" intensity={2.5} color="#ffe2b0" position={[3, 3, 5]} scale={[6, 4, 1]} />
            <Lightformer form="rect" intensity={1.2} color="#f5dca0" position={[-5, 2, 2]} scale={[4, 4, 1]} />
            <Lightformer form="ring" intensity={1.5} color="#ffffff" position={[0, 6, -3]} scale={4} />
          </Environment>
        )}

        <Sky quality={quality} reduceMotion={reduceMotion} />

        <World ix={ix}>
          {/* platform */}
          <mesh position={[0, 0.09, 0]} receiveShadow castShadow>
            <cylinderGeometry args={[2.6, 2.7, 0.18, high ? 96 : 48]} />
            <meshStandardMaterial color={palette.blush} roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.185, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[2.6, 0.018, 8, high ? 128 : 64]} />
            <meshStandardMaterial color={palette.rose} metalness={0.9} roughness={0.28} />
          </mesh>

          <Arch quality={quality} reduceMotion={reduceMotion} />
          <Ambience quality={quality} reduceMotion={reduceMotion} />
          <Suspense fallback={null}>
            <FramedPhoto />
          </Suspense>
          <Couple reduceMotion={reduceMotion} ix={ix} onInteract={interacted} />
          {high && (
            <ContactShadows position={[0, 0.19, 0]} opacity={0.45} scale={7} blur={2.4} far={2.5} resolution={512} frames={Infinity} />
          )}
        </World>
        <Rig pointerParallax={pointerParallax} reduceMotion={reduceMotion} />
      </Canvas>
    </div>
  );
}
