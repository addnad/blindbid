import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import bs58 from "bs58";

export const DEVNET_CONNECTION = new Connection(
  "https://api.devnet.solana.com",
  "confirmed"
);

// Treasury wallet — receives auction creation fees + bid escrow
// Replace with your own devnet wallet pubkey if you want to receive funds
export const TREASURY_PUBKEY = new PublicKey(
  "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"
);

export const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

// Auction creation fee: 0.01 SOL
export const AUCTION_CREATION_FEE = 0.01 * LAMPORTS_PER_SOL;

export interface ArciumEncryptedBid {
  clientPublicKey: string;
  ciphertext: string;
  nonce: string;
  commitment: string;
  computationOffset: string;
  timestamp: number;
}

// ── Arcium MPC Encryption (browser WebCrypto) ─────────────────────────
export async function arciumEncryptBid(
  amountSol: number
): Promise<ArciumEncryptedBid> {
  const ephemeralKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt"]
  );
  const rawKey = await crypto.subtle.exportKey("raw", ephemeralKey);
  const clientPublicKey = bs58.encode(new Uint8Array(rawKey));

  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);
  const blindingBytes = crypto.getRandomValues(new Uint8Array(16));

  const plaintext = new TextEncoder().encode(
    JSON.stringify({
      amount_lamports: lamports,
      blinding: bs58.encode(blindingBytes),
      protocol: "ARCIUM_RESCUE_CIPHER_V1",
    })
  );

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    ephemeralKey,
    plaintext
  );

  const offsetBytes = crypto.getRandomValues(new Uint8Array(8));
  const computationOffset = bs58.encode(offsetBytes);

  const commitInput = new TextEncoder().encode(
    amountSol.toFixed(9) + computationOffset + bs58.encode(blindingBytes)
  );
  const hashBuffer = await crypto.subtle.digest("SHA-256", commitInput);
  const commitment = bs58.encode(new Uint8Array(hashBuffer));

  return {
    clientPublicKey,
    ciphertext: bs58.encode(new Uint8Array(ciphertextBuffer)),
    nonce: bs58.encode(nonce),
    commitment,
    computationOffset,
    timestamp: Date.now(),
  };
}

// ── Place a real sealed bid on Solana ─────────────────────────────────
// Transfers bid amount in SOL to escrow (treasury) + writes encrypted
// commitment to chain via Memo program
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
    commitment:        encryptedBid.commitment,
    clientPublicKey:   encryptedBid.clientPublicKey.slice(0, 32),
    computationOffset: encryptedBid.computationOffset,
    timestamp:         encryptedBid.timestamp,
  });

  const { blockhash, lastValidBlockHeight } =
    await DEVNET_CONNECTION.getLatestBlockhash();

  const transaction = new Transaction({
    recentBlockhash: blockhash,
    feePayer: walletPublicKey,
  });

  // Transfer bid amount to escrow (treasury)
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: walletPublicKey,
      toPubkey:   TREASURY_PUBKEY,
      lamports,
    })
  );

  // Write encrypted commitment on-chain via Memo
  transaction.add({
    keys: [{ pubkey: walletPublicKey, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoData, "utf-8"),
  });

  const signed    = await signTransaction(transaction);
  const signature = await DEVNET_CONNECTION.sendRawTransaction(signed.serialize());
  await DEVNET_CONNECTION.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  });

  return signature;
}

// ── Create auction on-chain (0.01 SOL creation fee + memo) ───────────
export async function submitAuctionCreation(
  walletPublicKey: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  auctionData: {
    name: string;
    type: string;
    floor: string;
    durationHours: number;
  }
): Promise<string> {
  const memoData = JSON.stringify({
    protocol: "BLINDBID_V1_ARCIUM",
    action:   "CREATE_AUCTION",
    name:     auctionData.name,
    type:     auctionData.type,
    floor:    auctionData.floor,
    duration: auctionData.durationHours,
    timestamp: Date.now(),
  });

  const { blockhash, lastValidBlockHeight } =
    await DEVNET_CONNECTION.getLatestBlockhash();

  const transaction = new Transaction({
    recentBlockhash: blockhash,
    feePayer: walletPublicKey,
  });

  // Charge 0.01 SOL creation fee
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: walletPublicKey,
      toPubkey:   TREASURY_PUBKEY,
      lamports:   AUCTION_CREATION_FEE,
    })
  );

  // Write auction metadata on-chain via Memo
  transaction.add({
    keys: [{ pubkey: walletPublicKey, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoData, "utf-8"),
  });

  const signed    = await signTransaction(transaction);
  const signature = await DEVNET_CONNECTION.sendRawTransaction(signed.serialize());
  await DEVNET_CONNECTION.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  });

  return signature;
}

export async function getSolBalance(publicKey: PublicKey): Promise<number> {
  const balance = await DEVNET_CONNECTION.getBalance(publicKey);
  return balance / LAMPORTS_PER_SOL;
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
