// Browser-safe utilities — no Node.js dependencies
export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const DEVNET = new Connection("https://api.devnet.solana.com", "confirmed");

export async function getSolBalance(publicKey: PublicKey): Promise<number> {
  const lamports = await DEVNET.getBalance(publicKey);
  return lamports / LAMPORTS_PER_SOL;
}
