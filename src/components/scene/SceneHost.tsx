"use client";

import { Component, ReactNode, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import { invitation } from "@/config/invitation";
import Monogram from "../Monogram";

const Scene3D = dynamic(() => import("./Scene3D"), { ssr: false });

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Graceful static composition shown if 3D is off, unsupported or fails. */
function Fallback({ note }: { note: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-6 text-center">
      <div
        className="grid place-items-center border border-rose/60"
        style={{ borderRadius: "999px 999px 0 0", width: "min(70%, 260px)", aspectRatio: "3 / 4" }}
      >
        <Monogram size={120} />
      </div>
      <p className="text-sm italic text-ivory/80">{note}</p>
    </div>
  );
}

export default function SceneHost() {
  const wrap = useRef<HTMLDivElement>(null);
  const reduce = !!useReducedMotion();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [visible, setVisible] = useState(false);
  const [quality, setQuality] = useState<"high" | "low">("high");
  const [fine, setFine] = useState(false);
  const [hinted, setHinted] = useState(false);

  useEffect(() => {
    setSupported(hasWebGL());
    const nav = navigator as Navigator & { deviceMemory?: number };
    const weak =
      (nav.hardwareConcurrency ?? 8) <= 4 ||
      (nav.deviceMemory ?? 8) <= 4 ||
      window.matchMedia("(max-width: 640px)").matches;
    setQuality(weak ? "low" : "high");
    setFine(window.matchMedia("(pointer: fine)").matches);
  }, []);

  // Stop rendering whenever the scene is scrolled offscreen or the tab is hidden.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let inView = false;
    const update = () => setVisible(inView && !document.hidden);
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      update();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  const off = !invitation.features.scene3D;
  const note = off ? "" : "The 3D scene is unavailable on this device.";

  return (
    <div
      ref={wrap}
      className="relative h-full w-full"
      role="img"
      aria-label="An animated 3D scene of a bride in an ivory gown and a groom in a black tuxedo, dancing beneath a floral arch as sunset turns to a starry night, with their childhood photo framed on an easel beside them. Tap the couple to make them twirl, or drag sideways to turn the scene."
    >
      {off || supported === false ? (
        <Fallback note={note} />
      ) : supported ? (
        <Boundary fallback={<Fallback note="The 3D scene is unavailable on this device." />}>
          <Scene3D
            quality={quality}
            active={visible}
            pointerParallax={fine && !reduce}
            reduceMotion={reduce}
            onInteract={() => setHinted(true)}
          />
          {!reduce && (
            <p
              aria-hidden
              className={`pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[0.6rem] uppercase tracking-[0.2em] sm:text-[0.65rem] sm:tracking-[0.28em] text-ivory/80 [text-shadow:0_1px_8px_rgba(30,20,10,0.9)] transition-opacity duration-700 ${
                hinted ? "opacity-0" : "opacity-100"
              }`}
            >
              {fine ? "Click" : "Tap"} to twirl &middot; drag to turn
            </p>
          )}
        </Boundary>
      ) : null}
    </div>
  );
}
