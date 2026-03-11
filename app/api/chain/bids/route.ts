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
  const createdAt  = parseInt(req.nextUrl.searchParams.get("createdAt") ?? "0");
  const endsAt     = parseInt(req.nextUrl.searchParams.get("endsAt") ?? "0");
  const auctionId  = req.nextUrl.searchParams.get("auctionId") ?? "";

  try {
    let allSigs: any[] = [];
    let before: string | undefined = undefined;

    for (let page = 0; page < 5; page++) {
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

    const bids: any[] = [];
    for (const sig of allSigs) {
      const data = parseMemo(sig.memo);
      if (!data) continue;
      if (data.programId !== PROGRAM_ID) continue;
      if (data.action !== "SEALED_BID") continue;

      const ts = (sig.blockTime ?? 0) * 1000;
      if (createdAt && endsAt && (ts < createdAt || ts > endsAt)) continue;
      if (auctionId && data.auctionId !== auctionId) continue;

      bids.push({
        auctionId:         data.auctionId,
        bidder:            data.bidder ?? "unknown",
        commitment:        data.commitment,
        ciphertext:        data.ciphertext,       // array of BigInt strings
        nonce:             data.nonce,             // bs58 encoded
        clientPublicKey:   data.clientPublicKey,   // bs58 encoded
        mxePublicKey:      data.mxePublicKey,      // bs58 encoded
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
