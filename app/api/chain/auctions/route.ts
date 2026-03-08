import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection(
  `https://devnet.helius-rpc.com/?api-key=3a7216a5-da98-408f-a35b-d397332205ac`,
  "confirmed"
);
const TREASURY     = new PublicKey("5nTn8mgEEViXYna6fmTpfV1EuwdQD7kNcJ7SPevuea7f");
const PROGRAM_ID   = "EaDV1kv2CAbGVD42mhD5okEfBAABz4n38yCAY7YiaqYE";
const MEMO_PROGRAM = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
const ACCENTS      = ["#9945FF","#4ADE80","#60A5FA","#A78BFA","#FF6B35","#FACC15"];

function extractMemo(tx: any): string | null {
  const ixs = tx?.transaction?.message?.instructions ?? [];
  for (const ix of ixs) {
    const pid = ix.programId?.toString();
    if (pid !== MEMO_PROGRAM) continue;
    // parsed can be a plain string or { type, info } or { type, info: { memo } }
    if (typeof ix.parsed === "string")       return ix.parsed;
    if (typeof ix.parsed?.info === "string") return ix.parsed.info;
    if (typeof ix.parsed?.info?.memo === "string") return ix.parsed.info.memo;
    // fallback: partially decoded — data is base58, skip
  }
  return null;
}

export async function GET() {
  try {
    const sigs = await connection.getSignaturesForAddress(TREASURY, { limit: 50 });
    const txs  = await connection.getParsedTransactions(
      sigs.map((s) => s.signature),
      { maxSupportedTransactionVersion: 0, commitment: "confirmed" }
    );

    const auctions: any[] = [];
    const bids: any[]     = [];
    let idx = 0;

    for (let i = 0; i < txs.length; i++) {
      const tx = txs[i];
      if (!tx) continue;

      const memoText = extractMemo(tx);
      if (!memoText) continue;

      let data: any;
      try { data = JSON.parse(memoText); } catch { continue; }
      if (data.programId !== PROGRAM_ID) continue;

      const signer    = tx.transaction.message.accountKeys[0]?.pubkey?.toString();
      const blockTime = (tx.blockTime ?? 0) * 1000;
      const sig       = sigs[i]?.signature;

      if (data.action === "CREATE_AUCTION") {
        const durationMs = (data.duration ?? 24) * 3600_000;
        const endsAt     = blockTime + durationMs;
        const live       = endsAt > Date.now();
        auctions.push({
          id:          `AUC-CHAIN-${++idx}`,
          name:        (data.name ?? "UNNAMED AUCTION").toUpperCase(),
          description: `On-chain auction by ${signer?.slice(0,8)}... via BlindBid`,
          bids:        0,
          floor:       data.floor ?? "0.1 SOL",
          closes:      new Date(endsAt).toISOString(),
          status:      live ? "LIVE" : "CLOSED",
          statusColor: live ? "#4ADE80" : "#555",
          type:        data.type ?? "FIRST-PRICE",
          accent:      ACCENTS[(idx - 1) % ACCENTS.length],
          creator:     signer ?? "unknown",
          createdAt:   blockTime,
          endsAt,
          txSignature: sig,
        });
      }

      if (data.action === "SEALED_BID") {
        bids.push({
          auctionId:         data.auctionId,
          bidder:            signer,
          commitment:        data.commitment,
          computationOffset: data.computationOffset,
          timestamp:         blockTime,
          txSignature:       sig,
        });
      }
    }

    for (const bid of bids) {
      const auction = auctions.find((a) => a.id === bid.auctionId);
      if (auction) auction.bids++;
    }

    return NextResponse.json({ auctions, bids });
  } catch (e) {
    return NextResponse.json({ auctions: [], bids: [], error: String(e) });
  }
}
