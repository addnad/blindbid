import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const TREASURY = new PublicKey("5nTn8mgEEViXYna6fmTpfV1EuwdQD7kNcJ7SPevuea7f");
const PROGRAM_ID = "EaDV1kv2CAbGVD42mhD5okEfBAABz4n38yCAY7YiaqYE";

export async function GET(req: NextRequest) {
  const auctionId = req.nextUrl.searchParams.get("auctionId");
  try {
    const sigs = await connection.getSignaturesForAddress(TREASURY, { limit: 100 });
    const txs = await connection.getParsedTransactions(
      sigs.map((s) => s.signature),
      { maxSupportedTransactionVersion: 0, commitment: "confirmed" }
    );

    const bids: any[] = [];
    for (let i = 0; i < txs.length; i++) {
      const tx = txs[i];
      if (!tx) continue;
      const memo = tx.transaction.message.instructions.find(
        (ix: any) => ix.program === "spl-memo" || ix.programId?.toString() === "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
      ) as any;
      if (!memo?.parsed) continue;
      let data: any;
      try { data = JSON.parse(memo.parsed); } catch { continue; }
      if (data.programId !== PROGRAM_ID) continue;
      if (data.action !== "SEALED_BID") continue;
      if (auctionId && data.auctionId !== auctionId) continue;

      const signer = (tx.transaction.message.accountKeys[0] as any)?.pubkey?.toString();
      bids.push({
        auctionId: data.auctionId,
        bidder: signer,
        commitment: data.commitment,
        computationOffset: data.computationOffset,
        mxePublicKey: data.mxePublicKey,
        timestamp: (tx.blockTime ?? 0) * 1000,
        txSignature: sigs[i]?.signature,
      });
    }
    return NextResponse.json({ bids });
  } catch (e) {
    return NextResponse.json({ bids: [], error: String(e) });
  }
}
