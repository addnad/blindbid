import { NextRequest, NextResponse } from "next/server";

const HELIUS    = process.env.HELIUS_RPC_URL!;
const TREASURY  = "5nTn8mgEEViXYna6fmTpfV1EuwdQD7kNcJ7SPevuea7f";
const PROGRAM_ID = "87ze8FFkYPnUaXUQZwoC2K14p6ju8YYCaAG7nGB8HLUh";

function parseMemo(memo: string | null): any {
  if (!memo) return null;
  try { return JSON.parse(memo.replace(/^\[\d+\]\s*/, "")); }
  catch { return null; }
}


async function fetchAndValidateTx(sig: string, expectedSigner: string, helius: string): Promise<boolean> {
  try {
    const res = await fetch(helius, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1,
        method: "getTransaction",
        params: [sig, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }],
      }),
    });
    const json = await res.json();
    const tx = json.result;
    if (!tx) return false;

    // Verify the fee payer / first signer matches the claimed signer in memo
    const signers: string[] = tx.transaction?.message?.accountKeys
      ?.filter((k: any) => k.signer)
      .map((k: any) => k.pubkey) ?? [];
    if (!expectedSigner || !signers.includes(expectedSigner)) return false;

    // Verify at least one SOL transfer to treasury exists in the tx
    const TREASURY = "5nTn8mgEEViXYna6fmTpfV1EuwdQD7kNcJ7SPevuea7f";
    const instructions = tx.transaction?.message?.instructions ?? [];
    const hasTransfer = instructions.some((ix: any) =>
      ix.parsed?.type === "transfer" &&
      ix.parsed?.info?.destination === TREASURY &&
      parseInt(ix.parsed?.info?.lamports ?? "0") > 0
    );
    return hasTransfer;
  } catch {
    return false;
  }
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

    // First pass: collect cipher memos keyed by commitment
    // Cipher txs are sent from bidder wallets (no treasury transfer) so they don't
    // appear in treasury history. We extract bidders from allSigs first, then scan
    // each bidder's recent tx history to find their SEALED_BID_CIPHER companion tx.
    const cipherMap = new Map<string, any>();

    // Extract unique bidders from main bid txs in allSigs
    const bidderSet = new Set<string>();
    for (const sig of allSigs) {
      const data = parseMemo(sig.memo);
      if (!data || data.programId !== PROGRAM_ID || data.action !== "SEALED_BID") continue;
      if (auctionId && data.auctionId !== auctionId) continue;
      if (data.bidder && data.bidder !== "unknown") bidderSet.add(data.bidder);
    }

    // Fetch recent txs for each bidder and find their cipher companion txs
    await Promise.all([...bidderSet].map(async (bidder) => {
      try {
        const res = await fetch(HELIUS, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0", id: 1,
            method: "getSignaturesForAddress",
            params: [bidder, { limit: 20 }],
          }),
        });
        const json = await res.json();
        const bidderSigs: any[] = json.result ?? [];

        await Promise.all(bidderSigs.map(async (s) => {
          if (!s.memo) return;
          const data = parseMemo(s.memo);
          if (!data || data.action !== "SEALED_BID_CIPHER") return;
          if (auctionId && data.auctionId !== auctionId) return;
          if (data.bidder !== bidder) return;
          if (!data.commitment) return;
          cipherMap.set(data.commitment, data);
        }));
      } catch {}
    }));

    // Pre-filter relevant bid sigs
    const bidSigs = allSigs.filter(sig => {
      const data = parseMemo(sig.memo);
      if (!data || data.programId !== PROGRAM_ID || data.action !== "SEALED_BID") return false;
      const ts = (sig.blockTime ?? 0) * 1000;
      if (createdAt && endsAt && (ts < createdAt || ts > endsAt)) return false;
      if (auctionId && data.auctionId !== auctionId) return false;
      return true;
    });

    // Validate all bid sigs in parallel
    const bidValidations = await Promise.all(
      bidSigs.map(async sig => {
        const data = parseMemo(sig.memo);
        const claimedBidder = data.bidder ?? "";
        const valid = claimedBidder
          ? await fetchAndValidateTx(sig.signature, claimedBidder, HELIUS)
          : false;
        return { signature: sig.signature, valid };
      })
    );
    const validBidSigs = new Set(bidValidations.filter(r => r.valid).map(r => r.signature));

    const bids: any[] = [];
    for (const sig of allSigs) {
      const data = parseMemo(sig.memo);
      if (!data) continue;
      if (data.programId !== PROGRAM_ID) continue;
      if (data.action !== "SEALED_BID") continue;

      const ts = (sig.blockTime ?? 0) * 1000;
      if (createdAt && endsAt && (ts < createdAt || ts > endsAt)) continue;
      if (auctionId && data.auctionId !== auctionId) continue;

      if (!validBidSigs.has(sig.signature)) continue;

      // Merge ciphertext from companion tx
      const cipher = cipherMap.get(data.commitment);

      bids.push({
        auctionId:         data.auctionId,
        bidder:            data.bidder ?? "unknown",
        commitment:        data.commitment,
        ciphertext:        cipher?.ciphertext ?? null,
        nonce:             cipher?.nonce ?? null,
        clientPublicKey:   data.clientPublicKey,
        mxePublicKey:      cipher?.mxePublicKey ?? data.mxePublicKey ?? null,
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
