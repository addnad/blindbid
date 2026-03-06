"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { getSolBalance, shortenAddress } from "@/lib/arcium";
import { getAuctionsByCreator, getBidsByWallet, type Auction, type PlacedBid } from "@/lib/store";
import Link from "next/link";

const EXPLORER_TX  = (sig: string) => `https://explorer.solana.com/tx/${sig}?cluster=devnet`;

export default function ProfilePage() {
  const { connected, publicKey } = useWallet();
  const { setVisible }           = useWalletModal();

  const [balance, setBalance]       = useState<number | null>(null);
  const [myAuctions, setMyAuctions] = useState<Auction[]>([]);
  const [myBids, setMyBids]         = useState<PlacedBid[]>([]);
  const [tab, setTab]               = useState<"bids" | "auctions">("bids");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!publicKey) return;
    setRefreshing(true);
    const addr = publicKey.toBase58();
    try {
      const bal = await getSolBalance(publicKey);
      setBalance(bal);
    } catch { setBalance(0); }
    setMyAuctions(getAuctionsByCreator(addr));
    setMyBids(getBidsByWallet(addr));
    setRefreshing(false);
  }, [publicKey]);

  useEffect(() => { load(); }, [load]);

  return (
    <main className="flex flex-col w-full min-h-screen bg-[#0A0A0A] pt-[60px]">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 md:px-[48px] h-[60px]"
        style={{ borderBottom: "1px solid #1A1A1A" }}>
        <Link href="/" className="flex items-center gap-2">
          <span className="w-[8px] h-[8px] bg-[#9945FF]" />
          <span className="font-grotesk text-[12px] font-bold text-[#F0EEFF] tracking-[2px]">BLINDBID</span>
        </Link>
        <div className="flex items-center gap-4">
          <button onClick={load} disabled={refreshing}
            className="font-ibm-mono text-[10px] text-[#555] tracking-[2px] hover:text-[#9945FF] transition-colors bg-transparent border-none cursor-pointer">
            {refreshing ? "REFRESHING..." : "↻ REFRESH"}
          </button>
          <Link href="/" className="font-ibm-mono text-[10px] text-[#555] tracking-[2px] hover:text-[#F0EEFF] transition-colors">
            BACK TO HOME
          </Link>
        </div>
      </div>

      <div className="flex flex-col w-full max-w-[1100px] mx-auto px-6 md:px-[48px] py-12 gap-8">

        {!connected ? (
          <div className="flex flex-col items-center gap-6 py-20">
            <div className="flex flex-col items-center gap-3">
              <span className="font-grotesk text-[32px] font-bold text-[#F0EEFF] tracking-[-0.5px]">YOUR PROFILE</span>
              <span className="font-ibm-mono text-[12px] text-[#555] tracking-[1px]">CONNECT YOUR WALLET TO VIEW YOUR ACTIVITY</span>
            </div>
            <button onClick={() => setVisible(true)}
              className="flex items-center justify-center h-[52px] px-[40px] cursor-pointer border-none"
              style={{ background: "#9945FF" }}>
              <span className="font-grotesk text-[12px] font-bold text-[#0A0A0A] tracking-[2px]">CONNECT WALLET</span>
            </button>
          </div>

        ) : (
          <>
            {/* Page title */}
            <div className="flex flex-col gap-1">
              <span className="font-ibm-mono text-[10px] text-[#444] tracking-[3px]">// WALLET PROFILE</span>
              <h1 className="font-grotesk text-[32px] font-bold text-[#F0EEFF] tracking-[-0.5px]">MY ACTIVITY</h1>
            </div>

            {/* Wallet cards */}
            <div className="flex flex-col md:flex-row gap-[2px]">

              {/* Address */}
              <div className="flex flex-col gap-3 p-6 md:p-8 bg-[#111111] flex-1"
                style={{ borderTop: "3px solid #9945FF" }}>
                <span className="font-ibm-mono text-[10px] text-[#444] tracking-[2px]">CONNECTED WALLET</span>
                <span className="font-grotesk text-[13px] md:text-[15px] font-bold text-[#F0EEFF] break-all">
                  {publicKey?.toBase58()}
                </span>
                <div className="flex items-center gap-6 mt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-[6px] h-[6px] bg-[#4ADE80] rounded-full" />
                    <span className="font-ibm-mono text-[10px] text-[#4ADE80] tracking-[1.5px]">DEVNET</span>
                  </div>
                  <a href={`https://explorer.solana.com/address/${publicKey?.toBase58()}?cluster=devnet`}
                    target="_blank" rel="noreferrer"
                    className="font-ibm-mono text-[10px] text-[#555] tracking-[1.5px] hover:text-[#9945FF] transition-colors">
                    VIEW ON EXPLORER
                  </a>
                </div>
              </div>

              {/* Balance */}
              <div className="flex flex-col gap-2 p-6 md:p-8 bg-[#111111] md:w-[220px]"
                style={{ borderTop: "3px solid #4ADE80" }}>
                <span className="font-ibm-mono text-[10px] text-[#444] tracking-[2px]">SOL BALANCE</span>
                <span className="font-grotesk text-[44px] font-bold text-[#4ADE80] leading-none tracking-[-2px]">
                  {balance !== null ? balance.toFixed(3) : "..."}
                </span>
                <span className="font-ibm-mono text-[10px] text-[#555] tracking-[1.5px]">SOLANA DEVNET</span>
                {balance !== null && balance < 0.05 && (
                  <a href="https://faucet.solana.com" target="_blank" rel="noreferrer"
                    className="font-ibm-mono text-[10px] text-[#FF6B35] tracking-[1px] hover:opacity-80 transition-opacity mt-1">
                    LOW — GET FREE SOL
                  </a>
                )}
              </div>

              {/* Stats */}
              <div className="flex flex-col gap-3 p-6 md:p-8 bg-[#111111] md:w-[180px]"
                style={{ borderTop: "3px solid #A78BFA" }}>
                <span className="font-ibm-mono text-[10px] text-[#444] tracking-[2px]">ACTIVITY</span>
                <div className="flex flex-col gap-4 mt-1">
                  <div className="flex flex-col gap-1">
                    <span className="font-grotesk text-[36px] font-bold text-[#9945FF] leading-none">{myBids.length}</span>
                    <span className="font-ibm-mono text-[10px] text-[#555] tracking-[1px]">BIDS PLACED</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-grotesk text-[36px] font-bold text-[#A78BFA] leading-none">{myAuctions.length}</span>
                    <span className="font-ibm-mono text-[10px] text-[#555] tracking-[1px]">AUCTIONS CREATED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-[2px] w-full">
              {(["bids", "auctions"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className="flex items-center justify-center h-[48px] px-8 cursor-pointer border-none transition-all"
                  style={{
                    background:  tab === t ? "#9945FF" : "#111111",
                    borderBottom: tab === t ? "none" : "2px solid #2D2D2D",
                  }}>
                  <span className="font-grotesk text-[12px] font-bold tracking-[2px]"
                    style={{ color: tab === t ? "#0A0A0A" : "#444" }}>
                    {t === "bids"
                      ? `MY BIDS (${myBids.length})`
                      : `MY AUCTIONS (${myAuctions.length})`}
                  </span>
                </button>
              ))}
              <div className="flex-1" style={{ borderBottom: "2px solid #2D2D2D" }} />
            </div>

            {/* Bids tab */}
            {tab === "bids" && (
              <div className="flex flex-col gap-[2px]">
                {myBids.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 py-16 bg-[#111]"
                    style={{ border: "1px solid #1A1A1A" }}>
                    <span className="font-grotesk text-[18px] font-bold text-[#333] tracking-[1px]">NO BIDS YET</span>
                    <span className="font-ibm-mono text-[11px] text-[#333] tracking-[1px]">
                      YOUR SEALED BIDS WILL APPEAR HERE
                    </span>
                    <Link href="/"
                      className="flex items-center justify-center h-[44px] px-6 mt-2 no-underline"
                      style={{ background: "#9945FF" }}>
                      <span className="font-grotesk text-[11px] font-bold text-[#0A0A0A] tracking-[2px]">BROWSE AUCTIONS</span>
                    </Link>
                  </div>
                ) : (
                  myBids.map((bid, i) => (
                    <div key={i} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-[#111111]"
                      style={{ borderLeft: "3px solid #9945FF" }}>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-ibm-mono text-[9px] text-[#444] tracking-[2px]">{bid.auctionId}</span>
                          <span className="font-ibm-mono text-[9px] text-[#4ADE80] tracking-[2px]">SEALED</span>
                        </div>
                        <span className="font-grotesk text-[15px] font-bold text-[#F0EEFF]">{bid.auctionName}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-ibm-mono text-[10px] text-[#444]">COMMITMENT:</span>
                          <span className="font-ibm-mono text-[10px] text-[#555]">{bid.commitment.slice(0, 20)}...</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-ibm-mono text-[10px] text-[#444]">TX:</span>
                          <a href={EXPLORER_TX(bid.txSignature)} target="_blank" rel="noreferrer"
                            className="font-ibm-mono text-[10px] tracking-[0.5px] hover:opacity-80 transition-opacity"
                            style={{ color: "#9945FF" }}>
                            {bid.txSignature.slice(0, 20)}...
                          </a>
                        </div>
                        <span className="font-ibm-mono text-[9px] text-[#333]">
                          {new Date(bid.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex flex-col gap-1 text-right">
                          <span className="font-grotesk text-[26px] font-bold text-[#9945FF]">
                            ◎ {bid.amountSol.toFixed(3)}
                          </span>
                          <span className="font-ibm-mono text-[9px] text-[#555] tracking-[1px]">BID AMOUNT</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Auctions tab */}
            {tab === "auctions" && (
              <div className="flex flex-col gap-[2px]">
                {myAuctions.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 py-16 bg-[#111]"
                    style={{ border: "1px solid #1A1A1A" }}>
                    <span className="font-grotesk text-[18px] font-bold text-[#333] tracking-[1px]">NO AUCTIONS YET</span>
                    <span className="font-ibm-mono text-[11px] text-[#333] tracking-[1px]">
                      AUCTIONS YOU CREATE WILL APPEAR HERE
                    </span>
                    <Link href="/"
                      className="flex items-center justify-center h-[44px] px-6 mt-2 no-underline"
                      style={{ background: "#9945FF" }}>
                      <span className="font-grotesk text-[11px] font-bold text-[#0A0A0A] tracking-[2px]">CREATE AUCTION</span>
                    </Link>
                  </div>
                ) : (
                  myAuctions.map((auction, i) => (
                    <div key={i} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-[#111111]"
                      style={{ borderLeft: `3px solid ${auction.accent}` }}>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-ibm-mono text-[9px] text-[#444] tracking-[2px]">{auction.id}</span>
                          <span className="font-ibm-mono text-[9px] text-[#444] tracking-[2px]">{auction.type}</span>
                          <span className="font-ibm-mono text-[9px] tracking-[1.5px]"
                            style={{ color: auction.statusColor }}>{auction.status}</span>
                        </div>
                        <span className="font-grotesk text-[15px] font-bold text-[#F0EEFF]">{auction.name}</span>
                        <span className="font-ibm-mono text-[10px] text-[#555]">
                          FLOOR: {auction.floor} // {auction.bids} SEALED BIDS
                        </span>
                        {auction.txSignature && (
                          <div className="flex items-center gap-2">
                            <span className="font-ibm-mono text-[10px] text-[#444]">TX:</span>
                            <a href={EXPLORER_TX(auction.txSignature)} target="_blank" rel="noreferrer"
                              className="font-ibm-mono text-[10px] hover:opacity-80 transition-opacity"
                              style={{ color: auction.accent }}>
                              {auction.txSignature.slice(0, 20)}...
                            </a>
                          </div>
                        )}
                        <span className="font-ibm-mono text-[9px] text-[#333]">
                          CREATED: {new Date(auction.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="font-grotesk text-[28px] font-bold" style={{ color: auction.accent }}>
                          {auction.bids}
                        </span>
                        <span className="font-ibm-mono text-[9px] text-[#555] tracking-[1px]">SEALED BIDS</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
