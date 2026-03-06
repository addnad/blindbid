import SectionHeader from "./SectionHeader";

const steps = [
  {
    number: "01",
    title: "CREATE OR BROWSE AUCTION",
    description:
      "Any wallet can create a sealed-bid auction on BlindBid. Set your item, floor price, duration, and auction type — Vickrey, uniform, or first-price. Bidders browse live auctions and connect their Solana wallet to participate.",
    tag: "// PERMISSIONLESS",
    tagColor: "#9945FF",
    accent: "#9945FF",
  },
  {
    number: "02",
    title: "ENCRYPT YOUR BID WITH ARCIUM",
    description:
      "Enter your bid amount. BlindBid uses Arcium's MPC network to encrypt it client-side before submission. Your bid is split across multiple Arcium nodes — no single node ever sees the full value. The encrypted commitment is then written to Solana.",
    tag: "// ARCIUM MPC",
    tagColor: "#4ADE80",
    accent: "#4ADE80",
  },
  {
    number: "03",
    title: "BIDS SEALED ON SOLANA",
    description:
      "All encrypted bids live on-chain as sealed commitments. Anyone can verify that bids were submitted — but nobody, including validators, miners, or other bidders, can read the values. The auction is fully transparent yet completely private.",
    tag: "// ON-CHAIN SEALED",
    tagColor: "#60A5FA",
    accent: "#60A5FA",
  },
  {
    number: "04",
    title: "TRUSTLESS REVEAL & SETTLEMENT",
    description:
      "When the auction closes, Arcium nodes jointly compute the result using MPC — decrypting all bids simultaneously without ever revealing individual values to any single party. The winner and price are posted on-chain and settlement is automatic.",
    tag: "// TRUSTLESS RESULT",
    tagColor: "#A78BFA",
    accent: "#A78BFA",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="flex flex-col w-full bg-[#0D0D0D] py-16 px-6 md:py-[100px] md:px-[120px] gap-12 md:gap-[64px]"
      style={{ borderTop: "1px solid #1A1A1A", borderBottom: "1px solid #1A1A1A" }}
    >
      <SectionHeader
        label="[02] // HOW IT WORKS"
        title={"FROM BID TO RESULT.\nFULLY ENCRYPTED."}
        subtitle="FOUR STEPS. ZERO TRUST REQUIRED. ARCIUM HANDLES THE CRYPTOGRAPHY."
      />

      <div className="flex flex-col gap-[2px] w-full">
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex flex-col md:flex-row w-full gap-6 md:gap-0 p-8 md:p-[40px] bg-[#111111]"
            style={{ borderLeft: `3px solid ${step.accent}` }}
          >
            {/* Step number */}
            <div className="flex items-start md:w-[120px] shrink-0">
              <span
                className="font-grotesk text-[48px] font-bold leading-none tracking-[-2px]"
                style={{ color: step.accent, opacity: 0.3 }}
              >
                {step.number}
              </span>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-4 flex-1">
              <h3 className="font-grotesk text-[20px] md:text-[24px] font-bold text-[#F0EEFF] tracking-[1px]">
                {step.title}
              </h3>
              <p className="font-ibm-mono text-[12px] text-[#666] tracking-[0.5px] leading-[1.8] max-w-[700px]">
                {step.description}
              </p>
              <div
                className="flex items-center justify-center h-[26px] px-[12px] bg-[#1A1A1A] border w-fit"
                style={{ borderColor: step.tagColor }}
              >
                <span className="font-ibm-mono text-[10px] tracking-[2px]" style={{ color: step.tagColor }}>
                  {step.tag}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
