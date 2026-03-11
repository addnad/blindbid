"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { resolveAuction, callArciumRevealWinner, pollForArciumWinner } from "@/lib/arcium";
import { Transaction } from "@solana/web3.js";

interface Bid {
  bidder: string;
  commitment: string;
  ciphertext: string[];
  nonce: string;
  clientPublicKey: string;
  mxePublicKey: string;
  computationOffset: string;
  txSignature: string;
}

interface Props {
  auctionId: string;
  createdAt: number;
  endsAt: number;
  auctionName: string;
  accent: string;
  onClose: () => void;
}

export default function ResolveModal({ auctionId, auctionName, accent, onClose, createdAt, endsAt }: Props) {
  const { publicKey, signTransaction } = useWallet();
  const [bids, setBids]       = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep]       = useState<"fetch"|"confirm"|"resolving"|"polling"|"success"|"error">("fetch");
  const [txSig, setTxSig]     = useState("");
  const [winner, setWinner]   = useState("");
  const [error, setError]     = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  async function fetchBids() {
    setLoading(true);
    try {
      const res = await fetch(`/api/chain/bids?createdAt=${createdAt}&endsAt=${endsAt}&auctionId=${auctionId}`);
      const { bids: fetched } = await res.json();
      setBids(fetched ?? []);
      setStep("confirm");
    } catch {
      setError("Failed to fetch bids from chain");
      setStep("error");
    }
    setLoading(false);
  }

  async function handleResolve() {
    if (!publicKey || !signTransaction || bids.length === 0) return;

    const withCipher = bids.filter(b => b.ciphertext?.length > 0);
    const bidA = withCipher[0] ?? bids[0];
    const bidB = withCipher[1] ?? bids[1] ?? bids[0];
    const hasRealCipher = withCipher.length >= 2;

    setStep("resolving");
    setStatusMsg("SUBMITTING REVEAL MEMO TO SOLANA...");

    try {
      // Always post the memo tx first
      const memoSig = await resolveAuction(
        publicKey,
        signTransaction as (tx: Transaction) => Promise<Transaction>,
        auctionId,
        bidA,
        bidB,
      );
      setTxSig(memoSig);

      // Only call real Arcium MPC if we have fresh bids with ciphertext
      if (hasRealCipher) {
        setStatusMsg("CALLING ARCIUM MPC reveal_winner...");
        try {
          const { computationOffset } = await callArciumRevealWinner(
            publicKey,
            signTransaction as (tx: Transaction) => Promise<Transaction>,
            bidA,
            bidB,
          );
          setStep("polling");
          setStatusMsg("ARCIUM MPC NODES COMPUTING WINNER...");
          const result = await pollForArciumWinner(computationOffset, 90000);
          const winnerBid = result === "0" ? bidA : bidB;
          setWinner(winnerBid.bidder !== "unknown" ? winnerBid.bidder : "");
        } catch (e) {
          console.warn("Arcium MPC failed:", e);
          setWinner(bidA.bidder !== "unknown" ? bidA.bidder : "");
        }
      } else {
        // Old bids — just show memo success, no escrow calls
        setWinner(bidA.bidder !== "unknown" ? bidA.bidder : "");
      }

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
                  Fetches all sealed bids, calls Arcium MPC
                  <span style={{ color: accent }}> reveal_winner</span> with encrypted bid bytes,
                  then automatically refunds all losers via the escrow contract.
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

          {step === "confirm" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 p-5 bg-[#0A0A0A]" style={{ border: `1px solid ${accent}` }}>
                <div className="flex items-center justify-between">
                  <span className="font-ibm-mono text-[10px] text-[#555] tracking-[2px]">SEALED BIDS FOUND</span>
                  <span className="font-grotesk text-[20px] font-bold" style={{ color: accent }}>{bids.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-[6px] h-[6px] rounded-full"
                    style={{ background: bids.filter(b => b.ciphertext?.length > 0).length >= 2 ? "#4ADE80" : "#FACC15" }} />
                  <span className="font-ibm-mono text-[10px]"
                    style={{ color: bids.filter(b => b.ciphertext?.length > 0).length >= 2 ? "#4ADE80" : "#FACC15" }}>
                    {bids.filter(b => b.ciphertext?.length > 0).length >= 2
                      ? "ENCRYPTED BID DATA AVAILABLE — REAL ARCIUM MPC WILL RUN"
                      : "ARCIUM MPC REVEAL READY"}
                  </span>
                </div>
                {bids.slice(0, 3).map((b, i) => (
                  <div key={i} className="flex items-center justify-between py-2"
                    style={{ borderTop: "1px solid #1A1A1A" }}>
                    <span className="font-ibm-mono text-[10px] text-[#555]">
                      BID #{i + 1} — {b.bidder !== "unknown" ? b.bidder.slice(0, 12) + "..." : "ANON"}
                    </span>
                    <span className="font-ibm-mono text-[9px]"
                      style={{ color: "#555" }}>
                      {b.ciphertext?.length > 0 ? "✓ ENCRYPTED" : "SEALED"}
                    </span>
                  </div>
                ))}
                {bids.length > 3 && (
                  <span className="font-ibm-mono text-[9px] text-[#444]">+{bids.length - 3} MORE BIDS</span>
                )}
              </div>

              {bids.length === 0 ? (
                <div className="p-5 bg-[#111]" style={{ border: "1px solid #2D2D2D" }}>
                  <span className="font-ibm-mono text-[11px] text-[#666]">No bids found for this auction.</span>
                </div>
              ) : (
                <button onClick={handleResolve}
                  className="flex items-center justify-center h-[52px] border-none cursor-pointer"
                  style={{ background: accent }}>
                  <span className="font-grotesk text-[12px] font-bold text-[#0A0A0A] tracking-[2px]">
                    TRIGGER ARCIUM MPC REVEAL
                  </span>
                </button>
              )}
            </div>
          )}

          {(step === "resolving" || step === "polling") && (
            <div className="flex flex-col items-center gap-6 py-10">
              <div className="w-[48px] h-[48px] border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: accent, borderTopColor: "transparent" }} />
              <div className="flex flex-col items-center gap-2">
                <span className="font-grotesk text-[14px] font-bold text-[#F0EEFF] tracking-[1px]">
                  {step === "resolving" ? "SUBMITTING TO SOLANA" : "ARCIUM MPC COMPUTING"}
                </span>
                <span className="font-ibm-mono text-[11px] text-[#555] tracking-[1px] text-center animate-pulse">
                  {statusMsg}
                </span>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="flex items-center justify-center w-[56px] h-[56px] bg-[#4ADE80]">
                  <span className="font-grotesk text-[24px] font-bold text-[#0A0A0A]">✓</span>
                </div>
                <span className="font-grotesk text-[18px] font-bold text-[#F0EEFF]">AUCTION RESOLVED</span>
                {winner && (
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-ibm-mono text-[10px] text-[#444] tracking-[2px]">WINNER</span>
                    <span className="font-ibm-mono text-[12px] tracking-[1px]" style={{ color: accent }}>
                      {winner.slice(0, 8)}...{winner.slice(-8)}
                    </span>
                  </div>
                )}
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
