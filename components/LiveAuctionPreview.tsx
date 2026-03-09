"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Auction {
  id: string;
  name: string;
  type: string;
  status: string;
  statusColor: string;
  bids: number;
  floor: string;
  endsAt: number;
  accent: string;
}

const IMAGE_MAP: { keywords: string[]; url: string }[] = [
  { keywords: ["PS5", "PLAYSTATION"],  url: "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=600&h=600&fit=crop" },
  { keywords: ["WORLD CUP", "TICKET"], url: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=600&fit=crop" },
  { keywords: ["MACBOOK", "LAPTOP"],   url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop" },
  { keywords: ["NFT", "DIGITAL"],      url: "https://images.unsplash.com/photo-1634193295627-1cdddf751ebf?w=600&h=600&fit=crop" },
  { keywords: ["TOKEN", "PRESALE"],    url: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=600&h=600&fit=crop" },
  { keywords: ["RARE"],                url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&h=600&fit=crop" },
];

const DEFAULT_IMG = "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&h=600&fit=crop";

function getImage(name: string): string {
  const upper = name.toUpperCase();
  for (const { keywords, url } of IMAGE_MAP) {
    if (keywords.some(k => upper.includes(k))) return url;
  }
  return DEFAULT_IMG;
}

function useCountdown(endsAt: number) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    function tick() {
      const diff = endsAt - Date.now();
      if (diff <= 0) { setTimeLeft("ENDED"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 24) setTimeLeft(Math.floor(h/24) + "D " + (h%24) + "H");
      else if (h > 0) setTimeLeft(String(h).padStart(2,"0") + "H " + String(m).padStart(2,"0") + "M");
      else setTimeLeft(String(m).padStart(2,"0") + "M " + String(s).padStart(2,"0") + "S");
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return timeLeft;
}

function AuctionCard({ auction, active }: { auction: Auction; active: boolean }) {
  const timeLeft = useCountdown(auction.endsAt);
  const isEnding = auction.endsAt - Date.now() < 3600000 && auction.status === "LIVE";

  return (
    <Link href="/auctions"
      className="absolute inset-0 flex flex-col md:flex-row bg-[#111111] overflow-hidden transition-all duration-700 cursor-pointer group"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "translateX(0)" : "translateX(20px)",
        pointerEvents: active ? "auto" : "none",
        border: `1px solid #1A1A1A`,
        borderTop: `2px solid ${auction.accent}`,
      }}>

      {/* Image half */}
      <div className="relative w-full md:w-1/2 h-[240px] md:h-full overflow-hidden bg-[#0D0D0D]">
        <img src={getImage(auction.name)} alt={auction.name}
          className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, transparent 40%, #111111 100%)" }} />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-black/80 backdrop-blur-sm"
            style={{ border: `1px solid ${auction.statusColor}` }}>
            {auction.status === "LIVE" && <div className="w-[5px] h-[5px] rounded-full animate-pulse" style={{ background: auction.statusColor }} />}
            <span className="font-ibm-mono text-[9px] tracking-[2px]" style={{ color: auction.statusColor }}>{auction.status}</span>
          </div>
          {isEnding && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-black/80" style={{ border: "1px solid #FF6B35" }}>
              <span className="font-ibm-mono text-[9px] text-[#FF6B35] tracking-[1px]">ENDING SOON</span>
            </div>
          )}
        </div>
      </div>

      {/* Info half */}
      <div className="flex flex-col justify-between gap-6 p-8 md:p-12 w-full md:w-1/2">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-ibm-mono text-[9px] text-[#444] tracking-[2px]">{auction.id} // {auction.type}</span>
            <h3 className="font-grotesk text-[24px] md:text-[32px] font-bold text-[#F0EEFF] leading-tight tracking-[-0.5px]">
              {auction.name}
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-[2px]">
            {[
              { label: "CLOSES IN", value: timeLeft || "—", color: timeLeft === "ENDED" ? "#555" : isEnding ? "#FF6B35" : auction.accent },
              { label: "SEALED BIDS", value: String(auction.bids), color: "#F0EEFF" },
              { label: "FLOOR PRICE", value: "◎ " + auction.floor.replace(" SOL",""), color: "#F0EEFF" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col gap-1 p-4 bg-[#0D0D0D]">
                <span className="font-ibm-mono text-[8px] text-[#444] tracking-[1px]">{s.label}</span>
                <span className="font-ibm-mono text-[13px] font-bold tracking-[0.5px]" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 p-4 bg-[#0D0D0D]" style={{ border: "1px solid #1A1A1A" }}>
            <div className="flex items-center gap-2">
              <div className="w-[5px] h-[5px] bg-[#4ADE80]" />
              <span className="font-ibm-mono text-[9px] text-[#4ADE80] tracking-[2px]">ARCIUM ENCRYPTION ACTIVE</span>
            </div>
            <span className="font-ibm-mono text-[10px] text-[#555] leading-[1.6]">
              Bids encrypted via x25519 + RescueCipher. No one sees your bid until auction close.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-[48px] px-6"
            style={{ background: auction.accent }}>
            <span className="font-grotesk text-[11px] font-bold text-[#0A0A0A] tracking-[2px]">
              {auction.status === "LIVE" ? "PLACE SEALED BID" : "VIEW AUCTION"}
            </span>
          </div>
          <span className="font-ibm-mono text-[10px] text-[#444] tracking-[1px]">→ VIEW ALL AUCTIONS</span>
        </div>
      </div>
    </Link>
  );
}

export default function LiveAuctionPreview() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading]   = useState(true);
  const [active, setActive]     = useState(0);
  const [label, setLabel]       = useState<"LIVE" | "ENDED">("LIVE");

  useEffect(() => {
    fetch("/api/chain/auctions")
      .then(r => r.json())
      .then(d => { setAuctions(d.auctions ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (auctions.length === 0) return;
    const interval = setInterval(() => {
      setActive(prev => {
        const next = (prev + 1) % auctions.length;
        const a = auctions[next];
        setLabel(a && a.endsAt > Date.now() ? "LIVE" : "ENDED");
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [auctions]);

  return (
    <section className="flex flex-col w-full bg-[#0A0A0A] py-16 px-6 md:py-[100px] md:px-[120px] gap-10"
      style={{ borderTop: "1px solid #1A1A1A" }}>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-3">
          <span className="font-ibm-mono text-[9px] text-[#444] tracking-[3px]">[05] // AUCTION ACTIVITY</span>
          <h2 className="font-grotesk text-[32px] md:text-[48px] font-bold text-[#F0EEFF] tracking-[-1px] leading-none">
            LIVE ON-CHAIN.<br /><span style={{ color: "#9945FF" }}>BID NOW.</span>
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#111]" style={{ border: "1px solid #1A1A1A" }}>
            <div className="w-[6px] h-[6px] rounded-full animate-pulse"
              style={{ background: label === "LIVE" ? "#4ADE80" : "#555" }} />
            <span className="font-ibm-mono text-[9px] tracking-[2px]"
              style={{ color: label === "LIVE" ? "#4ADE80" : "#555" }}>
              SHOWING: {label}
            </span>
          </div>
          <Link href="/auctions"
            className="flex items-center justify-center h-[44px] px-6 hover:opacity-90 transition-opacity"
            style={{ background: "#9945FF" }}>
            <span className="font-grotesk text-[11px] font-bold text-[#0A0A0A] tracking-[2px]">VIEW ALL</span>
          </Link>
        </div>
      </div>

      {/* Carousel */}
      {loading ? (
        <div className="flex items-center gap-3 h-[400px] justify-center bg-[#111]" style={{ border: "1px solid #1A1A1A" }}>
          <div className="w-[8px] h-[8px] bg-[#9945FF] animate-pulse" />
          <span className="font-ibm-mono text-[11px] text-[#555] tracking-[2px] animate-pulse">SCANNING CHAIN...</span>
        </div>
      ) : auctions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 bg-[#111111]" style={{ border: "1px solid #1A1A1A" }}>
          <span className="font-ibm-mono text-[10px] text-[#333] tracking-[3px]">NO AUCTIONS YET</span>
          <Link href="/auctions" className="flex items-center justify-center h-[48px] px-8" style={{ background: "#9945FF" }}>
            <span className="font-grotesk text-[11px] font-bold text-[#0A0A0A] tracking-[2px]">CREATE FIRST AUCTION</span>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="relative w-full" style={{ height: "420px" }}>
            {auctions.map((auction, i) => (
              <AuctionCard key={auction.id} auction={auction} active={i === active} />
            ))}
          </div>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {auctions.map((_, i) => (
              <button key={i} onClick={() => setActive(i)}
                className="border-none cursor-pointer transition-all duration-300"
                style={{
                  width: i === active ? "24px" : "6px",
                  height: "6px",
                  background: i === active ? "#9945FF" : "#2D2D2D",
                }} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
