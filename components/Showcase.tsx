"use client";

import { useState, useEffect } from "react";
import SectionHeader from "./SectionHeader";
import BidModal from "./BidModal";
import CreateAuctionModal from "./CreateAuctionModal";
import { addBid, type Auction } from "@/lib/store";
import { type ArciumEncryptedBid } from "@/lib/arcium";
import { useWallet } from "@solana/wallet-adapter-react";
import ResolveModal from "./ResolveModal";

function useCountdown(endsAt: number) {
  const [timeLeft, setTimeLeft] = useState("");
  const [expired, setExpired]   = useState(false);
  useEffect(() => {
    function tick() {
      const diff = endsAt - Date.now();
      if (diff <= 0) { setTimeLeft("ENDED"); setExpired(true); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) setTimeLeft(d + "D " + String(h).padStart(2,"0") + "H");
      else if (h > 0) setTimeLeft(String(h).padStart(2,"0") + "H " + String(m).padStart(2,"0") + "M");
      else setTimeLeft(String(m).padStart(2,"0") + "M " + String(s).padStart(2,"0") + "S");
      setExpired(false);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return { timeLeft, expired };
}

function AuctionStats({ auction }: { auction: Auction }) {
  const { timeLeft, expired } = useCountdown(auction.endsAt);
  const statColor = expired ? "#555" : auction.accent;
  const stats = [
    { label: "SEALED BIDS", value: String(auction.bids) },
    { label: "FLOOR PRICE", value: "◎ " + auction.floor },
    { label: "CLOSES IN",   value: timeLeft || auction.closes },
  ];
  return (
    <div className="grid grid-cols-3 gap-[2px]">
      {stats.map((stat, i) => (
        <div key={i} className="flex flex-col gap-1 p-4 bg-[#0D0D0D]">
          <span className="font-ibm-mono text-[9px] text-[#444] tracking-[1.5px]">{stat.label}</span>
          <span className="font-grotesk text-[18px] font-bold tracking-[-0.5px]"
            style={{ color: i === 2 && expired ? "#ff4444" : statColor }}>
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function BidButton({ auction, onBid }: { auction: Auction; onBid: () => void }) {
  const { expired } = useCountdown(auction.endsAt);
  const isLive = auction.status === "LIVE" && !expired;
  return (
    <button onClick={() => isLive && onBid()}
      className="flex items-center justify-center h-[52px] px-[32px] transition-colors border-none"
      style={{ background: isLive ? auction.accent : "#1A1A1A", cursor: isLive ? "pointer" : "not-allowed" }}>
      <span className="font-grotesk text-[12px] font-bold tracking-[2px]"
        style={{ color: isLive ? "#0A0A0A" : "#444" }}>
        {isLive ? "PLACE SEALED BID" : expired ? "AUCTION ENDED" : auction.status === "PENDING" ? "OPENS SOON" : "AUCTION CLOSED"}
      </span>
    </button>
  );
}

function OnChainLink({ txSignature }: { txSignature?: string }) {
  const href = txSignature
    ? "https://explorer.solana.com/tx/" + txSignature + "?cluster=devnet"
    : "https://explorer.solana.com/address/EaDV1kv2CAbGVD42mhD5okEfBAABz4n38yCAY7YiaqYE?cluster=devnet";
  return (
    <a href={href} target="_blank" rel="noreferrer"
      className="flex items-center justify-center h-[52px] px-[32px] bg-[#0A0A0A] hover:border-[#555] transition-colors"
      style={{ border: "1px solid #2D2D2D" }}>
      <span className="font-ibm-mono text-[11px] text-[#555] tracking-[2px]">
        {txSignature ? "VIEW TX ON-CHAIN" : "VIEW PROGRAM"}
      </span>
    </a>
  );
}

export default function Showcase() {
  const { publicKey } = useWallet();
  const [auctions, setAuctions]       = useState<Auction[]>([]);
  const [chainLoading, setChainLoading] = useState(true);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [bidModal, setBidModal]       = useState(false);
  const [bidAuction, setBidAuction]   = useState<any>(null);
  const [createModal, setCreateModal] = useState(false);
  const [resolveModal, setResolveModal] = useState(false);
  const [filter, setFilter]           = useState<"ALL" | "LIVE" | "PENDING" | "CLOSED">("ALL");

  async function loadAll() {
    try {
      const res = await fetch("/api/chain/auctions");
      const { auctions: onChain } = await res.json();
      setAuctions(onChain ?? []);
    } catch {}
    setChainLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  const filtered = filter === "ALL" ? auctions : auctions.filter((a) => {
    if (filter === "LIVE")   return a.status === "LIVE" && a.endsAt > Date.now();
    if (filter === "CLOSED") return a.status === "CLOSED" || a.endsAt <= Date.now();
    return a.status === filter;
  });
  const a = filtered.find(x => (x as any).originalId === selectedId) ?? filtered[0];



  return (
    <section id="showcase"
      className="flex flex-col w-full bg-[#0D0D0D] py-16 px-6 md:py-[100px] md:px-[120px] gap-12 md:gap-[64px]"
      style={{ borderTop: "1px solid #1A1A1A" }}>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <SectionHeader
          label="[04] // LIVE AUCTIONS"
          title={"BROWSE & BID.\nFULLY SEALED."}
          subtitle="ALL BIDS ENCRYPTED VIA ARCIUM MPC. REVEALED ONLY AT CLOSE."
        />
        <div className="flex items-center gap-3">
          {chainLoading && (
            <span className="font-ibm-mono text-[10px] text-[#555] tracking-[1px] animate-pulse">
              SCANNING CHAIN...
            </span>
          )}
          {!chainLoading && auctions.some(a => a.id.startsWith("AUC-CHAIN")) && (
            <span className="font-ibm-mono text-[10px] text-[#4ADE80] tracking-[1px]">
              ● ON-CHAIN DATA LIVE
            </span>
          )}
          <button onClick={() => setCreateModal(true)}
            className="flex items-center justify-center h-[52px] px-[28px] shrink-0 cursor-pointer border-none transition-colors hover:opacity-90"
            style={{ background: "#9945FF" }}>
            <span className="font-grotesk text-[12px] font-bold text-[#0A0A0A] tracking-[2px]">+ CREATE AUCTION</span>
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-[2px]">
        {(["ALL", "LIVE", "PENDING", "CLOSED"] as const).map((f) => (
          <button key={f} onClick={() => { setFilter(f); setSelectedId(null); }}
            className="flex items-center justify-center h-[36px] px-4 cursor-pointer border-none transition-colors"
            style={{
              background: filter === f ? "#9945FF" : "#111",
              border: `1px solid ${filter === f ? "#9945FF" : "#2D2D2D"}`,
            }}>
            <span className="font-ibm-mono text-[10px] tracking-[1.5px]"
              style={{ color: filter === f ? "#0A0A0A" : "#555" }}>{f}</span>
          </button>
        ))}
        <span className="font-ibm-mono text-[10px] text-[#333] tracking-[1px] ml-3 self-center">
          {filtered.length} AUCTION{filtered.length !== 1 ? "S" : ""}
        </span>
      </div>

      {auctions.length === 0 && !chainLoading ? (
        <div className="flex flex-col items-center justify-center gap-6 py-24 bg-[#111111]" style={{ border: "1px solid #1A1A1A" }}>
          <span className="font-ibm-mono text-[10px] text-[#333] tracking-[3px]">NO AUCTIONS YET</span>
          <span className="font-ibm-mono text-[12px] text-[#555] text-center leading-[1.8]">Be the first to create a sealed auction on Solana devnet.</span>
          <button onClick={() => setCreateModal(true)} className="flex items-center justify-center h-[52px] px-8 border-none cursor-pointer" style={{ background: "#9945FF" }}>
            <span className="font-grotesk text-[12px] font-bold text-[#0A0A0A] tracking-[2px]">+ CREATE FIRST AUCTION</span>
          </button>
        </div>
      ) : a ? (
      <div className="flex flex-col md:flex-row gap-[2px] w-full">
        {/* Auction list */}
        <div className="flex flex-col gap-[2px] md:w-[360px] shrink-0 max-h-[600px] overflow-y-auto">
          {filtered.map((auction, i) => (
            <button key={auction.id} onClick={() => setSelectedId((auction as any).originalId ?? auction.id)}
              className="flex flex-col gap-2 p-5 text-left transition-colors cursor-pointer w-full shrink-0"
              style={{
                background: (auction as any).originalId === selectedId || (!selectedId && i === 0) ? "#1A1A1A" : "#111111",
                borderLeft: `3px solid ${(auction as any).originalId === selectedId || (!selectedId && i === 0) ? auction.accent : "#2D2D2D"}`,
                borderTop: "none", borderRight: "none", borderBottom: "none",
              }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-ibm-mono text-[9px] text-[#444] tracking-[2px]">{auction.id}</span>
                  {auction.id.startsWith("AUC-CHAIN") && (
                    <span className="font-ibm-mono text-[8px] text-[#4ADE80] tracking-[1px] px-1 border border-[#4ADE80]">ON-CHAIN</span>
                  )}
                </div>
                <span className="font-ibm-mono text-[9px] tracking-[1px]" style={{ color: auction.statusColor }}>
                  {auction.status}
                </span>
              </div>
              <span className="font-grotesk text-[13px] font-bold text-[#F0EEFF] tracking-[0.5px] leading-tight">
                {auction.name}
              </span>
              <div className="flex items-center gap-3">
                <span className="font-ibm-mono text-[10px] text-[#555]">{auction.bids} BIDS</span>
                <span className="font-ibm-mono text-[10px] text-[#555]">◎ {auction.floor}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Auction detail */}
        <div className="flex-1 bg-[#111111] p-8 md:p-[48px] flex flex-col gap-6"
          style={{ borderLeft: `3px solid ${a.accent}` }}>

          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="font-ibm-mono text-[10px] text-[#444] tracking-[2px]">
                  {a.id} // {a.type} AUCTION
                </span>
                {a.id.startsWith("AUC-CHAIN") && (
                  <span className="font-ibm-mono text-[9px] text-[#4ADE80] tracking-[1px] px-2 py-0.5 border border-[#4ADE80]">
                    ● REAL ON-CHAIN
                  </span>
                )}
              </div>
              <h3 className="font-grotesk text-[24px] md:text-[32px] font-bold text-[#F0EEFF] tracking-[-0.5px] leading-tight">
                {a.name}
              </h3>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-[#1A1A1A] shrink-0"
              style={{ border: `1px solid ${a.statusColor}` }}>
              <span className="font-ibm-mono text-[10px] tracking-[1px]" style={{ color: a.statusColor }}>
                {a.status}
              </span>
            </div>
          </div>

          <p className="font-ibm-mono text-[12px] text-[#666] tracking-[0.5px] leading-[1.8]">
            {a.description}
          </p>

          <AuctionStats auction={a} />

          <div className="flex flex-col gap-3 p-5 bg-[#0D0D0D]" style={{ border: "1px solid #1A1A1A" }}>
            <div className="flex items-center gap-2">
              <div className="w-[6px] h-[6px] bg-[#4ADE80]" />
              <span className="font-ibm-mono text-[10px] text-[#4ADE80] tracking-[2px]">ARCIUM ENCRYPTION ACTIVE</span>
            </div>
            <p className="font-ibm-mono text-[11px] text-[#555] tracking-[0.5px] leading-[1.6]">
              Bids encrypted via x25519 + RescueCipher using deployed MXE program
              <span className="text-[#9945FF]"> EaDV1kv2...YiaqYE</span>.
              No one sees your bid until auction close.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-[2px]">
            <BidButton auction={a} onBid={() => { setBidAuction(a); setBidModal(true); }} />
            {(a.status === "CLOSED" || a.endsAt < Date.now()) && (
              <button onClick={() => setResolveModal(true)}
                className="flex items-center justify-center h-[52px] px-[32px] border-none cursor-pointer hover:opacity-90"
                style={{ background: "#1A1A1A", border: "1px solid #9945FF" }}>
                <span className="font-ibm-mono text-[11px] text-[#9945FF] tracking-[2px]">RESOLVE AUCTION</span>
              </button>
            )}
            <OnChainLink txSignature={a.txSignature} />
          </div>
        </div>
      </div>

      ) : null}

      {bidModal && bidAuction && (
        <BidModal
          auction={{ id: (bidAuction as any).originalId ?? bidAuction.id, name: bidAuction.name, floor: bidAuction.floor, type: bidAuction.type, accent: bidAuction.accent }}
          onClose={() => setBidModal(false)}
          onBidPlaced={(encryptedBid: ArciumEncryptedBid, amountSol: number, txSig: string) => {
            if (!publicKey) return;
            addBid({
              auctionId:   (bidAuction as any).originalId ?? bidAuction.id,
              auctionName: bidAuction.name,
              bidder:      publicKey.toBase58(),
              amountSol,
              commitment:  encryptedBid.commitment,
              txSignature: txSig,
              timestamp:   Date.now(),
              status:      "SEALED",
            });
            loadAll();
          }}
        />
      )}

      {resolveModal && (
        <ResolveModal
          auctionId={(a as any).originalId ?? a.id}
          auctionName={a.name}
          accent={a.accent}
          createdAt={a.createdAt}
          endsAt={a.endsAt}
          onClose={() => setResolveModal(false)}
        />
      )}

      {createModal && (
        <CreateAuctionModal
          onClose={() => setCreateModal(false)}
          onCreated={() => { loadAll(); setCreateModal(false); setFilter("ALL"); setSelectedId(null); }}
        />
      )}
    </section>
  );
}
// appended - resolve handled inline above
