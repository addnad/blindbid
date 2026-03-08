"use client";

export interface Auction {
  id: string;
  name: string;
  description: string;
  bids: number;
  floor: string;
  closes: string;
  status: "LIVE" | "PENDING" | "CLOSED";
  statusColor: string;
  type: "VICKREY" | "UNIFORM" | "FIRST-PRICE";
  accent: string;
  creator: string;
  createdAt: number;
  endsAt: number;
  txSignature?: string;
}

export interface PlacedBid {
  auctionId: string;
  auctionName: string;
  bidder: string;
  amountSol: number;
  commitment: string;
  txSignature: string;
  timestamp: number;
  status: "SEALED" | "REVEALED" | "WON" | "LOST";
}

const ACCENTS = ["#9945FF", "#4ADE80", "#60A5FA", "#A78BFA", "#FF6B35", "#FACC15"];

const DEFAULT_AUCTIONS: Auction[] = [];// removed
const _UNUSED: Auction[] = [
  {
    id: "AUC-001", name: "SOLANA NFT DROP #44",
    description: "Exclusive generative art collection. 1-of-1 mint. Sealed bids only.",
    bids: 12, floor: "2.5 SOL", closes: "7D",
    status: "LIVE", statusColor: "#4ADE80", type: "VICKREY",
    accent: "#9945FF", creator: "sys", createdAt: Date.now() - 3600000, endsAt: Date.now() + 7 * 86400000,
  },
  {
    id: "AUC-002", name: "TOKEN PRESALE ROUND 3",
    description: "Early access token allocation. Uniform price auction. KYC not required.",
    bids: 8, floor: "10 SOL", closes: "5D",
    status: "LIVE", statusColor: "#4ADE80", type: "UNIFORM",
    accent: "#4ADE80", creator: "sys", createdAt: Date.now() - 7200000, endsAt: Date.now() + 5 * 86400000,
  },
  {
    id: "AUC-003", name: "DAO TREASURY BOND",
    description: "Fixed-yield DAO bond issuance. Sealed first-price auction format.",
    bids: 5, floor: "50 SOL", closes: "7D",
    status: "LIVE", statusColor: "#4ADE80", type: "FIRST-PRICE",
    accent: "#A78BFA", creator: "sys", createdAt: Date.now() - 1800000, endsAt: Date.now() + 7 * 86400000,
  },
  {
    id: "AUC-004", name: "RARE DIGITAL ASSET #7",
    description: "Historic on-chain artifact from Solana genesis block era.",
    bids: 21, floor: "5 SOL", closes: "5D",
    status: "LIVE", statusColor: "#4ADE80", type: "VICKREY",
    accent: "#60A5FA", creator: "sys", createdAt: Date.now() - 86400000, endsAt: Date.now() + 5 * 86400000,
  },
  {
    id: "AUC-005", name: "DEFI PROTOCOL GOVERNANCE NFT",
    description: "Lifetime governance rights for a top-10 DeFi protocol. One winner takes all.",
    bids: 34, floor: "25 SOL", closes: "7D",
    status: "LIVE", statusColor: "#4ADE80", type: "VICKREY",
    accent: "#FF6B35", creator: "sys", createdAt: Date.now() - 5400000, endsAt: Date.now() + 7 * 86400000,
  },
  {
    id: "AUC-006", name: "GENESIS VALIDATOR SEAT",
    description: "Rare validator seat from Solana mainnet genesis epoch. Only 3 ever auctioned.",
    bids: 7, floor: "100 SOL", closes: "5D",
    status: "LIVE", statusColor: "#4ADE80", type: "FIRST-PRICE",
    accent: "#FACC15", creator: "sys", createdAt: Date.now() - 10800000, endsAt: Date.now() + 5 * 86400000,
  },
  {
    id: "AUC-007", name: "AI AGENT ACCESS PASS #001",
    description: "Exclusive access pass for autonomous AI agent network built on Solana.",
    bids: 3, floor: "1 SOL", closes: "7D",
    status: "LIVE", statusColor: "#4ADE80", type: "UNIFORM",
    accent: "#A78BFA", creator: "sys", createdAt: Date.now() - 900000, endsAt: Date.now() + 7 * 86400000,
  },
  {
    id: "AUC-008", name: "COMPRESSED NFT BUNDLE #12",
    description: "Bundle of 1000 compressed NFTs. Winner distributes or holds entire collection.",
    bids: 15, floor: "3 SOL", closes: "5D",
    status: "LIVE", statusColor: "#4ADE80", type: "VICKREY",
    accent: "#60A5FA", creator: "sys", createdAt: Date.now() - 172800000, endsAt: Date.now() + 5 * 86400000,
  },
  {
    id: "AUC-009", name: "SOLANA HACKATHON WINNER NFT",
    description: "Commemorative NFT from Solana Breakpoint 2024 hackathon winner. Ultra rare.",
    bids: 9, floor: "8 SOL", closes: "7D",
    status: "LIVE", statusColor: "#4ADE80", type: "VICKREY",
    accent: "#9945FF", creator: "sys", createdAt: Date.now() - 43200000, endsAt: Date.now() + 7 * 86400000,
  },
  {
    id: "AUC-010", name: "ARCIUM MPC NODE LICENSE",
    description: "Early node operator license for Arcium MPC network. Earn fees from encrypted computations.",
    bids: 18, floor: "30 SOL", closes: "5D",
    status: "LIVE", statusColor: "#4ADE80", type: "FIRST-PRICE",
    accent: "#4ADE80", creator: "sys", createdAt: Date.now() - 21600000, endsAt: Date.now() + 5 * 86400000,
  },
  {
    id: "AUC-011", name: "METAVERSE LAND PARCEL #88",
    description: "Prime virtual real estate in a top Solana metaverse. Corner plot, high foot traffic.",
    bids: 6, floor: "15 SOL", closes: "7D",
    status: "LIVE", statusColor: "#4ADE80", type: "UNIFORM",
    accent: "#FF6B35", creator: "sys", createdAt: Date.now() - 14400000, endsAt: Date.now() + 7 * 86400000,
  },
  {
    id: "AUC-012", name: "DEPIN HARDWARE NODE SLOT",
    description: "Physical hardware node slot in a decentralized infrastructure network on Solana.",
    bids: 11, floor: "20 SOL", closes: "5D",
    status: "LIVE", statusColor: "#4ADE80", type: "VICKREY",
    accent: "#A78BFA", creator: "sys", createdAt: Date.now() - 32400000, endsAt: Date.now() + 5 * 86400000,
  },
  {
    id: "AUC-013", name: "SOLANA MOBILE CHAPTER 2 SLOT",
    description: "Reserved slot for Solana Mobile Chapter 2 device. Limited allocation, sealed bid only.",
    bids: 44, floor: "0.5 SOL", closes: "3D",
    status: "LIVE", statusColor: "#4ADE80", type: "UNIFORM",
    accent: "#60A5FA", creator: "sys", createdAt: Date.now() - 7200000, endsAt: Date.now() + 3 * 86400000,
  },
  {
    id: "AUC-014", name: "JUPITER AIRDROP ALLOCATION",
    description: "Verified JUP airdrop allocation from OG wallet. Transferable. Sealed first-price.",
    bids: 27, floor: "5 SOL", closes: "3D",
    status: "LIVE", statusColor: "#4ADE80", type: "FIRST-PRICE",
    accent: "#FACC15", creator: "sys", createdAt: Date.now() - 3600000, endsAt: Date.now() + 3 * 86400000,
  },
  {
    id: "AUC-015", name: "TENSOR WHITELIST SPOT",
    description: "Guaranteed whitelist spot for upcoming Tensor protocol NFT launch.",
    bids: 19, floor: "2 SOL", closes: "3D",
    status: "LIVE", statusColor: "#4ADE80", type: "VICKREY",
    accent: "#9945FF", creator: "sys", createdAt: Date.now() - 1800000, endsAt: Date.now() + 3 * 86400000,
  },
];

