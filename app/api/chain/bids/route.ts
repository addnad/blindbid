import { NextRequest, NextResponse } from "next/server";

const HELIUS    = "https://devnet.helius-rpc.com/?api-key=3a7216a5-da98-408f-a35b-d397332205ac";
const TREASURY  = "5nTn8mgEEViXYna6fmTpfV1EuwdQD7kNcJ7SPevuea7f";
const PROGRAM_ID = "EaDV1kv2CAbGVD42mhD5okEfBAABz4n38yCAY7YiaqYE";

function parseMemo(memo: string | null): any {
  if (!memo) return null;
  try { return JSON.parse(memo.replace(/^\[\d+\]\s*/, "")); }
  catch { return null; }
}

export async function GET(req: NextRequest) {
  const createdAt = parseInt(req.nextUrl.searchParams.get("createdAt") ?? "0");
  const endsAt    = parseInt(req.nextUrl.searchParams.get("endsAt") ?? "0");

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

    const bids: any[] = [];
    for (const sig of sigs) {
      const data = parseMemo(sig.memo);
      if (!data) continue;
      if (data.programId !== PROGRAM_ID) continue;
      if (data.action !== "SEALED_BID") continue;
      const ts = (sig.blockTime ?? 0) * 1000;
      if (createdAt && endsAt && (ts < createdAt || ts > endsAt)) continue;
      bids.push({
        auctionId:         data.auctionId,
        bidder:            "unknown",
        commitment:        data.commitment,
        computationOffset: data.computationOffset,
        timestamp:         ts,
        txSignature:       sig.signature,
      });
    }
    return NextResponse.json({ bids });
  } catch (e) {
    return NextResponse.json({ bids: [], error: String(e) });
  }
}
