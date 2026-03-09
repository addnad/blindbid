"use client";

import { useEffect, useState } from "react";
import GlitchText from "@/components/GlitchText";
import CollabCursors from "@/components/CollabCursors";

export default function Hero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section className="relative flex flex-col items-center w-full bg-[#0A0A0A] py-16 px-6 md:py-[100px] md:px-[120px] overflow-hidden">
      {/* Badge */}
      <div className="flex items-center justify-center gap-[8px] h-[32px] px-[12px] md:px-[16px] bg-[#1A1A1A] border-2 border-[#9945FF]">
        <div className="w-[8px] h-[8px] bg-[#9945FF] shrink-0" />
        <span className="font-ibm-mono text-[9px] md:text-[11px] font-bold text-[#9945FF] tracking-[1px] md:tracking-[2px] whitespace-nowrap">
          [LIVE] // POWERED BY ARCIUM + SOLANA
        </span>
      </div>

      <div className="h-8 md:h-[32px]" />

      {/* Headline */}
      <h1 className="font-grotesk text-[clamp(32px,10vw,96px)] font-bold text-[#F0EEFF] tracking-[-1px] leading-none text-center w-full max-w-[1100px]">
        <GlitchText text="BID IN THE DARK." speed={45} delay={100} />
        <br />
        <GlitchText text="WIN IN THE LIGHT." speed={45} delay={400} />
      </h1>
      <h1 className="font-grotesk text-[clamp(32px,10vw,96px)] font-bold text-[#9945FF] tracking-[-1px] leading-none text-center w-full max-w-[1100px]">
        <GlitchText text="FULLY ENCRYPTED." speed={45} delay={700} />
      </h1>

      <div className="h-8 md:h-[32px]" />

      {/* Subheading */}
      <p className="font-ibm-mono text-[13px] md:text-[15px] text-[#888888] tracking-[1px] leading-[1.6] text-center w-full max-w-[800px]">
        THE FIRST SEALED-BID AUCTION PROTOCOL ON SOLANA.
        <br />
        BIDS ARE ENCRYPTED VIA ARCIUM MPC — ZERO COLLUSION. ZERO MEV. ZERO LEAKAGE.
      </p>

      <div className="h-10 md:h-[48px]" />

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-[16px] w-full sm:w-auto">
        <a href="/auctions" className="flex items-center justify-center w-full sm:w-[220px] h-[56px] bg-[#9945FF] hover:bg-[#7c2de8] transition-colors">
          <span className="font-grotesk text-[12px] font-bold text-[#0A0A0A] tracking-[2px]">
            PLACE SEALED BID
          </span>
        </a>
        <a href="/how-it-works" className="flex items-center justify-center w-full sm:w-[200px] h-[56px] bg-[#0A0A0A] border-2 border-[#3D3D3D] hover:border-[#888888] transition-colors">
          <span className="font-ibm-mono text-[12px] text-[#888888] tracking-[2px]">
            HOW IT WORKS &gt;
          </span>
        </a>
      </div>

      <div className="h-6 md:h-[24px]" />

      <p className="font-ibm-mono text-[11px] text-[#555555] tracking-[2px] text-center">
        NO FRONT-RUNNING // ENCRYPTED BIDS // SOLANA SPEED
      </p>

      <div className="h-12 md:h-[64px]" />

      {/* Auction Interface SVG */}
      <div
        className="w-full max-w-[1100px] bg-[#0F0F0F] overflow-hidden"
        style={{ border: "2px solid #2D2D2D" }}
      >
        <AuctionInterfaceSVG mounted={mounted} />
      </div>

      <CollabCursors />
    </section>
  );
}

const auctions = [
  { id: "AUC-001", name: "SOLANA NFT DROP #44", bids: 12, status: "LIVE", color: "#4ADE80" },
  { id: "AUC-002", name: "TOKEN PRESALE ROUND 3", bids: 8,  status: "LIVE", color: "#4ADE80" },
  { id: "AUC-003", name: "RARE DIGITAL ASSET #7", bids: 21, status: "CLOSED", color: "#888" },
  { id: "AUC-004", name: "DAO TREASURY BOND",     bids: 5,  status: "PENDING", color: "#9945FF" },
];

