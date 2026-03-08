import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://devnet.helius-rpc.com/?api-key=free", "confirmed");
const TREASURY = new PublicKey("5nTn8mgEEViXYna6fmTpfV1EuwdQD7kNcJ7SPevuea7f");
const PROGRAM_ID = "EaDV1kv2CAbGVD42mhD5okEfBAABz4n38yCAY7YiaqYE";
const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
const ACCENTS = ["#9945FF", "#4ADE80", "#60A5FA", "#A78BFA", "#FF6B35", "#FACC15"];

export async function GET() {
  try {
    const sigs = await connection.getSignaturesForAddress(TREASURY, { limit: 10 });
    const txs = await connection.getParsedTransactions(
      sigs.map((s) => s.signature),
      { maxSupportedTransactionVersion: 0, commitment: "confirmed" }
    );
    const auctions: any[] = [];
    const bids: any[] = [];
    let idx = 0;
    for (const tx of txs) {
      if (!tx) continue;
      const memoIx = tx.transaction.message.instructions.find(
        (ix) => ix.programId?.toString() === MEMO_PROGRAM_ID
      );
      if (!memoIx || !('parsed' in memoIx) || !('info' in memoIx.parsed) || !('memo' in memoIx.parsed.info)) continue;
      const memoText = memoIx.parsed.info.memo;
      let data;
      try { data = JSON.parse(memoText); } catch { continue; }
      if (data.programId !== PROGRAM_ID) continue;
      const signer = tx.transaction.message.accountKeys[0]?.pubkey?.toString();
      const blockTime = (tx.blockTime ?? 0) * 1000;
      if (data.action === "CREATE_AUCTION") {
        const currentIdx = idx++;
        const durationMs = (data.duration ?? 24) * 3600000;
        const endsAt = blockTime + durationMs;
        auctions.push({
          id: `AUC-CHAIN-${currentIdx + 1}`,
          name: (data.name ?? "UNNAMED AUCTION").toUpperCase(),
          description: `On-chain auction created by ${signer?.slice(0, 8)}... via BlindBid`,
          bids: 0,
          floor: data.floor ?? "0.1 SOL",
          closes: new Date(endsAt).toISOString(),
          status: endsAt > Date.now() ? "LIVE" : "CLOSED",
          statusColor: endsAt > Date.now() ? "#4ADE80" : "#555",
          type: data.type ?? "FIRST-PRICE",
          accent: ACCENTS[currentIdx % ACCENTS.length],
          creator: signer ?? "unknown",
          createdAt: blockTime,
          endsAt,
          txSignature: sigs[txs.indexOf(tx)]?.signature,
        });
      }
      if (data.action === "SEALED_BID") {
        bids.push({
          auctionId: data.auctionId,
          bidder: signer,
          commitment: data.commitment,
          computationOffset: data.computationOffset,
          timestamp: blockTime,
          txSignature: sigs[txs.indexOf(tx)]?.signature,
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
