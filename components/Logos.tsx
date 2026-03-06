const partners = ["ARCIUM", "SOLANA", "ANCHOR", "PHANTOM", "BACKPACK", "SOLFLARE"];

export default function Logos() {
  return (
    <section className="flex flex-col items-center w-full bg-[#0D0D0D] py-10 px-6 gap-6"
      style={{ borderTop: "1px solid #1A1A1A", borderBottom: "1px solid #1A1A1A" }}>
      <span className="font-ibm-mono text-[10px] text-[#333] tracking-[3px]">BUILT WITH &amp; FOR</span>
      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-[60px]">
        {partners.map((p, i) => (
          <span key={i} className="font-grotesk text-[14px] md:text-[16px] font-bold text-[#2D2D2D] tracking-[3px] hover:text-[#555] transition-colors cursor-default">
            {p}
          </span>
        ))}
      </div>
    </section>
  );
}