const encryptedBids = [
  "0x3f8a...c291", "0x9b2e...f047", "0x1d7c...8a33",
  "0xae41...2b90", "0x5f0d...e817", "0x7c3a...4f62",
];

const tickerItems = [
  "SEALED", "ENCRYPTED", "ARCIUM MPC", "SOLANA", "VICKREY",
  "ZERO-MEV", "BLIND BID", "TRUSTLESS", "ON-CHAIN", "FAIR PRICE",
];

function AuctionInterfaceSVG({ mounted }: { mounted: boolean }) {
  return (
    <>
      <style>{`
        @keyframes hero-blink  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes hero-scan   { 0%{transform:translateY(-580px)} 100%{transform:translateY(580px)} }
        @keyframes hero-pulse  { 0%,100%{opacity:0.3} 50%{opacity:1} }
        @keyframes hero-ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-700px)} }
        .hero-cursor  { animation: hero-blink 1.1s step-end infinite; }
        .hero-scan    { animation: hero-scan 4s linear infinite; }
        .hero-pulse   { animation: hero-pulse 2s ease-in-out infinite; }
        .hero-ticker-track { animation: hero-ticker 14s linear infinite; }
      `}</style>

      <svg viewBox="0 0 1100 580" xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", width: "100%", height: "auto" }}>

        {/* BG */}
        <rect width="1100" height="580" fill="#0F0F0F" />
        <rect className="hero-scan" x="0" y="0" width="1100" height="6" fill="rgba(255,214,0,0.03)" />

        {/* Grid dots */}
        {Array.from({ length: 22 }, (_, c) =>
          Array.from({ length: 12 }, (_, r) => (
            <circle key={`d${c}-${r}`} cx={c * 50 + 25} cy={r * 50 + 25} r="1" fill="#1A1A1A" />
          ))
        )}

        {/* LEFT PANEL — Active Auctions */}
        <rect x="0" y="0" width="220" height="580" fill="#111111" />
        <line x1="220" y1="0" x2="220" y2="580" stroke="#2D2D2D" strokeWidth="1" />
        <rect x="0" y="0" width="220" height="36" fill="#161616" />
        <text x="12" y="23" fontFamily="monospace" fontSize="9" fill="#9945FF" letterSpacing={2} fontWeight="700">LIVE AUCTIONS</text>
        <circle className="hero-pulse" cx="200" cy="18" r="4" fill="#4ADE80" />

        {auctions.map((a, i) => {
          const y = 44 + i * 58;
          return (
            <g key={i} style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(6px)",
              transition: `opacity 0.4s ease ${i * 0.1}s, transform 0.4s ease ${i * 0.1}s`,
            }}>
              {i === 0 && <rect x="0" y={y} width="220" height="54" fill="#1A1A1A" />}
              {i === 0 && <rect x="0" y={y} width="2" height="54" fill="#9945FF" />}
              <text x="14" y={y + 14} fontFamily="monospace" fontSize="7" fill="#444" letterSpacing={1}>{a.id}</text>
              <text x="14" y={y + 28} fontFamily="monospace" fontSize="9" fill={i === 0 ? "#F0EEFF" : "#666"} letterSpacing={0.5}>{a.name}</text>
              <circle cx="14" cy={y + 43} r="3" fill={a.color} opacity="0.8" />
              <text x="22" y={y + 47} fontFamily="monospace" fontSize="7" fill={a.color} letterSpacing={1}>{a.status}</text>
              <text x="160" y={y + 47} fontFamily="monospace" fontSize="7" fill="#444" letterSpacing={0.5}>{a.bids} BIDS</text>
            </g>
          );
        })}

        {/* RIGHT PANEL — Bid Inspector */}
        <rect x="879" y="0" width="221" height="580" fill="#111111" />
        <line x1="879" y1="0" x2="879" y2="580" stroke="#2D2D2D" strokeWidth="1" />
        <rect x="879" y="0" width="221" height="36" fill="#161616" />
        <text x="892" y="23" fontFamily="monospace" fontSize="9" fill="#9945FF" letterSpacing={2} fontWeight="700">BID VAULT</text>

        <text x="892" y="58" fontFamily="monospace" fontSize="8" fill="#555" letterSpacing={1}>ENCRYPTED BIDS</text>
        {encryptedBids.map((bid, i) => (
          <g key={i} style={{ opacity: mounted ? 1 : 0, transition: `opacity 0.4s ease ${0.1 + i * 0.08}s` }}>
            <rect x="892" y={70 + i * 28} width="8" height="8" fill="#9945FF" opacity="0.2" rx="1" />
            <text x="906" y={70 + i * 28 + 8} fontFamily="monospace" fontSize="8" fill="#444" letterSpacing={0.5}>{bid}</text>
          </g>
        ))}

        <line x1="879" y1="250" x2="1100" y2="250" stroke="#222" strokeWidth="1" />
        <text x="892" y="272" fontFamily="monospace" fontSize="9" fill="#9945FF" letterSpacing={2} fontWeight="700">AUCTION STATS</text>

        {[
          { k: "PROTOCOL",   v: "VICKREY"    },
          { k: "CHAIN",      v: "SOLANA"     },
          { k: "ENCRYPTION", v: "ARCIUM MPC" },
          { k: "BIDS",       v: "12 SEALED"  },
          { k: "CLOSES IN",  v: "02:14:33"   },
          { k: "FLOOR",      v: "◎ 2.5 SOL"  },
        ].map((p, i) => (
          <g key={i}>
            <text x="892" y={292 + i * 24} fontFamily="monospace" fontSize="8" fill="#555" letterSpacing={1}>{p.k}</text>
            <text x="892" y={306 + i * 24} fontFamily="monospace" fontSize="9" fill="#888" letterSpacing={0.5}>{p.v}</text>
          </g>
        ))}

        {/* CENTER CANVAS */}
        <rect x="220" y="0" width="660" height="36" fill="#141414" />
        <line x1="220" y1="36" x2="880" y2="36" stroke="#2D2D2D" strokeWidth="1" />
        <text x="240" y="23" fontFamily="monospace" fontSize="9" fill="#555" letterSpacing={1}>AUC-001 // SOLANA NFT DROP #44 // SEALED BID ROUND</text>
        <circle className="hero-pulse" cx="860" cy="18" r="4" fill="#4ADE80" />

        {/* Main auction card */}
        <rect x="260" y="60" width="560" height="340" fill="#0A0A0A" stroke="#2D2D2D" strokeWidth="1" />
        <rect x="260" y="60" width="560" height="48" fill="#141414" />
        <text x="280" y="80" fontFamily="monospace" fontSize="8" fill="#555" letterSpacing={2}>ACTIVE AUCTION</text>
        <text x="280" y="98" fontFamily="monospace" fontSize="13" fill="#F0EEFF" letterSpacing={1} fontWeight="700">SOLANA NFT DROP #44</text>
        <rect x="680" y="68" width="60" height="20" fill="#4ADE80" opacity="0.15" />
        <text x="692" y="82" fontFamily="monospace" fontSize="8" fill="#4ADE80" letterSpacing={1}>● LIVE</text>

        {/* Bid input area */}
        <rect x="280" y="130" width="360" height="44" fill="#111" stroke="#2D2D2D" strokeWidth="1" />
        <text x="296" y="148" fontFamily="monospace" fontSize="8" fill="#444" letterSpacing={1}>YOUR BID AMOUNT</text>
        <text x="296" y="165" fontFamily="monospace" fontSize="14" fill="#F0EEFF" letterSpacing={1}>◎ 4.20</text>
        <rect className="hero-cursor" x="370" y="152" width="6" height="12" fill="#9945FF" opacity="0.9" />

        {/* Encrypt button */}
        <rect x="280" y="190" width="160" height="36" fill="#9945FF" />
        <text x="310" y="213" fontFamily="monospace" fontSize="9" fill="#0A0A0A" fontWeight="700" letterSpacing={1}>ENCRYPT &amp; SUBMIT</text>

        {/* Ghost button */}
        <rect x="452" y="190" width="120" height="36" fill="none" stroke="#3D3D3D" strokeWidth="1.5" />
        <text x="472" y="213" fontFamily="monospace" fontSize="9" fill="#555" letterSpacing={1}>VIEW RULES</text>

        {/* Encryption visual */}
        <rect x="280" y="248" width="520" height="130" fill="#0D0D0D" stroke="#1A1A1A" strokeWidth="1" />
        <text x="296" y="268" fontFamily="monospace" fontSize="8" fill="#9945FF" letterSpacing={2} fontWeight="700">ARCIUM ENCRYPTION LAYER</text>
        {["INPUT:  ◎ 4.20 SOL", "KEY:    0x9f3b...a12c", "OUTPUT: 0x3f8a...c291", "STATUS: COMMITTED TO SOLANA"].map((line, i) => (
          <text key={i} x="296" y={286 + i * 20} fontFamily="monospace" fontSize="8"
            fill={i === 3 ? "#4ADE80" : i === 0 ? "#888" : "#555"} letterSpacing={0.5}>{line}</text>
        ))}
        <rect x="680" y="252" width="100" height="120" fill="#111" stroke="#222" strokeWidth="1" />
        <text x="695" y="270" fontFamily="monospace" fontSize="7" fill="#444" letterSpacing={1}>MPC NODES</text>
        {[0, 1, 2].map(i => (
          <g key={i}>
            <circle className="hero-pulse" cx="695" cy={285 + i * 28} r="5" fill="#9945FF" opacity="0.6"
              style={{ animationDelay: `${i * 0.4}s` }} />
            <text x="708" y={289 + i * 28} fontFamily="monospace" fontSize="7" fill="#444">NODE {i + 1}</text>
          </g>
        ))}

        {/* Bottom ticker */}
        <line x1="220" y1="514" x2="880" y2="514" stroke="#2D2D2D" strokeWidth="1" />
        <rect x="220" y="515" width="660" height="32" fill="#0F0F0F" />
        <clipPath id="tickerClip"><rect x="220" y="515" width="660" height="32" /></clipPath>
        <g clipPath="url(#tickerClip)">
          <g className="hero-ticker-track">
            {[...tickerItems, ...tickerItems].map((name, i) => (
              <g key={`t${i}`}>
                <circle cx={240 + i * 70} cy="531" r="3" fill="#9945FF" opacity="0.5" />
                <text x={250 + i * 70} y="535" fontFamily="monospace" fontSize="8" fill="#444" letterSpacing={1.5}>{name}</text>
              </g>
            ))}
          </g>
        </g>

        {/* Status bar */}
        <line x1="220" y1="547" x2="880" y2="547" stroke="#222" strokeWidth="1" />
        <rect x="220" y="548" width="660" height="32" fill="#0D0D0D" />
        <circle className="hero-pulse" cx="240" cy="564" r="4" fill="#4ADE80" />
        <text x="252" y="568" fontFamily="monospace" fontSize="8" fill="#555" letterSpacing={1}>NETWORK: SOLANA DEVNET</text>
        <text x="430" y="568" fontFamily="monospace" fontSize="8" fill="#333" letterSpacing={1}>ARCIUM: ACTIVE</text>
        <text x="580" y="568" fontFamily="monospace" fontSize="8" fill="#333" letterSpacing={1}>BIDS ENCRYPTED: 12</text>
        <text x="760" y="568" fontFamily="monospace" fontSize="8" fill="#333" letterSpacing={1}>v1.0.0</text>
        <rect x="220" y="548" width="6" height="6" fill="#9945FF" opacity="0.5" />
      </svg>
    </>
  );
}
