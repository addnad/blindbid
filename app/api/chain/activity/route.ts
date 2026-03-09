import { NextResponse } from "next/server";

const HELIUS    = "https://devnet.helius-rpc.com/?api-key=3a7216a5-da98-408f-a35b-d397332205ac";
const TREASURY  = "5nTn8mgEEViXYna6fmTpfV1EuwdQD7kNcJ7SPevuea7f";
const PROGRAM_ID = "EaDV1kv2CAbGVD42mhD5okEfBAABz4n38yCAY7YiaqYE";

function parseMemo(memo: string | null): any {
  if (!memo) return null;
  try { return JSON.parse(memo.replace(/^\[\d+\]\s*/, "")); }
  catch { return null; }
}

function shortWallet(addr: string): string {
  if (!addr || addr === "unknown") return "anon";
  return addr.slice(0, 4) + "..." + addr.slice(-4);
}

function getTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return mins + "m ago";
  if (hours < 24) return hours + "h ago";
  return days + "d ago";
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

    const activity: any[] = [];
    const bidders:  Record<string, number> = {};
    const creators: Record<string, number> = {};
    const winners:  Record<string, number> = {};

    for (const sig of sigs) {
      const data = parseMemo(sig.memo);
      if (!data || data.programId !== PROGRAM_ID) continue;
      const blockTime = (sig.blockTime ?? 0) * 1000;
      const timeAgo   = getTimeAgo(blockTime);

      if (data.action === "CREATE_AUCTION") {
        activity.push({ type: "CREATE", label: shortWallet(data.creator ?? "anon") + " created an auction", detail: data.name ?? "Unnamed Auction", time: timeAgo, ts: blockTime, color: "#9945FF" });
        if (data.creator) creators[data.creator] = (creators[data.creator] ?? 0) + 1;
      }
      if (data.action === "SEALED_BID") {
        activity.push({ type: "BID", label: "anon placed a sealed bid", detail: data.auctionId ?? "", time: timeAgo, ts: blockTime, color: "#4ADE80" });
        if (data.bidder) bidders[data.bidder] = (bidders[data.bidder] ?? 0) + 1;
      }
      if (data.action === "REVEAL_WINNER") {
        activity.push({ type: "REVEAL", label: "Winner revealed", detail: data.auctionId ?? "", time: timeAgo, ts: blockTime, color: "#FACC15" });
        if (data.winner) winners[data.winner] = (winners[data.winner] ?? 0) + 1;
      }
    }

    activity.sort((a, b) => b.ts - a.ts);

    const topBidders  = Object.entries(bidders).sort((a,b) => b[1]-a[1]).slice(0,5).map(([w,c]) => ({ wallet: shortWallet(w), full: w, count: c, label: "BIDS" }));
    const topCreators = Object.entries(creators).sort((a,b) => b[1]-a[1]).slice(0,5).map(([w,c]) => ({ wallet: shortWallet(w), full: w, count: c, label: "AUCTIONS" }));
    const topWinners  = Object.entries(winners).sort((a,b) => b[1]-a[1]).slice(0,5).map(([w,c]) => ({ wallet: shortWallet(w), full: w, count: c, label: "WINS" }));

    return NextResponse.json({ activity: activity.slice(0, 7), leaderboard: { topBidders, topCreators, topWinners } });
  } catch (e) {
    return NextResponse.json({ activity: [], leaderboard: { topBidders: [], topCreators: [], topWinners: [] }, error: String(e) });
  }
}
