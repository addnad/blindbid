const anchor = require("@coral-xyz/anchor");
const { PublicKey } = require("@solana/web3.js");
const {
  getArciumProgramId,
  getMXEAccAddress,
  getCompDefAccAddress,
  getCompDefAccOffset,
  getArciumProgram,
} = require("@arcium-hq/client");

const mxeIdl = require("../blindbid_mxe.json");
const MXE_PROGRAM_ID = new PublicKey("87ze8FFkYPnUaXUQZwoC2K14p6ju8YYCaAG7nGB8HLUh");

async function main() {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const program = new anchor.Program(mxeIdl, provider);

  const arciumProgramId = getArciumProgramId();
  const mxeAccAddress = getMXEAccAddress(MXE_PROGRAM_ID);

  // Fetch MXE account to get lut_offset_slot
  const arciumProgram = getArciumProgram(provider);
  const mxeAccInfo = await arciumProgram.account.mxeaccount.fetch(mxeAccAddress);
  console.log("MXE lut_offset_slot:", mxeAccInfo.lutOffsetSlot.toString());

  // Derive LUT address from lut_offset_slot
  const [lutAddress] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("lut"),
      mxeAccAddress.toBuffer(),
      mxeAccInfo.lutOffsetSlot.toArrayLike(Buffer, "le", 8),
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
    console.log(`\nInitializing comp def: ${name} (offset: ${compDefOffset})`);
    console.log(`  comp_def_account: ${compDefAccount.toBase58()}`);

    try {
      const fn = name === "reveal_winner"
        ? program.methods.initRevealWinnerCompDef()
        : program.methods.initSubmitBidCompDef();

      const tx = await fn
        .accounts({
          payer: provider.wallet.publicKey,
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
      console.log(`⚠ ${name}: ${(e as any).message}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
