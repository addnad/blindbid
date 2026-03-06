"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { addAuction, type Auction } from "@/lib/store";
import { submitAuctionCreation, AUCTION_CREATION_FEE } from "@/lib/arcium";
import { Transaction } from "@solana/web3.js";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

interface Props {
  onClose: () => void;
  onCreated: (auction: Auction) => void;
}

type Step = "form" | "submitting" | "success";

export default function CreateAuctionModal({ onClose, onCreated }: Props) {
  const { connected, publicKey, signTransaction } = useWallet();
  const { setVisible } = useWalletModal();

  const [step, setStep]               = useState<Step>("form");
  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [floor, setFloor]             = useState("");
  const [type, setType]               = useState<Auction["type"]>("VICKREY");
  const [duration, setDuration]       = useState("24");
  const [error, setError]             = useState("");
  const [txSig, setTxSig]             = useState("");

  const isValid = name.trim().length > 3 && floor.trim().length > 0 && parseFloat(floor) > 0;
  const creationFeeSol = (AUCTION_CREATION_FEE / LAMPORTS_PER_SOL).toFixed(3);

  async function handleCreate() {
    if (!isValid || !publicKey || !signTransaction) return;
    setStep("submitting");
    setError("");

    try {
      const sig = await submitAuctionCreation(
        publicKey,
        signTransaction as (tx: Transaction) => Promise<Transaction>,
        {
          name: name.trim(),
          type,
          floor: `${parseFloat(floor).toFixed(1)} SOL`,
          durationHours: parseFloat(duration),
        }
      );
      setTxSig(sig);
      const auction = addAuction(publicKey.toBase58(), {
        name:          name.trim(),
        description:   description.trim() || "Sealed-bid auction powered by Arcium MPC on Solana.",
        floor:         `${parseFloat(floor).toFixed(1)} SOL`,
        type,
        durationHours: parseFloat(duration),
        txSignature:   sig,
      });
      onCreated(auction);
      setStep("success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      setError(
        msg.includes("insufficient")
          ? "INSUFFICIENT SOL — YOU NEED AT LEAST " + creationFeeSol + " SOL TO CREATE AN AUCTION"
          : "ERROR: " + msg.slice(0, 100)
      );
      setStep("form");
    }
  }

  const TYPES: Auction["type"][] = ["VICKREY", "UNIFORM", "FIRST-PRICE"];
  const TYPE_DESC: Record<Auction["type"], string> = {
    "VICKREY":     "Winner pays second-highest price. Best for fair price discovery.",
    "UNIFORM":     "All winners pay same clearing price. Best for multi-unit sales.",
    "FIRST-PRICE": "Winner pays their own bid. Highest bid takes all.",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <div className="flex flex-col w-full max-w-[600px] bg-[#0D0D0D] max-h-[90vh] overflow-y-auto"
        style={{ border: "2px solid #9945FF" }}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 sticky top-0 bg-[#0D0D0D] z-10"
          style={{ borderBottom: "1px solid #1A1A1A" }}>
          <div className="flex flex-col gap-1">
            <span className="font-ibm-mono text-[9px] text-[#444] tracking-[2px]">BLINDBID // CREATE AUCTION</span>
            <span className="font-grotesk text-[16px] font-bold text-[#F0EEFF]">NEW SEALED-BID AUCTION</span>
          </div>
          <button onClick={onClose}
            className="font-grotesk text-[20px] text-[#444] hover:text-[#F0EEFF] transition-colors bg-transparent border-none cursor-pointer">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-6 p-6">
          {!connected ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 p-5 bg-[#111]" style={{ border: "1px solid #2D2D2D" }}>
                <span className="font-ibm-mono text-[10px] text-[#555] tracking-[2px]">WALLET NOT CONNECTED</span>
                <span className="font-ibm-mono text-[12px] text-[#666] leading-[1.6]">
                  Connect your wallet to create an auction.
                </span>
              </div>
              <button onClick={() => setVisible(true)}
                className="flex items-center justify-center h-[52px] cursor-pointer border-none"
                style={{ background: "#9945FF" }}>
                <span className="font-grotesk text-[12px] font-bold text-[#0A0A0A] tracking-[2px]">CONNECT WALLET</span>
              </button>
            </div>

          ) : step === "form" ? (
            <div className="flex flex-col gap-5">

              {/* Name */}
              <div className="flex flex-col gap-2">
                <span className="font-ibm-mono text-[10px] text-[#555] tracking-[2px]">AUCTION NAME *</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. RARE NFT DROP #1"
                  className="h-[48px] px-4 bg-[#111] font-ibm-mono text-[13px] text-[#F0EEFF] outline-none w-full"
                  style={{ border: "1px solid #2D2D2D", caretColor: "#9945FF" }}
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <span className="font-ibm-mono text-[10px] text-[#555] tracking-[2px]">DESCRIPTION</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you are auctioning..."
                  rows={3}
                  className="px-4 py-3 bg-[#111] font-ibm-mono text-[12px] text-[#F0EEFF] outline-none resize-none w-full"
                  style={{ border: "1px solid #2D2D2D", caretColor: "#9945FF" }}
                />
              </div>

              {/* Floor */}
              <div className="flex flex-col gap-2">
                <span className="font-ibm-mono text-[10px] text-[#555] tracking-[2px]">FLOOR PRICE (SOL) *</span>
                <div className="flex items-center h-[48px] px-4 bg-[#111]"
                  style={{ border: "1px solid #2D2D2D" }}>
                  <span className="font-grotesk text-[18px] text-[#555] mr-2">◎</span>
                  <input
                    type="number"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    placeholder="0.00"
                    min="0.001"
                    step="0.1"
                    className="flex-1 bg-transparent font-grotesk text-[18px] text-[#F0EEFF] outline-none border-none"
                    style={{ caretColor: "#9945FF" }}
                  />
                  <span className="font-ibm-mono text-[10px] text-[#444]">SOL</span>
                </div>
              </div>

              {/* Type */}
              <div className="flex flex-col gap-2">
                <span className="font-ibm-mono text-[10px] text-[#555] tracking-[2px]">AUCTION TYPE *</span>
                <div className="flex flex-col gap-[2px]">
                  {TYPES.map((t) => (
                    <button key={t} onClick={() => setType(t)}
                      className="flex flex-col gap-1 p-4 text-left cursor-pointer border-none transition-colors w-full"
                      style={{
                        background: type === t ? "#1A1A1A" : "#111",
                        borderLeft: `3px solid ${type === t ? "#9945FF" : "#2D2D2D"}`,
                      }}>
                      <span className="font-grotesk text-[12px] font-bold tracking-[1px]"
                        style={{ color: type === t ? "#9945FF" : "#555" }}>{t}</span>
                      <span className="font-ibm-mono text-[10px] text-[#444]">{TYPE_DESC[t]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="flex flex-col gap-2">
                <span className="font-ibm-mono text-[10px] text-[#555] tracking-[2px]">DURATION *</span>
                <div className="flex gap-[2px]">
                  {["1", "6", "12", "24", "48", "72"].map((h) => (
                    <button key={h} onClick={() => setDuration(h)}
                      className="flex-1 h-[40px] font-ibm-mono text-[11px] tracking-[1px] cursor-pointer border-none transition-colors"
                      style={{
                        background: duration === h ? "#9945FF" : "#111",
                        color:      duration === h ? "#0A0A0A" : "#555",
                        border:     `1px solid ${duration === h ? "#9945FF" : "#2D2D2D"}`,
                      }}>
                      {h}H
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee notice */}
              <div className="flex flex-col gap-3 p-4 bg-[#0A0A0A]" style={{ border: "1px solid #2D2D2D" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-[6px] h-[6px] bg-[#9945FF]" />
                    <span className="font-ibm-mono text-[10px] text-[#9945FF] tracking-[2px]">ON-CHAIN CREATION FEE</span>
                  </div>
                  <span className="font-grotesk text-[16px] font-bold text-[#9945FF]">◎ {creationFeeSol} SOL</span>
                </div>
                <span className="font-ibm-mono text-[10px] text-[#444] leading-[1.6]">
                  A real Solana devnet transaction will be submitted. Your wallet balance will decrease by ◎ {creationFeeSol} SOL + gas fees. The auction metadata is written on-chain via the Memo program.
                </span>
              </div>

              {/* Arcium note */}
              <div className="flex flex-col gap-2 p-4 bg-[#0A0A0A]" style={{ border: "1px solid #1A1A1A" }}>
                <div className="flex items-center gap-2">
                  <div className="w-[6px] h-[6px] bg-[#4ADE80]" />
                  <span className="font-ibm-mono text-[10px] text-[#4ADE80] tracking-[2px]">ARCIUM MPC PROTECTION</span>
                </div>
                <span className="font-ibm-mono text-[11px] text-[#444] leading-[1.6]">
                  All bids on your auction are encrypted with Arcium MPC. You cannot see bid amounts until auction close.
                </span>
              </div>

              {error && (
                <div className="p-4 bg-[#0A0A0A]" style={{ border: "1px solid #ff4444" }}>
                  <span className="font-ibm-mono text-[11px] text-[#ff4444] tracking-[0.5px]">{error}</span>
                </div>
              )}

              <div className="flex gap-[2px]">
                <button onClick={onClose}
                  className="flex items-center justify-center h-[52px] flex-1 cursor-pointer border-none"
                  style={{ background: "#111", border: "1px solid #2D2D2D" }}>
                  <span className="font-ibm-mono text-[11px] text-[#555] tracking-[2px]">CANCEL</span>
                </button>
                <button onClick={handleCreate} disabled={!isValid}
                  className="flex items-center justify-center h-[52px] flex-[2] cursor-pointer border-none transition-colors"
                  style={{ background: isValid ? "#9945FF" : "#1A1A1A" }}>
                  <span className="font-grotesk text-[12px] font-bold tracking-[2px]"
                    style={{ color: isValid ? "#0A0A0A" : "#333" }}>
                    PAY ◎ {creationFeeSol} + CREATE
                  </span>
                </button>
              </div>
            </div>

          ) : step === "submitting" ? (
            <div className="flex flex-col items-center gap-6 py-10">
              <div className="w-[48px] h-[48px] border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: "#9945FF", borderTopColor: "transparent" }} />
              <div className="flex flex-col items-center gap-2">
                <span className="font-grotesk text-[14px] font-bold text-[#F0EEFF] tracking-[1px]">
                  SUBMITTING TO SOLANA
                </span>
                <span className="font-ibm-mono text-[11px] text-[#555] tracking-[1px]">
                  APPROVE IN YOUR WALLET...
                </span>
              </div>
            </div>

          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="flex items-center justify-center w-[56px] h-[56px] bg-[#9945FF]">
                  <span className="font-grotesk text-[24px] font-bold text-[#0A0A0A]">✓</span>
                </div>
                <span className="font-grotesk text-[18px] font-bold text-[#F0EEFF] tracking-[1px]">AUCTION CREATED</span>
                <span className="font-ibm-mono text-[11px] text-[#555] text-center">
                  YOUR AUCTION IS LIVE. TRANSACTION CONFIRMED ON SOLANA DEVNET.
                </span>
              </div>
              {txSig && (
                <div className="flex flex-col gap-2 p-4 bg-[#0A0A0A]" style={{ border: "1px solid #1A1A1A" }}>
                  <span className="font-ibm-mono text-[10px] text-[#444] tracking-[2px]">SOLANA TRANSACTION</span>
                  <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
                    target="_blank" rel="noreferrer"
                    className="font-ibm-mono text-[11px] break-all hover:opacity-80 transition-opacity"
                    style={{ color: "#9945FF" }}>
                    {txSig}
                  </a>
                </div>
              )}
              <div className="flex flex-col gap-2 p-4 bg-[#0A0A0A]" style={{ border: "1px solid #1A1A1A" }}>
                <span className="font-ibm-mono text-[10px] text-[#444] tracking-[2px]">WHAT HAPPENS NOW</span>
                <span className="font-ibm-mono text-[11px] text-[#555] leading-[1.8]">
                  Bidders can now place encrypted sealed bids. All bids are protected by Arcium MPC encryption — you cannot see amounts until auction close. Results are revealed trustlessly on-chain.
                </span>
              </div>
              <button onClick={onClose}
                className="flex items-center justify-center h-[52px] cursor-pointer border-none"
                style={{ background: "#9945FF" }}>
                <span className="font-grotesk text-[12px] font-bold text-[#0A0A0A] tracking-[2px]">VIEW AUCTIONS</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
