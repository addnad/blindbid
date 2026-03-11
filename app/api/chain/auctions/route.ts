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
    let allSigs: any[] = [];
    let before: string | undefined = undefined;

    for (let page = 0; page < 10; page++) {
      const res = await fetch(HELIUS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: 1,
          method: "getSignaturesForAddress",
          params: [TREASURY, { limit: 100, ...(before ? { before } : {}) }],
        }),
      });
      const json = await res.json();
      const sigs: any[] = json.result ?? [];
      if (sigs.length === 0) break;
      allSigs = allSigs.concat(sigs);
      before = sigs[sigs.length - 1].signature;
      if (sigs.length < 100) break;
    }

    const auctions: any[] = [];
    const bids: any[]     = [];
    const revealedAuctionIds = new Set<string>();
    let idx = 0;

    // First pass: collect all reveals
    for (const sig of allSigs) {
      const data = parseMemo(sig.memo);
      if (!data || data.programId !== PROGRAM_ID) continue;
      if (data.action === "REVEAL_WINNER") {
        revealedAuctionIds.add(data.auctionId);
      }
    }

    // Second pass: build auctions and bids
    for (const sig of allSigs) {
      const data = parseMemo(sig.memo);
      if (!data || data.programId !== PROGRAM_ID) continue;
      const blockTime = (sig.blockTime ?? 0) * 1000;

      if (data.action === "CREATE_AUCTION") {
        if (!data.imageUrl) continue; // skip auctions without images
        const durationMs = (data.duration ?? 24) * 3_600_000;
        const endsAt     = blockTime + durationMs;
        const now        = Date.now();
        const isLive     = endsAt > now;
        const originalId = data.auctionId ?? `AUC-TS-${blockTime}`;
        const isRevealed = revealedAuctionIds.has(originalId);

        let status: string;
        let statusColor: string;
        if (isLive) {
          status = "LIVE";
          statusColor = "#4ADE80";
        } else if (isRevealed) {
          status = "CLOSED";
          statusColor = "#555";
        } else {
          status = "PENDING";
          statusColor = "#FACC15";
        }

        auctions.push({
          id:          `AUC-CHAIN-${++idx}`,
          originalId,
          name:        (data.name ?? "UNNAMED AUCTION").toUpperCase(),
          description: `On-chain sealed auction via BlindBid × Arcium MPC`,
          bids:        0,
          floor:       data.floor ?? "0.1 SOL",
          closes:      new Date(endsAt).toISOString(),
          status,
          statusColor,
          type:        data.type ?? "FIRST-PRICE",
          accent:      ACCENTS[(idx - 1) % ACCENTS.length],
          imageUrl:    data.imageUrl,
          hasImage:    true,
          creator:     data.creator ?? "unknown",
          createdAt:   blockTime,
          endsAt,
          txSignature: sig.signature,
        });
      }

      if (data.action === "SEALED_BID") {
        bids.push({ auctionId: data.auctionId, timestamp: blockTime });
      }
    }

    for (const bid of bids) {
      const auction = auctions.find((a: any) => a.originalId === bid.auctionId);
      if (auction) auction.bids++;
    }

    return NextResponse.json({ auctions, bids });
  } catch (e) {
    return NextResponse.json({ auctions: [], bids: [], error: String(e) });
  }
}
