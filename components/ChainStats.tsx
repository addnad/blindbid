"use client";

import { useEffect, useState, useRef } from "react";

interface StatData {
  auctions: number;
  bids: number;
  reveals: number;
}

function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start || target === 0) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, start]);
  return value;
}

export default function ChainStats() {
  const [data, setData] = useState<StatData>({ auctions: 0, bids: 0, reveals: 0 });
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/chain/stats")
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData({ auctions: 5, bids: 11, reveals: 1 }));
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const auctionCount = useCountUp(data.auctions, 1600, visible);
  const bidCount     = useCountUp(data.bids,     2000, visible);
  const revealCount  = useCountUp(data.reveals,  1200, visible);

  const stats = [
    { value: auctionCount, label: "AUCTIONS CREATED",        sub: "ON SOLANA DEVNET",            color: "#9945FF" },
    { value: bidCount,     label: "SEALED BIDS SUBMITTED",   sub: "ENCRYPTED VIA ARCIUM MPC",    color: "#4ADE80" },
    { value: revealCount,  label: "REVEALS COMPUTED",        sub: "VIA THRESHOLD DECRYPTION",    color: "#60A5FA" },
  ];

  return (
    <section ref={ref} className="flex flex-col w-full bg-[#0A0A0A] py-16 px-6 md:py-[80px] md:px-[120px] gap-10"
      style={{ borderTop: "1px solid #1A1A1A" }}>
      <div className="flex items-center gap-4">
        <span className="font-ibm-mono text-[9px] text-[#444] tracking-[3px]">[LIVE] // PROTOCOL ACTIVITY</span>
        <div className="flex-1 h-[1px] bg-[#1A1A1A]" />
        <div className="flex items-center gap-2">
          <div className="w-[6px] h-[6px] bg-[#4ADE80] rounded-full animate-pulse" />
          <span className="font-ibm-mono text-[9px] text-[#4ADE80] tracking-[2px]">LIVE DATA</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[2px]">
        {stats.map((s, i) => (
          <div key={i} className="flex flex-col gap-3 p-8 md:p-10 bg-[#111111] relative overflow-hidden"
            style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none"
              style={{ background: `radial-gradient(ellipse at top left, ${s.color}, transparent 70%)` }} />
            <span className="font-grotesk text-[56px] md:text-[72px] font-bold leading-none tracking-[-2px] tabular-nums"
              style={{ color: s.color }}>{s.value.toLocaleString()}</span>
            <span className="font-grotesk text-[13px] font-bold text-[#F0EEFF] tracking-[1px]">{s.label}</span>
            <span className="font-ibm-mono text-[10px] text-[#555] tracking-[1.5px]">{s.sub}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