const AUCTIONS_KEY = "blindbid_auctions";
const BIDS_KEY     = "blindbid_bids";
const COUNTER_KEY  = "blindbid_counter";

function loadAuctions(): Auction[] {
  if (typeof window === "undefined") return [...DEFAULT_AUCTIONS];
  try {
    const raw = localStorage.getItem(AUCTIONS_KEY);
    if (!raw) return [...DEFAULT_AUCTIONS];
    const saved: Auction[] = JSON.parse(raw);
    // Merge: user-created first, then defaults not already present
    const savedIds = new Set(saved.map((a) => a.id));
    const defaults = DEFAULT_AUCTIONS.filter((a) => !savedIds.has(a.id));
    return [...saved, ...defaults];
  } catch { return [...DEFAULT_AUCTIONS]; }
}

function saveAuctions(auctions: Auction[]) {
  if (typeof window === "undefined") return;
  // Only persist user-created auctions (not defaults)
  const userCreated = auctions.filter((a) => a.creator !== "sys");
  try { localStorage.setItem(AUCTIONS_KEY, JSON.stringify(userCreated)); } catch {}
}

function loadBids(): PlacedBid[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BIDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveBids(bids: PlacedBid[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(BIDS_KEY, JSON.stringify(bids)); } catch {}
}

function loadCounter(): number {
  if (typeof window === "undefined") return DEFAULT_AUCTIONS.length;
  try {
    const raw = localStorage.getItem(COUNTER_KEY);
    return raw ? parseInt(raw) : DEFAULT_AUCTIONS.length;
  } catch { return DEFAULT_AUCTIONS.length; }
}

function saveCounter(n: number) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(COUNTER_KEY, String(n)); } catch {}
}

export function getAuctions(): Auction[] {
  return loadAuctions();
}

export function getAuctionsByCreator(wallet: string): Auction[] {
  return loadAuctions().filter((a) => a.creator === wallet);
}

export function getBidsByWallet(wallet: string): PlacedBid[] {
  return loadBids().filter((b) => b.bidder === wallet);
}

export function addAuction(
  creator: string,
  data: {
    name: string;
    description: string;
    floor: string;
    type: Auction["type"];
    durationHours: number;
    txSignature?: string;
  }
): Auction {
  let counter = loadCounter() + 1;
  saveCounter(counter);

  const id      = `AUC-${String(counter).padStart(3, "0")}`;
  const endsAt  = Date.now() + data.durationHours * 3600000;
  const hours   = Math.floor(data.durationHours);
  const minutes = Math.floor((data.durationHours - hours) * 60);
  const closes  = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
  const accent  = ACCENTS[counter % ACCENTS.length];

  const auction: Auction = {
    id, name: data.name.toUpperCase(), description: data.description,
    bids: 0, floor: data.floor, closes, status: "LIVE", statusColor: "#4ADE80",
    type: data.type, accent, creator, createdAt: Date.now(), endsAt,
    txSignature: data.txSignature,
  };

  const existing = loadAuctions().filter((a) => a.creator !== "sys");
  saveAuctions([auction, ...existing]);
  return auction;
}

export function addBid(bid: PlacedBid): void {
  const bids = [bid, ...loadBids()];
  saveBids(bids);

  // Update bid count for user-created auctions
  const userAuctions = loadAuctions().filter((a) => a.creator !== "sys");
  const updated = userAuctions.map((a) =>
    a.id === bid.auctionId ? { ...a, bids: a.bids + 1 } : a
  );
  saveAuctions(updated);
}
