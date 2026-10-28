"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";
import { invitation } from "@/config/invitation";
import MusicButton from "./MusicButton";
import Cursor from "./Cursor";
import FlowerSpray from "./FlowerSpray";

type Phase = "closed" | "opening" | "open";

const { couple, copy, palette, features } = invitation;

/** Wraps the page: shows the envelope first, keeps the real content in the DOM (inert until opened). */
export default function Gate({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("closed");
  const [flapBehind, setFlapBehind] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    if (phase === "open") el.removeAttribute("inert");
    else el.setAttribute("inert", "");
  }, [phase]);

  useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true });
    const t = timers.current;
    return () => t.forEach(window.clearTimeout);
  }, []);

  useEffect(() => {
    // The invitation always starts at the top, even after a reload mid-page.
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  useEffect(() => {
    // The overlay is fixed and covers the page; always reveal the invitation from the top.
    if (phase === "open") window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [phase]);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const open = () => {
    if (phase !== "closed") return;
    setPhase("opening");
    if (reduce) {
      later(() => setPhase("open"), 250);
      return;
    }
    later(() => setFlapBehind(true), 700);
    later(() => setPhase("open"), 3300);
  };

  const skip = () => {
    timers.current.forEach(window.clearTimeout);
    setPhase("open");
  };

  const opening = phase !== "closed";
  const d = reduce ? 0 : 1;

  return (
    <MotionConfig reducedMotion="user">
      <div ref={mainRef}>{children}</div>
      {phase === "open" && <MusicButton />}
      <Cursor />

      <AnimatePresence>
        {phase !== "open" && (
          <motion.div
            key="envelope-stage"
            role="dialog"
            aria-modal="true"
            aria-label="Opening the invitation"
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden px-4"
            style={{
              background: `radial-gradient(ellipse at 50% 35%, #FDFBF7 0%, ${palette.blush} 55%, ${palette.blushDeep} 100%)`,
            }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: reduce ? 0.2 : 1.1, ease: "easeInOut" } }}
          >
            <div className="lace pointer-events-none absolute inset-0 opacity-70" aria-hidden />
            <FlowerSpray corner="tl" size="lg" />
            <FlowerSpray corner="br" size="lg" />

            <motion.p
              className="eyebrow relative mb-8 text-center text-wine"
              animate={{ opacity: opening ? 0 : 1 }}
              transition={{ duration: 0.5 }}
            >
              You are invited
            </motion.p>

            {/* Envelope */}
            <div
              className="relative w-[min(88vw,540px)] aspect-[3/2]"
              style={{ perspective: 1400 }}
            >
              <motion.div
                className="absolute inset-0"
                initial={{ y: reduce ? 0 : 30, opacity: 0 }}
                animate={{
                  y: opening && !reduce ? 70 : 0,
                  opacity: 1,
                  scale: opening && !reduce ? 1.04 : 1,
                }}
                transition={{ duration: 1.1 * d + 0.01, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* shadow */}
                <div
                  aria-hidden
                  className="absolute -bottom-8 left-[6%] right-[6%] h-8 rounded-[50%] bg-wine/30 blur-xl"
                />
                {/* back of envelope */}
                <div
                  aria-hidden
                  className="absolute inset-0 border border-rose/70"
                  style={{ background: "#33070F", zIndex: 0 }}
                />

                {/* invitation card */}
                <motion.div
                  className="absolute left-[6%] right-[6%] top-[6%] bottom-[6%] flex flex-col items-center justify-center border border-rose bg-ivory px-4 text-center text-wine shadow-xl"
                  style={{ zIndex: 1 }}
                  animate={{
                    y: opening && !reduce ? "-46%" : 0,
                    scale: opening && !reduce ? 1.08 : 1,
                  }}
                  transition={{
                    delay: opening && !reduce ? 1.15 : 0,
                    duration: 1.5 * d + 0.01,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <div className="absolute inset-1.5 border border-rose/50" aria-hidden />
                  <p className="text-[0.62rem] uppercase tracking-[0.3em] sm:text-xs">
                    {copy.intro}
                  </p>
                  <p className="mt-2 font-script text-3xl text-wine sm:text-5xl">
                    {couple.first} &amp; {couple.second}
                  </p>
                  <div className="rose-rule my-2 w-24 sm:my-3" aria-hidden />
                  <p className="text-[0.62rem] uppercase tracking-[0.3em] text-rose-deep sm:text-xs">
                    {invitation.event.title}
                  </p>
                </motion.div>

                {/* pocket (front) */}
                <svg
                  aria-hidden
                  viewBox="0 0 600 400"
                  className="absolute inset-0 h-full w-full"
                  style={{ zIndex: 2 }}
                >
                  <polygon points="0,0 300,232 0,400" fill="#6A1222" stroke={palette.rose} strokeWidth="1.5" />
                  <polygon points="600,0 300,232 600,400" fill="#6A1222" stroke={palette.rose} strokeWidth="1.5" />
                  <polygon points="0,400 300,205 600,400" fill={palette.wine} stroke={palette.rose} strokeWidth="1.5" />
                  <rect x="1" y="1" width="598" height="398" fill="none" stroke={palette.rose} strokeWidth="2" />
                </svg>

                {/* flap */}
                <motion.div
                  className="absolute left-0 right-0 top-0 h-[58%]"
                  style={{
                    transformOrigin: "top center",
                    zIndex: flapBehind ? 0 : 3,
                    transformStyle: "preserve-3d",
                  }}
                  animate={{ rotateX: opening && !reduce ? 180 : 0 }}
                  transition={{ delay: opening && !reduce ? 0.55 : 0, duration: 1 * d + 0.01, ease: [0.45, 0, 0.2, 1] }}
                >
                  <svg aria-hidden viewBox="0 0 600 232" preserveAspectRatio="none" className="h-full w-full">
                    <polygon
                      points="0,0 600,0 300,230"
                      fill={flapBehind ? "#3D0A13" : palette.wine}
                      stroke={palette.rose}
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>

                {/* wax seal / open button */}
                <motion.button
                  ref={buttonRef}
                  type="button"
                  onClick={open}
                  disabled={opening}
                  aria-label="Open invitation"
                  className="absolute left-1/2 top-[58%] grid h-[18%] min-h-[64px] aspect-square -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-rose"
                  style={{
                    zIndex: 5,
                    background:
                      "radial-gradient(circle at 35% 30%, #B0344A 0%, #7A1424 55%, #4A0D18 100%)",
                    boxShadow: "0 6px 16px rgba(0,0,0,.45), inset 0 0 0 3px rgba(255,255,255,.12), inset 0 -4px 8px rgba(0,0,0,.25)",
                  }}
                  animate={
                    opening
                      ? reduce
                        ? { opacity: 0 }
                        : { y: 46, rotate: -18, scale: 0.6, opacity: 0 }
                      : { scale: [1, 1.05, 1] }
                  }
                  transition={
                    opening
                      ? { duration: 0.55, ease: "easeIn" }
                      : { duration: 3.2, repeat: reduce ? 0 : Infinity, ease: "easeInOut" }
                  }
                >
                  <span className="absolute inset-[7px] rounded-full border border-rose/50" aria-hidden />
                  <span className="font-script text-xl leading-none sm:text-3xl" aria-hidden>
                    M&amp;R
                  </span>
                </motion.button>
              </motion.div>
            </div>

            <motion.div
              className="relative mt-16 flex flex-col items-center gap-5 sm:mt-20"
              animate={{ opacity: opening ? 0 : 1 }}
              transition={{ duration: 0.4 }}
            >
              <button type="button" onClick={open} disabled={opening} className="btn-wine">
                Open Invitation
              </button>
              {features.skipButton && (
                <button
                  type="button"
                  onClick={skip}
                  className="text-xs uppercase tracking-[0.25em] text-wine underline decoration-rose-deep underline-offset-8 hover:text-rose-deep"
                >
                  Skip
                </button>
              )}
            </motion.div>
            {opening && features.skipButton && (
              <button
                type="button"
                onClick={skip}
                className="absolute bottom-6 right-6 text-xs uppercase tracking-[0.25em] text-wine underline decoration-rose-deep underline-offset-8"
              >
                Skip
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
