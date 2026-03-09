"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { addAuction, type Auction } from "@/lib/store";
import { submitAuctionCreation, AUCTION_CREATION_FEE } from "@/lib/arcium";
import { Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";

interface Props {
  onClose: () => void;
  onCreated: (auction: Auction) => void;
}

const DURATIONS = [
  { label: "30 MINS", value: 0.5 },
  { label: "1 HOUR",  value: 1 },
  { label: "24 HOURS",value: 24 },
  { label: "3 DAYS",  value: 72 },
  { label: "7 DAYS",  value: 168 },
];

const TYPES: { value: Auction["type"]; desc: string }[] = [
  { value: "FIRST-PRICE", desc: "Highest bid wins, pays their bid" },
  { value: "VICKREY",     desc: "Highest bid wins, pays 2nd price" },
  { value: "UNIFORM",     desc: "All winners pay the same price" },
];

export default function CreateAuctionModal({ onClose, onCreated }: Props) {
  const { publicKey, signTransaction, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [floor,       setFloor]       = useState("");
  const [imageUrl,    setImageUrl]    = useState("");
  const [type,        setType]        = useState<Auction["type"]>("FIRST-PRICE");
  const [duration,    setDuration]    = useState(1);
  const [step,        setStep]        = useState<"form"|"submitting"|"success"|"error">("form");
  const [error,       setError]       = useState("");
  const [txSig,       setTxSig]       = useState("");

  async function handleCreate() {
    if (!publicKey || !signTransaction) return;
    setStep("submitting");
    try {
      const sig = await submitAuctionCreation(
        publicKey,
        signTransaction as (tx: Transaction) => Promise<Transaction>,
        { name, type, floor: floor + " SOL", durationHours: duration, imageUrl: imageUrl || undefined }
      );
      const auction = addAuction(publicKey.toBase58(), {
        name,
        description: description || `Sealed ${type} auction. Bids encrypted via Arcium MPC.`,
        floor: floor + " SOL",
        type,
        durationHours: duration,
        txSignature: sig,
      });
      setTxSig(sig);
      setStep("success");
      onCreated(auction);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStep("error");
    }
  }

  const isValid = name.trim().length > 0 && parseFloat(floor) > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <div className="flex flex-col w-full max-w-[580px] bg-[#0D0D0D] max-h-[90vh] overflow-y-auto"
        style={{ border: "2px solid #9945FF" }}>

        <div className="flex items-center justify-between p-6 sticky top-0 bg-[#0D0D0D] z-10"
          style={{ borderBottom: "1px solid #1A1A1A" }}>
          <div className="flex flex-col gap-1">
            <span className="font-ibm-mono text-[9px] text-[#444] tracking-[2px]">BLINDBID // CREATE AUCTION</span>
            <span className="font-grotesk text-[16px] font-bold text-[#F0EEFF]">NEW SEALED AUCTION</span>
          </div>
          <button onClick={onClose}
            className="font-grotesk text-[20px] text-[#444] hover:text-[#F0EEFF] transition-colors bg-transparent border-none cursor-pointer">✕</button>
        </div>

        <div className="flex flex-col gap-6 p-6">

          {!connected ? (
            <div className="flex flex-col gap-4">
              <div className="p-5 bg-[#111]" style={{ border: "1px solid #2D2D2D" }}>
                <span className="font-ibm-mono text-[11px] text-[#666] leading-[1.8]">
                  Connect your Phantom wallet to create a sealed auction on Solana devnet.
                </span>
              </div>
              <button onClick={() => setVisible(true)}
                className="flex items-center justify-center h-[52px] border-none cursor-pointer"
                style={{ background: "#9945FF" }}>
                <span className="font-grotesk text-[12px] font-bold text-[#0A0A0A] tracking-[2px]">CONNECT WALLET</span>
              </button>
            </div>

          ) : step === "form" ? (
            <div className="flex flex-col gap-5">

              <div className="flex items-center justify-between p-4 bg-[#111]" style={{ border: "1px solid #1A1A1A" }}>
                <span className="font-ibm-mono text-[10px] text-[#555] tracking-[1px]">AUCTION CREATION FEE</span>
                <span className="font-ibm-mono text-[12px] text-[#9945FF]">◎ {AUCTION_CREATION_FEE / LAMPORTS_PER_SOL} SOL</span>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-ibm-mono text-[10px] text-[#555] tracking-[2px]">AUCTION NAME</span>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. RARE NFT #001"
                  className="p-4 bg-[#111] font-ibm-mono text-[13px] text-[#F0EEFF] outline-none w-full"
                  style={{ border: "1px solid #2D2D2D" }} />
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-ibm-mono text-[10px] text-[#555] tracking-[2px]">DESCRIPTION <span className="text-[#333]">— OPTIONAL</span></span>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Describe what you're auctioning..."
                  rows={2}
                  className="p-4 bg-[#111] font-ibm-mono text-[12px] text-[#F0EEFF] outline-none resize-none w-full"
                  style={{ border: "1px solid #2D2D2D" }} />
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-ibm-mono text-[10px] text-[#555] tracking-[2px]">AUCTION IMAGE <span className="text-[#333]">— OPTIONAL</span></span>
                <div className="relative">
                  <input type="file" accept="image/*" id="img-upload" className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files && e.target.files[0];
                      if (!file) return;
                      setImageUrl("uploading...");
                      const fd = new FormData();
                      fd.append("file", file);
                      fd.append("upload_preset", "blindbid_uploads");
                      const res = await fetch("https://api.cloudinary.com/v1_1/dryopwkce/image/upload", { method: "POST", body: fd });
                      const data = await res.json();
                      setImageUrl(data.secure_url ?? "");
                    }} />
                  <label htmlFor="img-upload"
                    className="flex items-center gap-3 p-4 bg-[#111] cursor-pointer hover:bg-[#1A1A1A] transition-colors"
                    style={{ border: "1px solid #2D2D2D" }}>
                    {imageUrl && imageUrl !== "uploading..." ? (
                      <img src={imageUrl} alt="preview" className="w-[48px] h-[48px] object-cover" />
                    ) : (
                      <div className="w-[48px] h-[48px] bg-[#1A1A1A] flex items-center justify-center" style={{ border: "1px solid #333" }}>
                        <span className="text-[#555] text-[18px]">+</span>
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <span className="font-ibm-mono text-[11px] text-[#F0EEFF] tracking-[1px]">
                        {imageUrl === "uploading..." ? "UPLOADING..." : imageUrl ? "IMAGE UPLOADED ✓" : "CLICK TO UPLOAD IMAGE"}
                      </span>
                      <span className="font-ibm-mono text-[9px] text-[#444] tracking-[1px]">JPG, PNG, WEBP — MAX 10MB</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-ibm-mono text-[10px] text-[#555] tracking-[2px]">FLOOR PRICE (SOL)</span>
                <div className="flex items-center p-4 bg-[#111]" style={{ border: "1px solid #2D2D2D" }}>
                  <span className="font-grotesk text-[18px] text-[#555] mr-2">◎</span>
                  <input
                    type="number"
                    value={floor}
                    onChange={e => setFloor(e.target.value)}
                    min="0.01"
                    step="0.1"
                    placeholder="0.1"
                    className="flex-1 bg-transparent font-grotesk text-[18px] text-[#F0EEFF] outline-none border-none"
                  />
                  <span className="font-ibm-mono text-[10px] text-[#444]">SOL</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-ibm-mono text-[10px] text-[#555] tracking-[2px]">AUCTION TYPE</span>
                <div className="flex gap-[2px]">
                  {TYPES.map(({ value: t, desc }) => (
                    <button key={t} onClick={() => setType(t)}
                      className="flex-1 flex flex-col items-center justify-center gap-1 py-3 h-auto border-none cursor-pointer transition-colors"
                      style={{
                        background: type === t ? "#9945FF" : "#111",
                        border: `1px solid ${type === t ? "#9945FF" : "#2D2D2D"}`,
                      }}>
                      <span className="font-ibm-mono text-[9px] tracking-[1px] font-bold"
                        style={{ color: type === t ? "#0A0A0A" : "#888" }}>{t}</span>
                      <span className="font-ibm-mono text-[8px] tracking-[0.5px] text-center px-1 leading-[1.4]"
                        style={{ color: type === t ? "#1a0030" : "#444" }}>{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-ibm-mono text-[10px] text-[#555] tracking-[2px]">DURATION</span>
                <div className="flex gap-[2px] flex-wrap">
                  {DURATIONS.map(d => (
                    <button key={d.label} onClick={() => setDuration(d.value)}
                      className="flex items-center justify-center h-[44px] px-5 border-none cursor-pointer transition-colors"
                      style={{
                        background: duration === d.value ? "#9945FF" : "#111",
                        border: `1px solid ${duration === d.value ? "#9945FF" : "#2D2D2D"}`,
                      }}>
                      <span className="font-ibm-mono text-[9px] tracking-[1px]"
                        style={{ color: duration === d.value ? "#0A0A0A" : "#555" }}>{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleCreate} disabled={!isValid}
                className="flex items-center justify-center h-[52px] border-none transition-colors mt-2"
                style={{
                  background: isValid ? "#9945FF" : "#1A1A1A",
                  cursor: isValid ? "pointer" : "not-allowed",
                }}>
                <span className="font-grotesk text-[12px] font-bold tracking-[2px]"
                  style={{ color: isValid ? "#0A0A0A" : "#333" }}>
                  CREATE AUCTION — ◎ {AUCTION_CREATION_FEE / LAMPORTS_PER_SOL} SOL
                </span>
              </button>
            </div>

          ) : step === "submitting" ? (
            <div className="flex flex-col items-center gap-6 py-10">
              <div className="w-[48px] h-[48px] border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: "#9945FF", borderTopColor: "transparent" }} />
              <span className="font-grotesk text-[14px] font-bold text-[#F0EEFF] tracking-[1px]">CREATING AUCTION</span>
              <span className="font-ibm-mono text-[11px] text-[#555]">APPROVE IN YOUR WALLET...</span>
            </div>

          ) : step === "success" ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="flex items-center justify-center w-[56px] h-[56px] bg-[#4ADE80]">
                  <span className="font-grotesk text-[24px] font-bold text-[#0A0A0A]">✓</span>
                </div>
                <span className="font-grotesk text-[18px] font-bold text-[#F0EEFF]">AUCTION CREATED</span>
                <span className="font-ibm-mono text-[11px] text-[#555] text-center tracking-[1px]">
                  YOUR AUCTION IS LIVE ON SOLANA DEVNET
                </span>
              </div>
              <div className="flex flex-col gap-2 p-4 bg-[#0A0A0A]" style={{ border: "1px solid #1A1A1A" }}>
                <span className="font-ibm-mono text-[10px] text-[#444] tracking-[2px]">TRANSACTION</span>
                <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
                  target="_blank" rel="noreferrer"
                  className="font-ibm-mono text-[11px] break-all hover:opacity-80 transition-opacity"
                  style={{ color: "#9945FF" }}>{txSig}</a>
              </div>
              <button onClick={onClose}
                className="flex items-center justify-center h-[52px] border-none cursor-pointer"
                style={{ background: "#9945FF" }}>
                <span className="font-grotesk text-[12px] font-bold text-[#0A0A0A] tracking-[2px]">DONE</span>
              </button>
            </div>

          ) : (
            <div className="flex flex-col gap-4 py-4">
              <span className="font-ibm-mono text-[11px] text-[#ff4444] text-center leading-[1.6]">{error}</span>
              <button onClick={() => setStep("form")}
                className="flex items-center justify-center h-[52px] border-none cursor-pointer"
                style={{ background: "#9945FF" }}>
                <span className="font-grotesk text-[12px] font-bold text-[#0A0A0A] tracking-[2px]">TRY AGAIN</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
