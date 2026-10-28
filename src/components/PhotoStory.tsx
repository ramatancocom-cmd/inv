"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { invitation } from "@/config/invitation";
import FlowerSpray from "./FlowerSpray";

const { couple, photo } = invitation;

/**
 * The couple's photo in a layered arch that tilts in 3D: with the pointer on
 * desktop, and gently with scroll on touch devices. Static under reduced motion.
 */
export default function PhotoStory() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scrollTilt = useTransform(scrollYProgress, [0, 1], [10, -10]);

  const rx = useSpring(useTransform([py, scrollTilt], ([p, s]: number[]) => (reduce ? 0 : p * -12 + s * 0.6)), {
    stiffness: 120,
    damping: 18,
  });
  const ry = useSpring(useTransform(px, (p) => (reduce ? 0 : p * 16)), { stiffness: 120, damping: 18 });

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  const arch = { borderRadius: "999px 999px 4px 4px" };

  return (
    <section
      className="relative overflow-hidden bg-blush px-6 py-24 sm:py-32"
      aria-labelledby="story-title"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 60% 50% at 50% 55%, rgba(255,252,244,0.85), transparent 70%)",
      }}
    >
      <div className="lace pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <FlowerSpray corner="tr" size="md" />
      <FlowerSpray corner="bl" size="md" />
      <div className="relative mx-auto max-w-5xl text-center">
        <p id="story-title" className="eyebrow text-rose-deep">
          Our Little Love Story
        </p>
        <p className="mt-4 font-script text-6xl leading-tight text-wine-soft sm:text-7xl">
          {couple.first} &amp; {couple.second}
        </p>
        <div className="mt-4 flex items-center justify-center gap-3" aria-hidden>
          <span className="rose-rule w-20" />
          <svg width="18" height="16" viewBox="0 0 24 22" fill="none" stroke="#7D5F12" strokeWidth="1.4">
            <path d="M12 20s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 5.8-8 11-8 11z" />
          </svg>
          <span className="rose-rule w-20" />
        </div>

        <div
          ref={ref}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          className="mx-auto mt-14 w-[min(82vw,420px)]"
          style={{ perspective: 1100 }}
        >
          <motion.div
            className="relative"
            style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* soft shadow layer, pushed back */}
            <div
              aria-hidden
              className="absolute inset-0 bg-wine/25 blur-2xl"
              style={{ ...arch, transform: "translateZ(-60px) translateY(24px)" }}
            />
            {/* outer arch line */}
            <div
              aria-hidden
              className="absolute -inset-4 border border-wine-soft/70"
              style={{ ...arch, transform: "translateZ(-25px)" }}
            />
            {/* photo */}
            <div
              className="relative overflow-hidden border-[3px] border-wine-soft bg-ivory shadow-2xl"
              style={{ ...arch, aspectRatio: `1 / ${photo.aspect}`, transform: "translateZ(0)" }}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 640px) 82vw, 420px"
                className="object-cover"
                priority={false}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.18), transparent 45%)" }}
              />
            </div>
            {/* inner fine line floating in front */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-3 border border-ivory/70"
              style={{ ...arch, transform: "translateZ(40px)" }}
            />
          </motion.div>
        </div>

        <p className="mt-14 text-3xl italic tracking-wide text-wine sm:text-4xl">{photo.caption}</p>
      </div>
    </section>
  );
}
