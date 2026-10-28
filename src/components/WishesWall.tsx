"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Flourish from "./Flourish";

type Wish = { name: string; message: string };

/**
 * Real wishes from guests, shown only after the couple approves them.
 * The whole section stays hidden until at least one wish is approved.
 */
export default function WishesWall() {
  const reduce = useReducedMotion();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/wishes", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { wishes: [] }))
        .then((d: { wishes: Wish[] }) => alive && setWishes(d.wishes ?? []))
        .catch(() => undefined);
    load();
    const id = window.setInterval(load, 60_000);
    window.addEventListener("rsvp:saved", load);
    return () => {
      alive = false;
      window.clearInterval(id);
      window.removeEventListener("rsvp:saved", load);
    };
  }, []);

  useEffect(() => {
    if (reduce || paused || wishes.length < 2) return;
    const id = window.setInterval(() => setI((x) => (x + 1) % wishes.length), 7000);
    return () => window.clearInterval(id);
  }, [reduce, paused, wishes.length]);

  if (wishes.length === 0) return null;
  const n = wishes.length;
  const w = wishes[i % n];
  const go = (d: number) => setI((x) => (x + d + n) % n);

  return (
    <section
      className="relative overflow-hidden bg-blush px-6 py-24 sm:py-28"
      aria-labelledby="wishes-title"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="lace pointer-events-none absolute inset-0 opacity-50" aria-hidden />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="eyebrow text-rose-deep">From our loved ones</p>
        <h2 id="wishes-title" className="mt-4 font-script text-6xl text-wine-soft sm:text-7xl">
          Wishes
        </h2>
        <Flourish className="mx-auto mt-4 text-wine-soft" />

        <div className="relative mt-12 min-h-[220px]" aria-live="polite" aria-atomic="true">
          <span aria-hidden className="absolute -top-6 left-1/2 -translate-x-1/2 font-serif text-[7rem] leading-none text-rose/60">
            &ldquo;
          </span>
          <AnimatePresence mode="wait">
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -14, filter: "blur(4px)" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative pt-12"
            >
              <blockquote className="text-2xl italic leading-relaxed text-wine sm:text-3xl">{w.message}</blockquote>
              <figcaption className="eyebrow mt-8 text-rose-deep">{w.name}</figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>

        {n > 1 && (
          <div className="mt-10 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous wish"
              className="grid h-11 w-11 place-items-center rounded-full border border-wine/30 text-wine transition hover:bg-wine hover:text-ivory"
            >
              &larr;
            </button>
            <p className="text-sm tracking-[0.2em] text-wine/70">
              {(i % n) + 1} / {n}
            </p>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next wish"
              className="grid h-11 w-11 place-items-center rounded-full border border-wine/30 text-wine transition hover:bg-wine hover:text-ivory"
            >
              &rarr;
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
