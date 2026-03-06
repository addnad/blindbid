export default function Footer() {
  return (
    <footer className="flex flex-col w-full bg-[#0A0A0A]" style={{ borderTop: "1px solid #1A1A1A" }}>
      <div className="flex flex-col md:flex-row items-start justify-between gap-10 px-6 md:px-[120px] py-12 md:py-[64px]">
        {/* Brand */}
        <div className="flex flex-col gap-4 max-w-[300px]">
          <div className="flex items-center gap-[10px]">
            <span className="w-[10px] h-[10px] bg-[#9945FF]" />
            <span className="font-grotesk text-[13px] font-bold text-[#F0EEFF] tracking-[2.5px]">BLINDBID</span>
          </div>
          <p className="font-ibm-mono text-[11px] text-[#444] tracking-[0.5px] leading-[1.8]">
            The first encrypted sealed-bid auction protocol on Solana. Powered by Arcium MPC. Zero front-running. Zero collusion.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-[6px] h-[6px] bg-[#4ADE80]" />
            <span className="font-ibm-mono text-[10px] text-[#4ADE80] tracking-[1.5px]">DEVNET LIVE</span>
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
          <div className="flex flex-col gap-4">
            <span className="font-ibm-mono text-[10px] text-[#9945FF] tracking-[3px]">PROTOCOL</span>
            {["HOW IT WORKS", "FEATURES", "AUCTIONS", "PRICING"].map((l) => (
              <a key={l} href="#" className="font-ibm-mono text-[11px] text-[#444] tracking-[1px] hover:text-[#888] transition-colors">{l}</a>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            <span className="font-ibm-mono text-[10px] text-[#9945FF] tracking-[3px]">DEVELOPERS</span>
            {["GITHUB", "DOCS", "SMART CONTRACT", "ARCIUM DOCS"].map((l) => (
              <a key={l} href="#" className="font-ibm-mono text-[11px] text-[#444] tracking-[1px] hover:text-[#888] transition-colors">{l}</a>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            <span className="font-ibm-mono text-[10px] text-[#9945FF] tracking-[3px]">COMMUNITY</span>
            {["TWITTER / X", "DISCORD", "TELEGRAM", "ARCIUM RTG"].map((l) => (
              <a key={l} href="#" className="font-ibm-mono text-[11px] text-[#444] tracking-[1px] hover:text-[#888] transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 md:px-[120px] py-5"
        style={{ borderTop: "1px solid #1A1A1A" }}>
        <span className="font-ibm-mono text-[10px] text-[#333] tracking-[1.5px]">
          © 2026 BLINDBID. OPEN SOURCE. MIT LICENSE.
        </span>
        <div className="flex items-center gap-6">
          <span className="font-ibm-mono text-[10px] text-[#333] tracking-[1.5px]">BUILT ON ARCIUM + SOLANA</span>
          <div className="flex items-center gap-[6px]">
            <div className="w-[6px] h-[6px] bg-[#9945FF]" />
            <span className="font-ibm-mono text-[10px] text-[#333] tracking-[1.5px]">v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
