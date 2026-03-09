import { NextResponse } from "next/server";

const HELIUS    = "https://devnet.helius-rpc.com/?api-key=3a7216a5-da98-408f-a35b-d397332205ac";
const TREASURY  = "5nTn8mgEEViXYna6fmTpfV1EuwdQD7kNcJ7SPevuea7f";
const PROGRAM_ID = "EaDV1kv2CAbGVD42mhD5okEfBAABz4n38yCAY7YiaqYE";

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
        params: [TREASURY, { limit: 100 }],
      }),
    });
    const json = await res.json();
    const sigs: any[] = json.result ?? [];

    let auctions = 0, bids = 0, reveals = 0;

    // First pass: collect auction IDs that have images
    const validAuctionIds = new Set<string>();
    for (const sig of sigs) {
      const data = parseMemo(sig.memo);
      if (!data || data.programId !== PROGRAM_ID) continue;
      if (data.action === "CREATE_AUCTION" && data.imageUrl) {
        auctions++;
        if (data.auctionId) validAuctionIds.add(data.auctionId);
      }
    }

    // Second pass: count bids and reveals only for valid auctions
    for (const sig of sigs) {
      const data = parseMemo(sig.memo);
      if (!data || data.programId !== PROGRAM_ID) continue;
      if (data.action === "SEALED_BID" && validAuctionIds.has(data.auctionId))    bids++;
      if (data.action === "REVEAL_WINNER" && validAuctionIds.has(data.auctionId)) reveals++;
    }

    return NextResponse.json({ auctions, bids, reveals });
  } catch (e) {
    return NextResponse.json({ auctions: 0, bids: 0, reveals: 0, error: String(e) });
  }
}
