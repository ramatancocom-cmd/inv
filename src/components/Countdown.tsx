"use client";

import { useEffect, useState } from "react";
import { invitation } from "@/config/invitation";

const target = new Date(invitation.event.startsAtISO).getTime();

const units = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Minutes" },
  { key: "seconds", label: "Seconds" },
] as const;

function split(ms: number) {
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export default function Countdown() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = now === null ? null : target - now;

  if (remaining !== null && remaining <= 0) {
    return (
      <div className="text-center" role="status">
        <p className="font-script text-5xl text-rose-deep sm:text-7xl">{invitation.copy.celebrate}</p>
        <p className="mt-4 text-xl italic text-wine/80">{invitation.copy.celebrateSub}</p>
      </div>
    );
  }

  const parts = remaining === null ? null : split(remaining);

  return (
    <div>
      {/* Announce only the coarse value to screen readers, not every tick */}
      <p className="sr-only">
        {parts ? `${parts.days} days remaining until the celebration.` : "Countdown loading."}
      </p>
      <dl
        aria-hidden
        className="mx-auto grid max-w-3xl grid-cols-4 divide-x divide-rose/40 text-center"
      >
        {units.map((u) => (
          <div key={u.key} className="px-1 sm:px-6">
            <dd className="font-serif text-4xl font-medium tabular-nums text-wine sm:text-7xl">
              {parts ? String(parts[u.key]).padStart(2, "0") : "--"}
            </dd>
            <dt className="eyebrow mt-3 text-[0.58rem] tracking-[0.12em] text-rose-deep sm:text-xs sm:tracking-[0.34em]">{u.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}
