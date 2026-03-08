import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

export const DEVNET_CONNECTION = new Connection(
  "https://api.devnet.solana.com",
  "confirmed"
);

export const TREASURY_PUBKEY = new PublicKey(
  "5nTn8mgEEViXYna6fmTpfV1EuwdQD7kNcJ7SPevuea7f"
);

export const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

export const BLINDBID_PROGRAM_ID = new PublicKey(
  "EaDV1kv2CAbGVD42mhD5okEfBAABz4n38yCAY7YiaqYE"
);

export const BLINDBID_MXE_ACCOUNT = new PublicKey(
  "32X9V2EjQQ4E9GtvFR3UQXd1GyLziPK9S8NuvQNYb5ML"
);

export const ARCIUM_CLUSTER_OFFSET = 456;
export const AUCTION_CREATION_FEE = 0.01 * LAMPORTS_PER_SOL;

export interface ArciumEncryptedBid {
  clientPublicKey:    string;
  mxePublicKey:       string;
  ciphertext:         string;
  nonce:              string;
  commitment:         string;
  computationOffset:  string;
  timestamp:          number;
  arciumEnv:          string;
  cipher:             string;
  mxeAccount?:        string;
  programId?:         string;
}

export async function arciumEncryptBid(amountSol: number): Promise<ArciumEncryptedBid> {
  const response = await fetch("/api/arcium/encrypt", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ amountSol }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Arcium encryption failed");
  }
  return response.json() as Promise<ArciumEncryptedBid>;
}

export async function submitBidToSolana(
  walletPublicKey: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  auctionId: string,
  encryptedBid: ArciumEncryptedBid,
  amountSol: number
): Promise<string> {
  const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);
  const memoData = JSON.stringify({
    protocol:          "BLINDBID_V1_ARCIUM",
    action:            "SEALED_BID",
    auctionId,
    programId:         BLINDBID_PROGRAM_ID.toString(),
    mxeAccount:        BLINDBID_MXE_ACCOUNT.toString(),
    clusterOffset:     ARCIUM_CLUSTER_OFFSET,
    commitment:        encryptedBid.commitment,
    clientPublicKey:   encryptedBid.clientPublicKey.slice(0, 32),
    mxePublicKey:      encryptedBid.mxePublicKey.slice(0, 32),
    computationOffset: encryptedBid.computationOffset,
    cipher:            encryptedBid.cipher,
    arciumEnv:         encryptedBid.arciumEnv,
    timestamp:         encryptedBid.timestamp,
  });

  const { blockhash, lastValidBlockHeight } =
    await DEVNET_CONNECTION.getLatestBlockhash();

  const transaction = new Transaction({
    recentBlockhash: blockhash,
    feePayer: walletPublicKey,
  });

  transaction.add(
    SystemProgram.transfer({
      fromPubkey: walletPublicKey,
      toPubkey:   TREASURY_PUBKEY,
      lamports,
    })
  );

  transaction.add({
    keys:      [{ pubkey: walletPublicKey, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data:      Buffer.from(memoData, "utf-8"),
  });

  const signed    = await signTransaction(transaction);
  const signature = await DEVNET_CONNECTION.sendRawTransaction(signed.serialize());
  await DEVNET_CONNECTION.confirmTransaction({ signature, blockhash, lastValidBlockHeight });
  return signature;
}

export async function submitAuctionCreation(
  walletPublicKey: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  auctionData: { name: string; type: string; floor: string; durationHours: number }
): Promise<string> {
  const memoData = JSON.stringify({
    protocol:   "BLINDBID_V1_ARCIUM",
    action:     "CREATE_AUCTION",
    programId:  BLINDBID_PROGRAM_ID.toString(),
    mxeAccount: BLINDBID_MXE_ACCOUNT.toString(),
    name:       auctionData.name,
    type:       auctionData.type,
    floor:      auctionData.floor,
    duration:   auctionData.durationHours,
    timestamp:  Date.now(),
  });

  const { blockhash, lastValidBlockHeight } =
    await DEVNET_CONNECTION.getLatestBlockhash();

  const transaction = new Transaction({
    recentBlockhash: blockhash,
    feePayer: walletPublicKey,
  });

  transaction.add(
    SystemProgram.transfer({
      fromPubkey: walletPublicKey,
      toPubkey:   TREASURY_PUBKEY,
      lamports:   AUCTION_CREATION_FEE,
    })
  );

  transaction.add({
    keys:      [{ pubkey: walletPublicKey, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data:      Buffer.from(memoData, "utf-8"),
  });

  const signed    = await signTransaction(transaction);
  const signature = await DEVNET_CONNECTION.sendRawTransaction(signed.serialize());
  await DEVNET_CONNECTION.confirmTransaction({ signature, blockhash, lastValidBlockHeight });
  return signature;
}

export async function resolveAuction(
  walletPublicKey: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  auctionId: string,
  bidA: { commitment: string; computationOffset: string; bidder: string },
  bidB: { commitment: string; computationOffset: string; bidder: string },
): Promise<string> {
  const memoData = JSON.stringify({
    protocol:        "BLINDBID_V1_ARCIUM",
    action:          "REVEAL_WINNER",
    auctionId,
    programId:       BLINDBID_PROGRAM_ID.toString(),
    mxeAccount:      BLINDBID_MXE_ACCOUNT.toString(),
    clusterOffset:   ARCIUM_CLUSTER_OFFSET,
    bidA_commitment: bidA.commitment,
    bidA_offset:     bidA.computationOffset,
    bidA_bidder:     bidA.bidder,
    bidB_commitment: bidB.commitment,
    bidB_offset:     bidB.computationOffset,
    bidB_bidder:     bidB.bidder,
    timestamp:       Date.now(),
  });

  const { blockhash, lastValidBlockHeight } =
    await DEVNET_CONNECTION.getLatestBlockhash();

  const transaction = new Transaction({
    recentBlockhash: blockhash,
    feePayer: walletPublicKey,
  });

  transaction.add({
    keys:      [{ pubkey: walletPublicKey, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data:      Buffer.from(memoData, "utf-8"),
  });

  const signed    = await signTransaction(transaction);
  const signature = await DEVNET_CONNECTION.sendRawTransaction(signed.serialize());
  await DEVNET_CONNECTION.confirmTransaction({ signature, blockhash, lastValidBlockHeight });
  return signature;
}

export async function getSolBalance(publicKey: PublicKey): Promise<number> {
  const balance = await DEVNET_CONNECTION.getBalance(publicKey);
  return balance / LAMPORTS_PER_SOL;
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
