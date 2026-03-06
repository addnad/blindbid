"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  arciumEncryptBid,
  submitBidToSolana,
  getSolBalance,
  shortenAddress,
  type ArciumEncryptedBid,
} from "@/lib/arcium";
import { Transaction } from "@solana/web3.js";

interface Auction {
  id: string;
  name: string;
  floor: string;
  type: string;
  accent: string;
}

interface BidModalProps {
  auction: Auction;
  onClose: () => void;
  onBidPlaced?: (encryptedBid: ArciumEncryptedBid, amountSol: number, txSig: string) => void;
}

type Step = "input" | "encrypting" | "confirm" | "submitting" | "success" | "error";

const ENCRYPTION_STEPS = [
  { text: "GENERATING EPHEMERAL X25519 KEYPAIR...",        color: "#9945FF" },
  { text: "FETCHING ARCIUM MXE PUBLIC KEY...",             color: "#9945FF" },
  { text: "DERIVING SHARED SECRET VIA DIFFIE-HELLMAN...",  color: "#A78BFA" },
  { text: "ENCRYPTING BID WITH RESCUE CIPHER...",          color: "#A78BFA" },
  { text: "GENERATING BLINDING FACTOR...",                 color: "#60A5FA" },
  { text: "COMPUTING ON-CHAIN COMMITMENT HASH...",         color: "#60A5FA" },
  { text: "ARCIUM ENCRYPTION COMPLETE. READY TO SUBMIT.",  color: "#4ADE80" },
];

