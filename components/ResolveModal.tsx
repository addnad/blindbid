"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { resolveAuction } from "@/lib/arcium";
import { Transaction } from "@solana/web3.js";

interface Bid {
  bidder: string;
  commitment: string;
  computationOffset: string;
  txSignature: string;
}

interface Props {
  auctionId: string;
  auctionName: string;
  accent: string;
  onClose: () => void;
}

export default function ResolveModal({ auctionId, auctionName, accent, onClose }: Props) {
  const { publicKey, signTransaction } = useWallet();
  const [bids, setBids]           = useState<Bid[]>([]);
  const [loading, setLoading]     = useState(false);
  const [step, setStep]           = useState<"fetch"|"select"|"resolving"|"success"|"error">("fetch");
  const [txSig, setTxSig]         = useState("");
  const [error, setError]         = useState("");
  const [selectedA, setSelectedA] = useState(0);
  const [selectedB, setSelectedB] = useState(1);

  async function fetchBids() {
    setLoading(true);
    try {
      const res = await fetch(`/api/chain/bids?auctionId=${auctionId}`);
      const { bids: fetched } = await res.json();
      setBids(fetched ?? []);
      setStep("select");
    } catch {
      setError("Failed to fetch bids from chain");
      setStep("error");
    }
    setLoading(false);
  }

  async function handleResolve() {
    if (!publicKey || !signTransaction || bids.length < 2) return;
    setStep("resolving");
    try {
      const sig = await resolveAuction(
        publicKey,
        signTransaction as (tx: Transaction) => Promise<Transaction>,
        auctionId,
        bids[selectedA],
        bids[selectedB],
      );
      setTxSig(sig);
      setStep("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStep("error");
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <div className="flex flex-col w-full max-w-[580px] bg-[#0D0D0D] max-h-[90vh] overflow-y-auto"
        style={{ border: `2px solid ${accent}` }}>

        <div className="flex items-center justify-between p-6 sticky top-0 bg-[#0D0D0D] z-10"
          style={{ borderBottom: "1px solid #1A1A1A" }}>
          <div className="flex flex-col gap-1">
            <span className="font-ibm-mono text-[9px] text-[#444] tracking-[2px]">ARCIUM MPC // REVEAL WINNER</span>
            <span className="font-grotesk text-[16px] font-bold text-[#F0EEFF]">{auctionName}</span>
          </div>
          <button onClick={onClose}
            className="font-grotesk text-[20px] text-[#444] hover:text-[#F0EEFF] transition-colors bg-transparent border-none cursor-pointer">✕</button>
        </div>

        <div className="flex flex-col gap-6 p-6">
          {step === "fetch" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 p-5 bg-[#111]" style={{ border: "1px solid #2D2D2D" }}>
                <span className="font-ibm-mono text-[10px] text-[#555] tracking-[2px]">HOW IT WORKS</span>
                <span className="font-ibm-mono text-[11px] text-[#666] leading-[1.8]">
                  Fetches sealed bids from Solana devnet, then triggers the Arcium MPC
                  <span style={{ color: accent }}> reveal_winner</span> circuit to compare
                  encrypted bids without revealing individual values.
                </span>
              </div>
              <button onClick={fetchBids} disabled={loading}
                className="flex items-center justify-center h-[52px] border-none cursor-pointer"
                style={{ background: accent }}>
                <span className="font-grotesk text-[12px] font-bold text-[#0A0A0A] tracking-[2px]">
                  {loading ? "SCANNING CHAIN..." : "FETCH SEALED BIDS"}
                </span>
              </button>
            </div>
          )}

          {step === "select" && (
            <div className="flex flex-col gap-4">
              <span className="font-ibm-mono text-[10px] text-[#555] tracking-[2px]">
                {bids.length} SEALED BID{bids.length !== 1 ? "S" : ""} FOUND ON-CHAIN
              </span>
              {bids.length < 2 ? (
                <div className="p-5 bg-[#111]" style={{ border: "1px solid #2D2D2D" }}>
                  <span className="font-ibm-mono text-[11px] text-[#666]">
                    Need at least 2 bids to trigger MPC reveal. Only {bids.length} found.
                  </span>
                </div>
              ) : (
                <>
                  {["A", "B"].map((label, li) => (
                    <div key={label} className="flex flex-col gap-2">
                      <span className="font-ibm-mono text-[10px] text-[#444] tracking-[1px]">SELECT BID {label}</span>
                      {bids.map((b, i) => {
                        const selected = li === 0 ? selectedA === i : selectedB === i;
                        return (
                          <button key={i} onClick={() => li === 0 ? setSelectedA(i) : setSelectedB(i)}
                            className="flex flex-col gap-1 p-4 text-left cursor-pointer border-none"
                            style={{ background: selected ? "#1A1A1A" : "#111", border: `1px solid ${selected ? accent : "#2D2D2D"}` }}>
                            <span className="font-ibm-mono text-[10px] text-[#888]">{b.bidder?.slice(0,20)}...</span>
                            <span className="font-ibm-mono text-[9px] text-[#555]">COMMITMENT: {b.commitment?.slice(0,24)}...</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                  <button onClick={handleResolve} disabled={selectedA === selectedB}
                    className="flex items-center justify-center h-[52px] border-none cursor-pointer"
                    style={{ background: selectedA !== selectedB ? accent : "#1A1A1A" }}>
                    <span className="font-grotesk text-[12px] font-bold tracking-[2px]"
                      style={{ color: selectedA !== selectedB ? "#0A0A0A" : "#444" }}>
                      TRIGGER ARCIUM MPC REVEAL
                    </span>
                  </button>
                </>
              )}
            </div>
          )}

          {step === "resolving" && (
            <div className="flex flex-col items-center gap-6 py-10">
              <div className="w-[48px] h-[48px] border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: accent, borderTopColor: "transparent" }} />
              <span className="font-grotesk text-[14px] font-bold text-[#F0EEFF] tracking-[1px]">TRIGGERING MPC REVEAL</span>
              <span className="font-ibm-mono text-[11px] text-[#555] tracking-[1px]">APPROVE IN WALLET...</span>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="flex items-center justify-center w-[56px] h-[56px] bg-[#4ADE80]">
                  <span className="font-grotesk text-[24px] font-bold text-[#0A0A0A]">✓</span>
                </div>
                <span className="font-grotesk text-[18px] font-bold text-[#F0EEFF]">MPC REVEAL TRIGGERED</span>
                <span className="font-ibm-mono text-[11px] text-[#555] text-center">ARCIUM NODES COMPUTING WINNER VIA THRESHOLD DECRYPTION</span>
              </div>
              <div className="flex flex-col gap-2 p-4 bg-[#0A0A0A]" style={{ border: "1px solid #1A1A1A" }}>
                <span className="font-ibm-mono text-[10px] text-[#444] tracking-[2px]">REVEAL TX</span>
                <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
                  target="_blank" rel="noreferrer"
                  className="font-ibm-mono text-[11px] break-all hover:opacity-80"
                  style={{ color: accent }}>{txSig}</a>
              </div>
              <button onClick={onClose}
                className="flex items-center justify-center h-[52px] border-none cursor-pointer"
                style={{ background: accent }}>
                <span className="font-grotesk text-[12px] font-bold text-[#0A0A0A] tracking-[2px]">DONE</span>
              </button>
            </div>
          )}

          {step === "error" && (
            <div className="flex flex-col gap-4">
              <span className="font-ibm-mono text-[11px] text-[#ff4444] text-center">{error}</span>
              <button onClick={onClose}
                className="flex items-center justify-center h-[52px] border-none cursor-pointer"
                style={{ background: accent }}>
                <span className="font-grotesk text-[12px] font-bold text-[#0A0A0A] tracking-[2px]">CLOSE</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
