"use server";
import { NextRequest, NextResponse } from "next/server";
import {
  getComputationAccAddress,
  getCompDefAccAddress,
  getCompDefAccOffset,
  getClusterAccAddress,
  getArciumProgramId,
  getMempoolAccAddress,
  getExecutingPoolAccAddress,
} from "@arcium-hq/client";
import { Program, AnchorProvider, BN, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import mxeIdl from "@/lib/blindbid_mxe_idl.json";
import bs58 from "bs58";

const BLINDBID_PROGRAM_ID   = new PublicKey("87ze8FFkYPnUaXUQZwoC2K14p6ju8YYCaAG7nGB8HLUh");
const BLINDBID_MXE_ACCOUNT  = new PublicKey("4xRjKx6paGdVp3zcignmS5JZzsAEQEW7ifuyUty4mk4n");
const ARCIUM_CLUSTER_OFFSET = 456;


export async function POST(req: NextRequest) {
  try {
    const connection = new Connection(process.env.HELIUS_RPC_URL!, "confirmed");

    const { bidA, bidB, walletPublicKey: walletPkStr, signedTxBase64 } = await req.json();

    // We can't sign server-side with user wallet, so we build the tx,
    // return it unsigned, and let the client sign+send.
    // But for the hackathon demo: build + send with a throwaway payer if needed.
    // Actually: return the constructed tx as base64 for client to sign.

    function ciphertextToBytes(ct: string[]): number[] {
      // ct[0] may be a comma-separated byte string e.g. "121,148,177,..."
      // or a numeric string e.g. "12345678..."
      const first = ct[0] ?? "";
      if (first.includes(",")) {
        // Parse as raw byte array
        const bytes = first.split(",").map(b => parseInt(b.trim(), 10));
        // Pad or trim to 32 bytes
        while (bytes.length < 32) bytes.unshift(0);
        return bytes.slice(-32);
      }
      // Fallback: treat as BigInt
      const val = BigInt(first);
      const bytes = new Array(32).fill(0);
      for (let i = 0; i < 32; i++) {
        bytes[31 - i] = Number((val >> BigInt(i * 8)) & BigInt(0xff));
      }
      return bytes;
    }

    const encryptedBidA = ciphertextToBytes(bidA.ciphertext);
    const encryptedBidB = ciphertextToBytes(bidB.ciphertext);
    const bidderPubkey  = Array.from(bs58.decode(bidA.clientPublicKey));
    const nonceBytes    = bs58.decode(bidA.nonce);
    const nonce         = BigInt("0x" + Array.from(nonceBytes).map((b: number) => b.toString(16).padStart(2, "0")).join(""));

    const offsetBytes = new Uint8Array(8);
    crypto.getRandomValues(offsetBytes);
    const compOffset = Buffer.from(offsetBytes).readBigUInt64LE();

    const arciumProgramId  = getArciumProgramId();
    const clusterPubkey    = getClusterAccAddress(ARCIUM_CLUSTER_OFFSET);
    const compDefOffsetBuf = getCompDefAccOffset("reveal_winner");
    const compDefOffset    = Buffer.isBuffer(compDefOffsetBuf)
      ? compDefOffsetBuf.readUInt32LE(0)
      : typeof compDefOffsetBuf === "number"
        ? compDefOffsetBuf
        : Buffer.from(compDefOffsetBuf as Uint8Array).readUInt32LE(0);
    const compDefAccPubkey = getCompDefAccAddress(BLINDBID_PROGRAM_ID, compDefOffset);
    const compAccPubkey    = getComputationAccAddress(ARCIUM_CLUSTER_OFFSET, new BN(compOffset.toString()));

    const mempoolPubkey = getMempoolAccAddress(ARCIUM_CLUSTER_OFFSET);
    const execPoolPubkey = getExecutingPoolAccAddress(ARCIUM_CLUSTER_OFFSET);
    const [signPdaPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from("ArciumSignerAccount")],
      BLINDBID_PROGRAM_ID
    );

    const walletPubkey = new PublicKey(walletPkStr);

    // Build a dummy provider (read-only) to construct the instruction
    const kp = Keypair.generate();
    const dummyWallet = {
      publicKey: kp.publicKey,
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any) => txs,
    } as unknown as Wallet;
    const provider = new AnchorProvider(connection, dummyWallet, { commitment: "confirmed" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = new Program(mxeIdl as any, provider);

    // Build transaction (don't send — return for client to sign)
    const tx = await program.methods
      .revealWinner(
        new BN(compOffset.toString()),
        encryptedBidA,
        encryptedBidB,
        bidderPubkey,
        new BN(nonce.toString()),
      )
      .accounts({
        payer:              walletPubkey,
        signPdaAccount:     signPdaPubkey,
        mxeAccount:         BLINDBID_MXE_ACCOUNT,
        mempoolAccount:     mempoolPubkey,
        executingPool:      execPoolPubkey,
        computationAccount: compAccPubkey,
        compDefAccount:     compDefAccPubkey,
        clusterAccount:     clusterPubkey,
        systemProgram:      SystemProgram.programId,
        arciumProgram:      arciumProgramId,
      })
      .transaction();

    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = walletPubkey;

    const serialized = tx.serialize({ requireAllSignatures: false });
    const txBase64 = Buffer.from(serialized).toString("base64");

    return NextResponse.json({ txBase64, computationOffset: compOffset.toString() });

  } catch (error) {
    console.error("Arcium reveal error:", error);
    return NextResponse.json(
      { error: "Reveal failed: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const connection = new Connection(process.env.HELIUS_RPC_URL!, "confirmed");

    const { searchParams } = new URL(req.url);
    const computationOffset = searchParams.get("computationOffset");
    const mxeProgramId = searchParams.get("mxeProgramId") ?? "87ze8FFkYPnUaXUQZwoC2K14p6ju8YYCaAG7nGB8HLUh";

    if (!computationOffset) {
      return NextResponse.json({ error: "Missing computationOffset" }, { status: 400 });
    }

    const { awaitComputationFinalization } = await import("@arcium-hq/client");
    const { BN, AnchorProvider } = await import("@coral-xyz/anchor");

    const kp = Keypair.generate();
    const dummyWallet = {
      publicKey: kp.publicKey,
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any) => txs,
    } as unknown as Wallet;
    const provider = new AnchorProvider(connection, dummyWallet, { commitment: "confirmed" });

    const callbackSig = await awaitComputationFinalization(
      provider,
      new BN(computationOffset),
      new PublicKey(mxeProgramId),
      "confirmed",
      90000,
    );

    const tx = await connection.getParsedTransaction(callbackSig, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    const logs = tx?.meta?.logMessages ?? [];
    let winnerIndex = "0";
    for (const log of logs) {
      if (log.includes("winner_index") || log.includes("WinnerRevealed")) {
        const match = log.match(/winner_index[^0-9]*([01])/);
        if (match) { winnerIndex = match[1]; break; }
      }
    }

    return NextResponse.json({ winnerIndex, callbackSig });
  } catch (error) {
    console.error("Arcium poll error:", error);
    return NextResponse.json(
      { error: "Poll failed: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