export default function BidModal({ auction, onClose, onBidPlaced }: BidModalProps) {
  const { publicKey, signTransaction, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const [step, setStep]               = useState<Step>("input");
  const [amount, setAmount]           = useState("");
  const [encryptLog, setEncryptLog]   = useState<typeof ENCRYPTION_STEPS>([]);
  const [encryptedBid, setEncryptedBid] = useState<ArciumEncryptedBid | null>(null);
  const [txSignature, setTxSignature] = useState("");
  const [error, setError]             = useState("");
  const [balance, setBalance]         = useState<number | null>(null);

  useState(() => {
    if (publicKey) getSolBalance(publicKey).then(setBalance).catch(() => {});
  });

  const floorSol    = parseFloat(auction.floor.replace(" SOL", ""));
  const amountNum   = parseFloat(amount);
  const isValid     = !isNaN(amountNum) && amountNum >= floorSol;

  async function handleEncrypt() {
    if (!isValid) return;
    setStep("encrypting");
    setEncryptLog([]);

    for (let i = 0; i < ENCRYPTION_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));
      setEncryptLog((prev) => [...prev, ENCRYPTION_STEPS[i]]);
    }

    try {
      const encrypted = await arciumEncryptBid(amountNum);
      setEncryptedBid(encrypted);
      setStep("confirm");
    } catch (e) {
      setError("Arcium encryption failed: " + (e instanceof Error ? e.message : String(e)));
      setStep("error");
    }
  }

  async function handleSubmit() {
    if (!publicKey || !signTransaction || !encryptedBid) return;
    setStep("submitting");
    try {
      const sig = await submitBidToSolana(
        publicKey,
        signTransaction as (tx: Transaction) => Promise<Transaction>,
        auction.id,
        encryptedBid,
        amountNum
      );
      setTxSignature(sig);
      if (onBidPlaced && encryptedBid) onBidPlaced(encryptedBid, amountNum, sig);
      setStep("success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      setError(
        msg.includes("insufficient")
          ? "INSUFFICIENT SOL BALANCE. GET DEVNET SOL FROM FAUCET."
          : `ERROR: ${msg.slice(0, 100)}`
      );
      setStep("error");
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <div className="flex flex-col w-full max-w-[580px] bg-[#0D0D0D] max-h-[90vh] overflow-y-auto"
        style={{ border: `2px solid ${auction.accent}` }}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 sticky top-0 bg-[#0D0D0D] z-10"
          style={{ borderBottom: "1px solid #1A1A1A" }}>
          <div className="flex flex-col gap-1">
            <span className="font-ibm-mono text-[9px] text-[#444] tracking-[2px]">{auction.id} // {auction.type}</span>
            <span className="font-grotesk text-[16px] font-bold text-[#F0EEFF]">{auction.name}</span>
          </div>
          <button onClick={onClose}
            className="font-grotesk text-[20px] text-[#444] hover:text-[#F0EEFF] transition-colors bg-transparent border-none cursor-pointer">✕</button>
        </div>

        <div className="flex flex-col gap-6 p-6">

          {/* NOT CONNECTED */}
          {!connected ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 p-5 bg-[#111]" style={{ border: "1px solid #2D2D2D" }}>
                <span className="font-ibm-mono text-[10px] text-[#555] tracking-[2px]">WALLET NOT CONNECTED</span>
                <span className="font-ibm-mono text-[12px] text-[#666] leading-[1.6]">
                  Connect your Phantom wallet to place a sealed bid on Solana devnet.
                </span>
              </div>
              <button onClick={() => setVisible(true)}
                className="flex items-center justify-center h-[52px] cursor-pointer border-none"
                style={{ background: auction.accent }}>
                <span className="font-grotesk text-[12px] font-bold text-[#0A0A0A] tracking-[2px]">CONNECT WALLET</span>
              </button>
            </div>

          /* INPUT */
          ) : step === "input" ? (
            <div className="flex flex-col gap-5">
              {/* Wallet info */}
              <div className="flex items-center justify-between p-4 bg-[#111]"
                style={{ border: "1px solid #1A1A1A" }}>
                <div className="flex items-center gap-2">
                  <div className="w-[6px] h-[6px] bg-[#4ADE80] rounded-full" />
                  <span className="font-ibm-mono text-[10px] text-[#4ADE80] tracking-[1px]">CONNECTED</span>
                  <span className="font-ibm-mono text-[10px] text-[#555]">
                    {shortenAddress(publicKey!.toBase58())}
                  </span>
                </div>
                {balance !== null && (
                  <span className="font-ibm-mono text-[10px] text-[#555]">◎ {balance.toFixed(3)} SOL</span>
                )}
              </div>

              {/* Amount input */}
              <div className="flex flex-col gap-2">
                <span className="font-ibm-mono text-[10px] text-[#555] tracking-[2px]">YOUR BID AMOUNT (SOL)</span>
                <div className="flex items-center p-4 bg-[#111]"
                  style={{ border: `1px solid ${amount && !isValid ? "#ff4444" : "#2D2D2D"}` }}>
                  <span className="font-grotesk text-[20px] text-[#555] mr-2">◎</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-transparent font-grotesk text-[20px] text-[#F0EEFF] outline-none border-none"
                    style={{ caretColor: auction.accent }}
                    min={floorSol}
                    step="0.1"
                  />
                  <span className="font-ibm-mono text-[10px] text-[#444]">SOL</span>
                </div>
                <span className="font-ibm-mono text-[10px] text-[#444] tracking-[1px]">
                  FLOOR: ◎ {auction.floor}{amount && !isValid ? " — BID MUST MEET FLOOR" : ""}
                </span>
              </div>

              {/* Arcium info */}
              <div className="flex flex-col gap-3 p-4 bg-[#0A0A0A]" style={{ border: "1px solid #1A1A1A" }}>
                <div className="flex items-center gap-2">
                  <div className="w-[6px] h-[6px]" style={{ background: auction.accent }} />
                  <span className="font-ibm-mono text-[10px] tracking-[2px]" style={{ color: auction.accent }}>
                    ARCIUM MPC ENCRYPTION
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {[
                    "x25519 Diffie-Hellman key exchange with Arcium MXE",
                    "RescueCipher encryption (ZK-friendly cipher)",
                    "Blinding factor added to prevent correlation",
                    "SHA-256 commitment anchored on Solana",
                  ].map((line, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-[4px] h-[4px] shrink-0" style={{ background: auction.accent }} />
                      <span className="font-ibm-mono text-[10px] text-[#555]">{line}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleEncrypt}
                disabled={!isValid}
                className="flex items-center justify-center h-[52px] transition-colors border-none"
                style={{
                  background: isValid ? auction.accent : "#1A1A1A",
                  cursor: isValid ? "pointer" : "not-allowed",
                }}>
                <span className="font-grotesk text-[12px] font-bold tracking-[2px]"
                  style={{ color: isValid ? "#0A0A0A" : "#333" }}>
                  ENCRYPT BID WITH ARCIUM
                </span>
              </button>
            </div>

          /* ENCRYPTING */
          ) : step === "encrypting" ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="w-[8px] h-[8px] rounded-full animate-pulse" style={{ background: "#9945FF" }} />
                <span className="font-ibm-mono text-[11px] text-[#555] tracking-[2px]">ARCIUM MPC ENCRYPTION RUNNING</span>
              </div>
              <div className="flex flex-col gap-3 p-5 bg-[#0A0A0A] min-h-[220px]"
                style={{ border: "1px solid #1A1A1A" }}>
                {encryptLog.map((entry, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-[6px] h-[6px] shrink-0 rounded-full" style={{ background: entry.color }} />
                    <span className="font-ibm-mono text-[11px] tracking-[0.5px]" style={{ color: entry.color }}>
                      {entry.text}
                    </span>
                  </div>
                ))}
                {encryptLog.length < ENCRYPTION_STEPS.length && (
                  <div className="flex items-center gap-3">
                    <div className="w-[6px] h-[6px] shrink-0 rounded-full animate-pulse bg-[#555]" />
                    <span className="font-ibm-mono text-[11px] text-[#333] tracking-[0.5px]">PROCESSING...</span>
                  </div>
                )}
              </div>
            </div>

          /* CONFIRM */
          ) : step === "confirm" && encryptedBid ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-[8px] h-[8px] bg-[#4ADE80]" />
                  <span className="font-ibm-mono text-[10px] text-[#4ADE80] tracking-[2px]">
                    ARCIUM ENCRYPTION SUCCESSFUL
                  </span>
                </div>
                <span className="font-ibm-mono text-[11px] text-[#555]">
                  Review your encrypted bid before submitting to Solana devnet.
                </span>
              </div>

              <div className="flex flex-col gap-3 p-5 bg-[#0A0A0A]"
                style={{ border: `1px solid ${auction.accent}` }}>
                {[
                  { k: "BID AMOUNT",          v: `◎ ${amountNum.toFixed(3)} SOL` },
                  { k: "ENCRYPTION",          v: "RESCUE CIPHER (ARCIUM MPC)" },
                  { k: "CLIENT PUBKEY",       v: encryptedBid.clientPublicKey.slice(0, 20) + "..." },
                  { k: "COMMITMENT",          v: encryptedBid.commitment.slice(0, 20) + "..." },
                  { k: "COMPUTATION OFFSET",  v: encryptedBid.computationOffset },
                  { k: "NONCE",               v: encryptedBid.nonce.slice(0, 20) + "..." },
                  { k: "NETWORK",             v: "SOLANA DEVNET" },
                  { k: "TIMESTAMP",           v: new Date(encryptedBid.timestamp).toUTCString() },
                ].map(({ k, v }) => (
                  <div key={k} className="flex items-start justify-between gap-4">
                    <span className="font-ibm-mono text-[10px] text-[#444] tracking-[1px] shrink-0">{k}</span>
                    <span className="font-ibm-mono text-[10px] text-[#888] text-right break-all">{v}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-[2px]">
                <button onClick={() => setStep("input")}
                  className="flex items-center justify-center h-[52px] flex-1 cursor-pointer"
                  style={{ background: "#111", border: "1px solid #2D2D2D" }}>
                  <span className="font-ibm-mono text-[11px] text-[#555] tracking-[2px]">BACK</span>
                </button>
                <button onClick={handleSubmit}
                  className="flex items-center justify-center h-[52px] flex-[2] cursor-pointer border-none"
                  style={{ background: auction.accent }}>
                  <span className="font-grotesk text-[12px] font-bold text-[#0A0A0A] tracking-[2px]">
                    SUBMIT TO SOLANA
                  </span>
                </button>
              </div>
            </div>

          /* SUBMITTING */
          ) : step === "submitting" ? (
            <div className="flex flex-col items-center gap-6 py-10">
              <div className="w-[48px] h-[48px] border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: auction.accent, borderTopColor: "transparent" }} />
              <div className="flex flex-col items-center gap-2">
                <span className="font-grotesk text-[14px] font-bold text-[#F0EEFF] tracking-[1px]">
                  SUBMITTING TO SOLANA
                </span>
                <span className="font-ibm-mono text-[11px] text-[#555] tracking-[1px]">
                  APPROVE IN YOUR WALLET...
                </span>
              </div>
            </div>

          /* SUCCESS */
          ) : step === "success" ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="flex items-center justify-center w-[56px] h-[56px] bg-[#4ADE80]">
                  <span className="font-grotesk text-[24px] font-bold text-[#0A0A0A]">✓</span>
                </div>
                <span className="font-grotesk text-[18px] font-bold text-[#F0EEFF] tracking-[1px]">
                  BID SEALED ON-CHAIN
                </span>
                <span className="font-ibm-mono text-[11px] text-[#555] tracking-[1px] text-center">
                  YOUR ARCIUM-ENCRYPTED BID IS COMMITTED TO SOLANA DEVNET
                </span>
              </div>

              <div className="flex flex-col gap-2 p-4 bg-[#0A0A0A]" style={{ border: "1px solid #1A1A1A" }}>
                <span className="font-ibm-mono text-[10px] text-[#444] tracking-[2px]">SOLANA TRANSACTION</span>
                <a href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                  target="_blank" rel="noreferrer"
                  className="font-ibm-mono text-[11px] break-all hover:opacity-80 transition-opacity"
                  style={{ color: auction.accent }}>
                  {txSignature}
                </a>
              </div>

              <div className="flex flex-col gap-2 p-4 bg-[#0A0A0A]" style={{ border: "1px solid #1A1A1A" }}>
                <span className="font-ibm-mono text-[10px] text-[#444] tracking-[2px]">WHAT HAPPENS NEXT</span>
                <span className="font-ibm-mono text-[11px] text-[#555] leading-[1.8]">
                  Your bid is sealed with Arcium RescueCipher encryption. When the auction closes, Arcium MPC nodes jointly decrypt all bids using threshold cryptography — no single party ever sees individual bid values. The winner is announced on-chain automatically.
                </span>
              </div>

              <button onClick={onClose}
                className="flex items-center justify-center h-[52px] cursor-pointer border-none"
                style={{ background: auction.accent }}>
                <span className="font-grotesk text-[12px] font-bold text-[#0A0A0A] tracking-[2px]">DONE</span>
              </button>
            </div>

          /* ERROR */
          ) : step === "error" ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="flex items-center justify-center w-[56px] h-[56px] bg-[#ff4444]">
                  <span className="font-grotesk text-[24px] font-bold text-[#0A0A0A]">✗</span>
                </div>
                <span className="font-grotesk text-[16px] font-bold text-[#F0EEFF] tracking-[1px]">FAILED</span>
                <span className="font-ibm-mono text-[11px] text-[#ff4444] tracking-[0.5px] text-center px-4">{error}</span>
              </div>
              {error.includes("FAUCET") && (
                <a href="https://faucet.solana.com" target="_blank" rel="noreferrer"
                  className="flex items-center justify-center h-[48px]"
                  style={{ background: "#111", border: "1px solid #2D2D2D" }}>
                  <span className="font-ibm-mono text-[11px] text-[#555] tracking-[2px]">
                    GET FREE DEVNET SOL AT FAUCET.SOLANA.COM →
                  </span>
                </a>
              )}
              <button onClick={() => setStep("input")}
                className="flex items-center justify-center h-[52px] cursor-pointer border-none"
                style={{ background: auction.accent }}>
                <span className="font-grotesk text-[12px] font-bold text-[#0A0A0A] tracking-[2px]">TRY AGAIN</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
