import { NextResponse } from "next/server";

const HELIUS    = "https://devnet.helius-rpc.com/?api-key=3a7216a5-da98-408f-a35b-d397332205ac";
const TREASURY  = "5nTn8mgEEViXYna6fmTpfV1EuwdQD7kNcJ7SPevuea7f";
const PROGRAM_ID   = "EaDV1kv2CAbGVD42mhD5okEfBAABz4n38yCAY7YiaqYE";
const ACCENTS      = ["#9945FF","#4ADE80","#60A5FA","#A78BFA","#FF6B35","#FACC15"];

function parseMemo(memo: string | null): any {
  if (!memo) return null;
  try { return JSON.parse(memo.replace(/^\[\d+\]\s*/, "")); }
  catch { return null; }
}

export async function GET() {
  try {
    const res = await fetch(HELIUS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1,
        method: "getSignaturesForAddress",
        params: [TREASURY, { limit: 50 }],
      }),
    });
    const json = await res.json();
    const sigs: any[] = json.result ?? [];

    const auctions: any[] = [];
    const bids: any[]     = [];
    let idx = 0;

    for (const sig of sigs) {
      const data = parseMemo(sig.memo);
      if (!data || data.programId !== PROGRAM_ID) continue;
      const blockTime = (sig.blockTime ?? 0) * 1000;

      if (data.action === "CREATE_AUCTION") {
        const durationMs = (data.duration ?? 24) * 3_600_000;
        const endsAt     = blockTime + durationMs;
        const live       = endsAt > Date.now();
        auctions.push({
          id:          `AUC-CHAIN-${++idx}`,
          name:        (data.name ?? "UNNAMED AUCTION").toUpperCase(),
          description: `On-chain sealed auction via BlindBid × Arcium MPC`,
          bids:        0,
          floor:       data.floor ?? "0.1 SOL",
          closes:      new Date(endsAt).toISOString(),
          status:      live ? "LIVE" : "CLOSED",
          statusColor: live ? "#4ADE80" : "#555",
          type:        data.type ?? "FIRST-PRICE",
          accent:      ACCENTS[(idx - 1) % ACCENTS.length],
          imageUrl:    data.imageUrl ?? null,
          hasImage:    !!(data.imageUrl),
          creator:     "unknown",
          createdAt:   blockTime,
          endsAt,
          txSignature: sig.signature,
        });
      }

      if (data.action === "SEALED_BID") {
        bids.push({ auctionId: data.auctionId, timestamp: blockTime });
      }
    }

    // match bids to auctions by time window
    for (const bid of bids) {
      const auction = auctions.find(
        (a) => bid.timestamp >= a.createdAt && bid.timestamp <= a.endsAt
      );
      if (auction) auction.bids++;
    }

    const filtered = auctions.filter((a: any) => a.imageUrl);
    return NextResponse.json({ auctions: filtered, bids });
  } catch (e) {
    return NextResponse.json({ auctions: [], bids: [], error: String(e) });
  }
}
