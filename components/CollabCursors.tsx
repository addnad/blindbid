"use client";

import { useEffect, useRef } from "react";

const CURSORS = [
  { name: "MPC NODE 01",     color: "#9945FF", x: 18, y: 22, dx: 0.3,  dy: 0.18 },
  { name: "ARCIUM ENCRYPT",  color: "#4ADE80", x: 72, y: 55, dx: -0.2, dy: 0.25 },
  { name: "SEALED BID",      color: "#60A5FA", x: 45, y: 38, dx: 0.25, dy: -0.2 },
  { name: "ZERO MEV",        color: "#A78BFA", x: 60, y: 70, dx: -0.3, dy: 0.15 },
  { name: "VICKREY",         color: "#9945FF", x: 30, y: 80, dx: 0.2,  dy: -0.3 },
  { name: "SOLANA SPEED",    color: "#4ADE80", x: 80, y: 30, dx: -0.15,dy: 0.28 },
];

export default function CollabCursors() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const pos  = useRef(CURSORS.map((c) => ({ x: c.x, y: c.y, dx: c.dx, dy: c.dy })));

  useEffect(() => {
    let raf: number;
    function tick() {
      pos.current.forEach((p, i) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 5 || p.x > 95)  p.dx *= -1;
        if (p.y < 5 || p.y > 95)  p.dy *= -1;
        const el = refs.current[i];
        if (el) {
          el.style.left = `${p.x}%`;
          el.style.top  = `${p.y}%`;
        }
      });
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {CURSORS.map((c, i) => (
        <div
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          className="absolute flex items-center gap-[6px] transition-none"
          style={{ left: `${c.x}%`, top: `${c.y}%` }}
        >
          {/* Cursor arrow */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 6L7 8L5 13L1 1Z" fill={c.color} />
          </svg>
          {/* Label */}
          <div
            className="flex items-center h-[20px] px-[8px]"
            style={{ background: c.color }}
          >
            <span className="font-ibm-mono text-[9px] font-bold text-[#0A0A0A] tracking-[1px] whitespace-nowrap">
              {c.name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
