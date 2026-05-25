import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import idl from "./blindbid_escrow_idl.json";
import mxeIdl from "./blindbid_mxe_idl.json";

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
  "87ze8FFkYPnUaXUQZwoC2K14p6ju8YYCaAG7nGB8HLUh"
);

export const BLINDBID_MXE_ACCOUNT = new PublicKey(
  "4xRjKx6paGdVp3zcignmS5JZzsAEQEW7ifuyUty4mk4n"
);

export const ESCROW_PROGRAM_ID = new PublicKey(
  "BJ14eCU13T4xvChYxSNWt6HNCgqTz777JZ4uqLtFsmMb"
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

function getEscrowPDA(auctionId: string, bidder: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("escrow"),
      Buffer.from(auctionId),
      bidder.toBuffer(),
    ],
    ESCROW_PROGRAM_ID
  );
}

function makeProvider(
  walletPublicKey: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>
): AnchorProvider {
  const wallet = {
    publicKey: walletPublicKey,
    signTransaction,
    signAllTransactions: async (txs: Transaction[]) =>
      Promise.all(txs.map(signTransaction)),
  } as unknown as Wallet;

  return new AnchorProvider(DEVNET_CONNECTION, wallet, {
    commitment: "confirmed",
  });
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
  const lamports          = Math.round(amountSol * LAMPORTS_PER_SOL);
  const PROTOCOL_FEE_LAMPORTS = 10_000; // fixed fee — hides real bid amount on-chain

  // 1. Arcium memo transaction (existing flow)
  const memoData = JSON.stringify({
    protocol:          "BLINDBID_V1_ARCIUM",
    action:            "SEALED_BID",
    auctionId,
    bidder:            walletPublicKey.toString(),
    programId:         BLINDBID_PROGRAM_ID.toString(),
    mxeAccount:        BLINDBID_MXE_ACCOUNT.toString(),
    clusterOffset:     ARCIUM_CLUSTER_OFFSET,
    commitment:        encryptedBid.commitment,
    clientPublicKey:   encryptedBid.clientPublicKey,
    computationOffset: encryptedBid.computationOffset,
    cipher:            encryptedBid.cipher,
    arciumEnv:         encryptedBid.arciumEnv,
    timestamp:         encryptedBid.timestamp,
  });

  const { blockhash, lastValidBlockHeight } =
    await DEVNET_CONNECTION.getLatestBlockhash();

  const memoTx = new Transaction({
    recentBlockhash: blockhash,
    feePayer: walletPublicKey,
  });

  memoTx.add(
    SystemProgram.transfer({
      fromPubkey: walletPublicKey,
      toPubkey:   TREASURY_PUBKEY,
      lamports: PROTOCOL_FEE_LAMPORTS,
    })
  );

  // Add 1 lamport transfer to TREASURY so this tx appears in TREASURY history
  // (used by /api/chain/auctions to index REVEAL_WINNER memos)
  memoTx.add(
    SystemProgram.transfer({
      fromPubkey: walletPublicKey,
      toPubkey:   TREASURY_PUBKEY,
      lamports:   1,
    })
  );
  memoTx.add({
    keys:      [{ pubkey: walletPublicKey, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data:      Buffer.from(memoData, "utf-8"),
  });

  const signedMemo = await signTransaction(memoTx);
  const memoSig    = await DEVNET_CONNECTION.sendRawTransaction(signedMemo.serialize());
  await DEVNET_CONNECTION.confirmTransaction({ signature: memoSig, blockhash, lastValidBlockHeight });

  // 1b. Send ciphertext in a separate memo tx (too large for main tx)
  try {
    const cipherMemoData = JSON.stringify({
      protocol:        "BLINDBID_V1_ARCIUM",
      action:          "SEALED_BID_CIPHER",
      auctionId,
      bidder:          walletPublicKey.toString(),
      commitment:      encryptedBid.commitment,
      ciphertext:      encryptedBid.ciphertext,
      nonce:           encryptedBid.nonce,
      mxePublicKey:    encryptedBid.mxePublicKey,
    });
    const { blockhash: bh2, lastValidBlockHeight: lbh2 } =
      await DEVNET_CONNECTION.getLatestBlockhash();
    const cipherTx = new Transaction({ recentBlockhash: bh2, feePayer: walletPublicKey });
    cipherTx.add({
      keys:      [{ pubkey: walletPublicKey, isSigner: true, isWritable: false }],
      programId: MEMO_PROGRAM_ID,
      data:      Buffer.from(cipherMemoData, "utf-8"),
    });
    const signedCipher = await signTransaction(cipherTx);
    const cipherSig    = await DEVNET_CONNECTION.sendRawTransaction(signedCipher.serialize());
    await DEVNET_CONNECTION.confirmTransaction({ signature: cipherSig, blockhash: bh2, lastValidBlockHeight: lbh2 });
  } catch (e) {
    console.warn("Ciphertext memo tx failed (non-fatal):", e);
  }

  // 2. Escrow place_bid — mandatory, throws on failure so caller sees the error
  const provider = makeProvider(walletPublicKey, signTransaction);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program  = new Program(idl as any, provider);
  const [escrowPDA] = getEscrowPDA(auctionId, walletPublicKey);

  await program.methods
    .placeBid(auctionId, new (await import("@coral-xyz/anchor")).BN(lamports))
    .accounts({
      escrow:        escrowPDA,
      bidder:        walletPublicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return memoSig;
}

export async function submitAuctionCreation(
  walletPublicKey: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  auctionData: { name: string; type: string; floor: string; durationHours: number; imageUrl?: string }
): Promise<string> {
  const memoData = JSON.stringify({
    protocol:   "BLINDBID_V1_ARCIUM",
    action:     "CREATE_AUCTION",
    creator:    walletPublicKey.toString(),
    auctionId:  "AUC-TS-" + Date.now(),
    programId:  BLINDBID_PROGRAM_ID.toString(),
    mxeAccount: BLINDBID_MXE_ACCOUNT.toString(),
    name:       auctionData.name,
    type:       auctionData.type,
    floor:      auctionData.floor,
    duration:   auctionData.durationHours,
    imageUrl:   auctionData.imageUrl ?? "",
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
  winner?: string,
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
    winner:          winner ?? "",
    timestamp:       Date.now(),
  });

  const { blockhash, lastValidBlockHeight } =
    await DEVNET_CONNECTION.getLatestBlockhash();

  const memoTx = new Transaction({
    recentBlockhash: blockhash,
    feePayer: walletPublicKey,
  });

  // Add 1 lamport transfer to TREASURY so this tx appears in TREASURY history
  // (used by /api/chain/auctions to index REVEAL_WINNER memos)
  memoTx.add(
    SystemProgram.transfer({
      fromPubkey: walletPublicKey,
      toPubkey:   TREASURY_PUBKEY,
      lamports:   1,
    })
  );
  memoTx.add({
    keys:      [{ pubkey: walletPublicKey, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data:      Buffer.from(memoData, "utf-8"),
  });

  const signedMemo = await signTransaction(memoTx);
  const memoSig    = await DEVNET_CONNECTION.sendRawTransaction(signedMemo.serialize());
  await DEVNET_CONNECTION.confirmTransaction({ signature: memoSig, blockhash, lastValidBlockHeight });

  return memoSig;
}

export async function refundEscrowLosers(
  walletPublicKey: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  auctionId: string,
  winnerAddress: string,
  allBidders: string[],
): Promise<void> {
  const provider = makeProvider(walletPublicKey, signTransaction);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program  = new Program(idl as any, provider);
  const winner   = new PublicKey(winnerAddress);

  for (const bidderStr of allBidders) {
    const bidder = new PublicKey(bidderStr);
    const [escrowPDA] = getEscrowPDA(auctionId, bidder);

    try {
      await program.methods
        .revealWinner(auctionId, winner)
        .accounts({
          escrow:        escrowPDA,
          creator:       walletPublicKey,
          bidderAccount: bidder,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log(`Processed escrow for bidder ${bidderStr}`);
    } catch (e) {
      console.warn(`Escrow reveal failed for ${bidderStr}:`, e);
    }
  }
}

export async function getSolBalance(publicKey: PublicKey): Promise<number> {
  const balance = await DEVNET_CONNECTION.getBalance(publicKey);
  return balance / LAMPORTS_PER_SOL;
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export async function callArciumRevealWinner(
  walletPublicKey: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  bidA: {
    ciphertext: string[];
    clientPublicKey: string;
    nonce: string;
    computationOffset: string;
  },
  bidB: {
    ciphertext: string[];
    clientPublicKey: string;
    nonce: string;
    computationOffset: string;
  },
): Promise<{ sig: string; computationOffset: string }> {
  // Build the transaction server-side (Arcium SDK uses Node.js fs),
  // then sign and send client-side with the user wallet.
  const res = await fetch("/api/arcium/reveal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bidA, bidB, walletPublicKey: walletPublicKey.toString() }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Reveal API failed");
  }
  const { txBase64, computationOffset } = await res.json();

  // Deserialize, sign, and send
  const { Transaction, sendAndConfirmRawTransaction } = await import("@solana/web3.js");
  const txBytes = Buffer.from(txBase64, "base64");
  const tx = Transaction.from(txBytes);
  const signed = await signTransaction(tx);
  const rawTx = signed.serialize();
  const sig = await DEVNET_CONNECTION.sendRawTransaction(rawTx, { skipPreflight: false });
  await DEVNET_CONNECTION.confirmTransaction(sig, "confirmed");

  return { sig, computationOffset };
}

export async function pollForArciumWinner(
  computationOffset: string,
  timeoutMs = 90000,
): Promise<string | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, 4000));
    try {
      const res = await fetch(
        `/api/arcium/reveal?computationOffset=${encodeURIComponent(computationOffset)}&mxeProgramId=${BLINDBID_PROGRAM_ID.toBase58()}`
      );
      const data = await res.json();
      if (data.winnerIndex === "0" || data.winnerIndex === "1") {
        return data.winnerIndex;
      }
    } catch {}
  }
  return null;
}
