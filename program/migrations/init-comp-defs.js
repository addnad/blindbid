const anchor = require("@coral-xyz/anchor");
const { PublicKey, Connection } = require("@solana/web3.js");
const {
  getArciumProgramId,
  getMXEAccAddress,
  getCompDefAccAddress,
  getCompDefAccOffset,
} = require("@arcium-hq/client");

const mxeIdl = require("../blindbid_mxe.json");
const MXE_PROGRAM_ID = new PublicKey("87ze8FFkYPnUaXUQZwoC2K14p6ju8YYCaAG7nGB8HLUh");
const RPC_URL = process.env.ANCHOR_PROVIDER_URL;

async function main() {
  console.log("Starting comp def initialization...");
  const connection = new Connection(RPC_URL, "confirmed");
  const wallet = anchor.Wallet.local();
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  const program = new anchor.Program(mxeIdl, provider);
  const arciumProgramId = getArciumProgramId();
  const mxeAccAddress = getMXEAccAddress(MXE_PROGRAM_ID);
  console.log("MXE account:", mxeAccAddress.toBase58());

  // Fetch raw MXE account data to get lut_offset_slot
  const mxeInfo = await connection.getAccountInfo(mxeAccAddress);
  if (!mxeInfo) throw new Error("MXE account not found on-chain");

  // lut_offset_slot is a u64 at offset 8+1+32+1 = 42 in the account data
  const lutOffsetSlot = mxeInfo.data.readBigUInt64LE(42);
  console.log("lut_offset_slot:", lutOffsetSlot.toString());

  // Derive LUT PDA
  const [lutAddress] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("lut"),
      mxeAccAddress.toBuffer(),
      (() => { const b = Buffer.alloc(8); b.writeBigUInt64LE(lutOffsetSlot); return b; })(),
    ],
    arciumProgramId
  );
  console.log("LUT address:", lutAddress.toBase58());

  for (const name of ["reveal_winner", "submit_bid"]) {
    const offsetRaw = getCompDefAccOffset(name);
    const compDefOffset = Buffer.isBuffer(offsetRaw)
      ? offsetRaw.readUInt32LE(0)
      : typeof offsetRaw === "number"
      ? offsetRaw
      : Buffer.from(offsetRaw).readUInt32LE(0);

    const compDefAccount = getCompDefAccAddress(MXE_PROGRAM_ID, compDefOffset);
    console.log(`\nInitializing: ${name} (offset: ${compDefOffset})`);
    console.log(`  comp_def: ${compDefAccount.toBase58()}`);
    console.log(`  lut:      ${lutAddress.toBase58()}`);

    try {
      const fn = name === "reveal_winner"
        ? program.methods.initRevealWinnerCompDef()
        : program.methods.initSubmitBidCompDef();

      const tx = await fn
        .accounts({
          payer: wallet.publicKey,
          mxeAccount: mxeAccAddress,
          compDefAccount,
          addressLookupTable: lutAddress,
          lutProgram: new PublicKey("AddressLookupTab1e1111111111111111111111111"),
          arciumProgram: arciumProgramId,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      console.log(`✓ ${name} initialized: ${tx}`);
    } catch (e) {
      console.log(`⚠ ${name}: ${e.message}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
// Quick test with hardcoded correct LUT
