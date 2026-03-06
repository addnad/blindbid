import SectionHeader from "./SectionHeader";

const quotes = [
  {
    text: "BlindBid is exactly what on-chain auctions have been missing. Real privacy, not just the illusion of it.",
    author: "SOLANA DEVELOPER",
    role: "PROTOCOL BUILDER",
    accent: "#9945FF",
  },
  {
    text: "Finally — a Vickrey auction implementation on Solana that actually prevents MEV. Arcium integration is slick.",
    author: "DeFi RESEARCHER",
    role: "MECHANISM DESIGN",
    accent: "#4ADE80",
  },
  {
    text: "Submitted my bid knowing nobody could front-run me. That peace of mind is worth everything in this space.",
    author: "NFT COLLECTOR",
    role: "EARLY BIDDER",
    accent: "#60A5FA",
  },
];

export default function Testimonials() {
  return (
    <section className="flex flex-col w-full bg-[#0A0A0A] py-16 px-6 md:py-[100px] md:px-[120px] gap-12 md:gap-[64px]">
      <SectionHeader
        label="[08] // EARLY USERS"
        title={"WHAT BUILDERS\nARE SAYING."}
        subtitle="FROM DEVS AND BIDDERS WHO TESTED BLINDBID ON DEVNET."
      />
      <div className="flex flex-col md:flex-row gap-[2px] w-full">
        {quotes.map((q, i) => (
          <div key={i} className="flex flex-col gap-6 p-8 md:p-[40px] bg-[#111111] flex-1"
            style={{ borderTop: `3px solid ${q.accent}` }}>
            <span className="font-grotesk text-[48px] leading-none" style={{ color: q.accent, opacity: 0.4 }}>&ldquo;</span>
            <p className="font-ibm-mono text-[13px] text-[#888] tracking-[0.5px] leading-[1.8] -mt-6">{q.text}</p>
            <div className="flex flex-col gap-1 mt-auto">
              <span className="font-grotesk text-[13px] font-bold text-[#F0EEFF] tracking-[1px]">{q.author}</span>
              <span className="font-ibm-mono text-[10px] tracking-[2px]" style={{ color: q.accent }}>{q.role}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
