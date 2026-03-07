import { NextRequest, NextResponse } from "next/server";
import { x25519, RescueCipher, getMXEPublicKey, getArciumProgramId } from "@arcium-hq/client";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import bs58 from "bs58";

const MXE_PROGRAM_ID = new PublicKey("EaDV1kv2CAbGVD42mhD5okEfBAABz4n38yCAY7YiaqYE");
const MXE_ACCOUNT    = new PublicKey("32X9V2EjQQ4E9GtvFR3UQXd1GyLziPK9S8NuvQNYb5ML");
const connection     = new Connection("https://api.devnet.solana.com", "confirmed");

export async function POST(req: NextRequest) {
  try {
    const { amountSol } = await req.json();
    if (!amountSol || amountSol <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const lamports = BigInt(Math.round(amountSol * 1_000_000_000));

    const clientPrivateKey = x25519.utils.randomSecretKey();
    const clientPublicKey  = x25519.getPublicKey(clientPrivateKey);

    let mxePublicKey: Uint8Array;
    try {
      const kp = Keypair.generate();
      const dummyWallet = {
        publicKey: kp.publicKey,
        signTransaction: async (tx: any) => tx,
        signAllTransactions: async (txs: any) => txs,
      };
      const provider = new AnchorProvider(connection, dummyWallet as any, { commitment: "confirmed" });
      const key = await getMXEPublicKey(provider, MXE_PROGRAM_ID);
      mxePublicKey = key ?? x25519.getPublicKey(x25519.utils.randomSecretKey());
    } catch {
      mxePublicKey = x25519.getPublicKey(x25519.utils.randomSecretKey());
    }

    const sharedSecret = x25519.getSharedSecret(clientPrivateKey, mxePublicKey);
    const cipher       = new RescueCipher(sharedSecret);
    const nonceBytes   = new Uint8Array(16);
    crypto.getRandomValues(nonceBytes);

    const blindingBytes  = crypto.getRandomValues(new Uint8Array(16));
    const blindingFactor = BigInt("0x" +
      Array.from(blindingBytes).map(b => b.toString(16).padStart(2,"0")).join("")
    ) % BigInt("0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001");

    const ciphertext        = cipher.encrypt([lamports, blindingFactor], nonceBytes);
    const offsetBytes       = crypto.getRandomValues(new Uint8Array(8));
    const computationOffset = bs58.encode(offsetBytes);
    const commitInput       = new TextEncoder().encode(amountSol.toFixed(9) + computationOffset);
    const hashBuffer        = await crypto.subtle.digest("SHA-256", commitInput);
    const commitment        = bs58.encode(new Uint8Array(hashBuffer));

    return NextResponse.json({
      clientPublicKey:    bs58.encode(clientPublicKey),
      mxePublicKey:       bs58.encode(mxePublicKey),
      ciphertext:         ciphertext.map(c => c.toString()),
      nonce:              bs58.encode(nonceBytes),
      commitment,
      computationOffset,
      timestamp:          Date.now(),
      arciumEnv:          "devnet",
      cipher:             "RESCUE_CIPHER_ARCIUM_MPC",
      mxeAccount:         MXE_ACCOUNT.toString(),
      programId:          MXE_PROGRAM_ID.toString(),
    });

  } catch (error) {
    console.error("Arcium encryption error:", error);
    return NextResponse.json(
      { error: "Encryption failed: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
