import GlitchText from "./GlitchText";

export default function FinalCTA() {
  return (
    <section className="flex flex-col items-center w-full bg-[#0A0A0A] py-16 px-6 md:py-[120px] md:px-[120px] gap-8 text-center"
      style={{ borderTop: "1px solid #1A1A1A" }}>
      <div className="flex items-center justify-center gap-[8px] h-[32px] px-[16px] bg-[#1A1A1A] border-2 border-[#9945FF]">
        <div className="w-[8px] h-[8px] bg-[#9945FF]" />
        <span className="font-ibm-mono text-[11px] font-bold text-[#9945FF] tracking-[2px]">
          [DEVNET LIVE] // ARCIUM + SOLANA
        </span>
      </div>
      <h2 className="font-grotesk text-[clamp(32px,8vw,80px)] font-bold text-[#F0EEFF] tracking-[-1px] leading-none max-w-[900px]">
        <GlitchText text="YOUR BIDS." speed={45} delay={100} />
        <br />
        <span style={{ color: "#9945FF" }}>
          <GlitchText text="YOUR SECRET." speed={45} delay={300} />
        </span>
      </h2>
      <p className="font-ibm-mono text-[13px] text-[#666] tracking-[1px] leading-[1.6] max-w-[600px]">
        JOIN THE FIRST ENCRYPTED BLIND AUCTION PROTOCOL ON SOLANA. POWERED BY ARCIUM MPC. NO FRONT-RUNNING. EVER.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-[2px]">
        <button className="flex items-center justify-center w-full sm:w-[240px] h-[56px] bg-[#9945FF] hover:bg-[#7c2de8] transition-colors">
          <span className="font-grotesk text-[12px] font-bold text-[#0A0A0A] tracking-[2px]">PLACE SEALED BID</span>
        </button>
        <button className="flex items-center justify-center w-full sm:w-[200px] h-[56px] bg-[#0A0A0A] border-2 border-[#3D3D3D] hover:border-[#888] transition-colors">
          <span className="font-ibm-mono text-[12px] text-[#888] tracking-[2px]">VIEW GITHUB &gt;</span>
        </button>
      </div>
      <p className="font-ibm-mono text-[11px] text-[#333] tracking-[2px]">
        OPEN SOURCE // MIT LICENSE // BUILT ON ARCIUM TESTNET
      </p>
    </section>
  );
}
