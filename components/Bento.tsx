import SectionHeader from "./SectionHeader";

export default function Bento() {
  return (
    <section className="flex flex-col w-full bg-[#0D0D0D] py-16 px-6 md:py-[100px] md:px-[120px] gap-12 md:gap-[64px]"
      style={{ borderTop: "1px solid #1A1A1A" }}>
      <SectionHeader
        label="[07] // POWERED BY"
        title={"THE STACK\nBEHIND BLINDBID."}
        subtitle="BATTLE-TESTED CRYPTOGRAPHY MEETS SOLANA PERFORMANCE."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[2px] w-full">
        {/* Big card */}
        <div className="md:col-span-2 flex flex-col gap-5 p-8 md:p-[40px] bg-[#111111]"
          style={{ borderTop: "3px solid #9945FF" }}>
          <div className="w-[40px] h-[40px] bg-[#9945FF]" />
          <h3 className="font-grotesk text-[24px] font-bold text-[#F0EEFF] tracking-[1px]">ARCIUM MPC NETWORK</h3>
          <p className="font-ibm-mono text-[12px] text-[#666] tracking-[0.5px] leading-[1.8]">
            Arcium is a parallelized confidential computing network. It enables encrypted computations across distributed nodes — meaning bids are processed without ever being decrypted on any single machine. BlindBid uses Arcium as its cryptographic backbone for all bid encryption and result computation.
          </p>
          <div className="flex gap-[2px] mt-2">
            {["MPC", "THRESHOLD CRYPTO", "CONFIDENTIAL COMPUTE", "ZERO-KNOWLEDGE"].map((tag, i) => (
              <div key={i} className="flex items-center h-[24px] px-[10px] bg-[#1A1A1A] border border-[#9945FF]">
                <span className="font-ibm-mono text-[9px] text-[#9945FF] tracking-[1.5px]">{tag}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Solana card */}
        <div className="flex flex-col gap-5 p-8 md:p-[40px] bg-[#111111]"
          style={{ borderTop: "3px solid #9945FF" }}>
          <div className="w-[40px] h-[40px] bg-[#9945FF]" />
          <h3 className="font-grotesk text-[20px] font-bold text-[#F0EEFF] tracking-[1px]">SOLANA</h3>
          <p className="font-ibm-mono text-[12px] text-[#666] tracking-[0.5px] leading-[1.8]">
            65,000 TPS. Sub-400ms finality. Near-zero fees. The only chain fast enough to handle real-time encrypted auction settlement.
          </p>
        </div>
        {/* Anchor card */}
        <div className="flex flex-col gap-5 p-8 md:p-[40px] bg-[#111111]"
          style={{ borderTop: "3px solid #4ADE80" }}>
          <div className="w-[40px] h-[40px] bg-[#4ADE80]" />
          <h3 className="font-grotesk text-[20px] font-bold text-[#F0EEFF] tracking-[1px]">ANCHOR FRAMEWORK</h3>
          <p className="font-ibm-mono text-[12px] text-[#666] tracking-[0.5px] leading-[1.8]">
            Smart contracts written in Rust using the Anchor framework. Type-safe, auditable, and fully open source.
          </p>
        </div>
        {/* Next.js card */}
        <div className="flex flex-col gap-5 p-8 md:p-[40px] bg-[#111111]"
          style={{ borderTop: "3px solid #60A5FA" }}>
          <div className="w-[40px] h-[40px] bg-[#60A5FA]" />
          <h3 className="font-grotesk text-[20px] font-bold text-[#F0EEFF] tracking-[1px]">NEXT.JS + TYPESCRIPT</h3>
          <p className="font-ibm-mono text-[12px] text-[#666] tracking-[0.5px] leading-[1.8]">
            Frontend built with Next.js 15 and TypeScript for a fast, type-safe, production-grade experience.
          </p>
        </div>
        {/* Wallet card */}
        <div className="flex flex-col gap-5 p-8 md:p-[40px] bg-[#111111]"
          style={{ borderTop: "3px solid #A78BFA" }}>
          <div className="w-[40px] h-[40px] bg-[#A78BFA]" />
          <h3 className="font-grotesk text-[20px] font-bold text-[#F0EEFF] tracking-[1px]">WALLET ADAPTER</h3>
          <p className="font-ibm-mono text-[12px] text-[#666] tracking-[0.5px] leading-[1.8]">
            Connect with Phantom, Backpack, Solflare and any Solana-compatible wallet. No accounts. No KYC.
          </p>
        </div>
      </div>
    </section>
  );
}
