"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { invitation } from "@/config/invitation";

/** Optional background music. Never plays until the guest presses the button. */
export default function MusicButton() {
  const { src, title } = invitation.features.music;
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!src) return;
    const a = new Audio(src);
    a.loop = true;
    a.preload = "none";
    a.volume = 0;
    a.addEventListener("error", () => setFailed(true));
    audio.current = a;
    return () => {
      a.pause();
      audio.current = null;
    };
  }, [src]);

  if (!src || failed) return null;

  const fade = (a: HTMLAudioElement, to: number, done?: () => void) => {
    const step = () => {
      a.volume = Math.max(0, Math.min(0.55, a.volume + (to > a.volume ? 0.05 : -0.05)));
      if (Math.abs(a.volume - to) > 0.04) requestAnimationFrame(step);
      else {
        a.volume = to;
        done?.();
      }
    };
    step();
  };

  const toggle = async () => {
    const a = audio.current;
    if (!a) return;
    if (playing) {
      fade(a, 0, () => a.pause());
      setPlaying(false);
    } else {
      try {
        await a.play();
        fade(a, 0.55);
        setPlaying(true);
      } catch {
        setFailed(true);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={playing}
      aria-label={playing ? "Pause music" : `Play music${title ? `: ${title}` : ""}`}
      className="fixed bottom-5 left-5 z-50 flex items-center gap-3 rounded-full border border-rose/70 bg-wine/90 px-4 py-2.5 text-ivory shadow-lg backdrop-blur transition hover:bg-wine"
    >
      <span className="flex h-4 items-end gap-[3px]" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            className="w-[3px] rounded-full bg-rose"
            animate={playing ? { height: ["30%", "100%", "45%", "80%", "30%"] } : { height: "30%" }}
            transition={playing ? { duration: 1.2, repeat: Infinity, delay: i * 0.15 } : { duration: 0.3 }}
          />
        ))}
      </span>
      <span className="eyebrow text-[0.62rem]">{playing ? "Pause" : "Play music"}</span>
    </button>
  );
}
