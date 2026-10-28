"use client";

import { useId } from "react";

type Corner = "tl" | "tr" | "bl" | "br";

const PETAL_LIGHT = "#FFFDF8";
const PETAL_MID = "#EFE0C2";
const PETAL_DEEP = "#B8902A";
const LEAF = "#CDAE5A"; // gold leaves
const LEAF_DARK = "#9C7A22";

/** Layered garden rose: outer cupped petals, inner swirl. */
function Rose({ x, y, r, rot = 0, g }: { x: number; y: number; r: number; rot?: number; g: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * 360;
        return (
          <ellipse
            key={`o${i}`}
            cx={0}
            cy={-r * 0.5}
            rx={r * 0.5}
            ry={r * 0.56}
            transform={`rotate(${a})`}
            fill={`url(#${g}-outer)`}
            stroke={PETAL_DEEP}
            strokeOpacity={0.55}
            strokeWidth={0.6}
          />
        );
      })}
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * 360 + 36;
        return (
          <ellipse
            key={`m${i}`}
            cx={0}
            cy={-r * 0.3}
            rx={r * 0.36}
            ry={r * 0.38}
            transform={`rotate(${a})`}
            fill={`url(#${g}-inner)`}
            stroke={PETAL_DEEP}
            strokeOpacity={0.6}
            strokeWidth={0.6}
          />
        );
      })}
      <circle r={r * 0.32} fill={`url(#${g}-heart)`} />
      <path
        d={`M ${-r * 0.16} 0 A ${r * 0.16} ${r * 0.16} 0 1 1 ${r * 0.12} ${r * 0.1} M ${-r * 0.06} ${-r * 0.02} A ${r * 0.08} ${r * 0.08} 0 1 1 ${r * 0.07} ${r * 0.05}`}
        fill="none"
        stroke={PETAL_DEEP}
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0.7}
      />
    </g>
  );
}

/** Small five-petal blossom. */
function Blossom({ x, y, r, rot = 0 }: { x: number; y: number; r: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <ellipse key={i} cx={0} cy={-r * 0.55} rx={r * 0.42} ry={r * 0.55} transform={`rotate(${i * 72})`} fill={PETAL_LIGHT} stroke={PETAL_MID} strokeWidth={0.6} />
      ))}
      <circle r={r * 0.22} fill="#D4AF37" />
    </g>
  );
}

function Bud({ x, y, r, rot = 0 }: { x: number; y: number; r: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={`M0 ${r * 1.6} Q ${-r * 0.2} ${r * 0.8} 0 ${r * 0.4}`} stroke={LEAF_DARK} strokeWidth={1.4} fill="none" />
      <ellipse cx={0} cy={0} rx={r * 0.55} ry={r * 0.8} fill={PETAL_MID} />
      <path d={`M ${-r * 0.55} ${r * 0.1} Q 0 ${r * 1.1} ${r * 0.55} ${r * 0.1} L ${r * 0.3} ${r * 0.6} L 0 ${r * 0.4} L ${-r * 0.3} ${r * 0.6} Z`} fill={LEAF} />
    </g>
  );
}

function Leaf({ x, y, s, rot }: { x: number; y: number; s: number; rot: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0 0 C 18 -14, 48 -14, 72 0 C 48 14, 18 14, 0 0 Z" fill={LEAF} />
      <path d="M2 0 L 68 0" stroke={LEAF_DARK} strokeWidth={1} opacity={0.6} />
    </g>
  );
}

const flip: Record<Corner, string> = {
  tl: "",
  tr: "scale(-1 1)",
  bl: "scale(1 -1)",
  br: "scale(-1 -1)",
};
const place: Record<Corner, string> = {
  tl: "left-0 top-0 -translate-x-[18%] -translate-y-[18%] origin-top-left",
  tr: "right-0 top-0 translate-x-[18%] -translate-y-[18%] origin-top-right",
  bl: "left-0 bottom-0 -translate-x-[18%] translate-y-[18%] origin-bottom-left",
  br: "right-0 bottom-0 translate-x-[18%] translate-y-[18%] origin-bottom-right",
};

/**
 * Decorative spray of pink garden roses, blossoms, buds and leaves that sits in
 * a section corner. Purely ornamental: hidden from assistive tech, never clickable.
 */
export default function FlowerSpray({ corner, size = "md" }: { corner: Corner; size?: "sm" | "md" | "lg" }) {
  const g = useId().replace(/:/g, "");
  const w = size === "lg" ? "w-[46vw] max-w-[380px]" : size === "sm" ? "w-[30vw] max-w-[220px]" : "w-[38vw] max-w-[300px]";
  return (
    <div aria-hidden className={`pointer-events-none absolute ${place[corner]} ${w}`}>
      <svg viewBox="0 0 300 300" className="flower-sway h-auto w-full drop-shadow-[0_6px_14px_rgba(110,82,28,0.28)]">
        <defs>
          <radialGradient id={`${g}-outer`} cx="50%" cy="70%" r="70%">
            <stop offset="0%" stopColor={PETAL_LIGHT} />
            <stop offset="100%" stopColor={PETAL_MID} />
          </radialGradient>
          <radialGradient id={`${g}-inner`} cx="50%" cy="80%" r="80%">
            <stop offset="0%" stopColor="#FDF4E3" />
            <stop offset="100%" stopColor={PETAL_MID} />
          </radialGradient>
          <radialGradient id={`${g}-heart`} cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor={PETAL_MID} />
            <stop offset="100%" stopColor={PETAL_DEEP} />
          </radialGradient>
        </defs>
        <g transform={flip[corner]} style={{ transformOrigin: "150px 150px" }}>
          {/* stems */}
          <path d="M20 20 C 80 60, 140 90, 230 120" stroke={LEAF_DARK} strokeWidth={1.6} fill="none" opacity={0.7} />
          <path d="M20 20 C 60 80, 90 150, 120 235" stroke={LEAF_DARK} strokeWidth={1.6} fill="none" opacity={0.7} />
          {/* leaves */}
          <Leaf x={150} y={92} s={0.9} rot={-10} />
          <Leaf x={185} y={112} s={0.75} rot={30} />
          <Leaf x={95} y={150} s={0.85} rot={95} />
          <Leaf x={70} y={175} s={0.7} rot={130} />
          <Leaf x={40} y={110} s={0.8} rot={70} />
          <Leaf x={120} y={40} s={0.7} rot={-30} />
          <Leaf x={210} y={95} s={0.6} rot={-40} />
          {/* flowers */}
          <Rose x={70} y={70} r={58} rot={12} g={g} />
          <Rose x={170} y={108} r={38} rot={-20} g={g} />
          <Rose x={92} y={170} r={34} rot={40} g={g} />
          <Blossom x={228} y={124} r={14} rot={10} />
          <Blossom x={122} y={232} r={13} rot={30} />
          <Blossom x={150} y={52} r={11} rot={-15} />
          <Blossom x={30} y={150} r={10} rot={20} />
          <Bud x={250} y={140} r={9} rot={-60} />
          <Bud x={128} y={262} r={8} rot={-10} />
        </g>
      </svg>
    </div>
  );
}
