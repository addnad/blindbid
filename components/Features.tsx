import SectionHeader from "./SectionHeader";

interface FeatureCardProps {
  iconColor: string;
  title: string;
  description: string;
  tag: string;
  tagColor: string;
  bgColor?: string;
  borderColor?: string;
}

function FeatureCard({ iconColor, title, description, tag, tagColor, bgColor = "#111111", borderColor = "#2D2D2D" }: FeatureCardProps) {
  return (
    <div className="flex flex-col gap-5 p-8 md:p-[32px] border w-full md:flex-1 md:h-[320px]"
      style={{ backgroundColor: bgColor, borderColor }}>
      <div className="w-[40px] h-[40px] shrink-0" style={{ backgroundColor: iconColor }} />
      <h3 className="font-grotesk text-[18px] font-bold text-[#F0EEFF] tracking-[1px] leading-[1.2] whitespace-pre-line">
        {title}
      </h3>
      <p className="font-ibm-mono text-[12px] text-[#666666] tracking-[1px] leading-[1.6]">
        {description}
      </p>
      <div className="flex items-center justify-center h-[28px] px-[12px] bg-[#1A1A1A] border w-fit"
        style={{ borderColor: tagColor }}>
        <span className="font-ibm-mono text-[11px] tracking-[2px]" style={{ color: tagColor }}>
          {tag}
        </span>
      </div>
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="flex flex-col w-full bg-[#0A0A0A] py-16 px-6 md:py-[100px] md:px-[120px] gap-12 md:gap-[64px]">
      <SectionHeader
        label="[01] // FEATURES"
        title={"FAIR AUCTIONS.\nZERO COMPROMISE."}
        subtitle="ENCRYPTED BIDS. TRUSTLESS REVEAL. POWERED BY ARCIUM MPC ON SOLANA."
      />

      <div className="flex flex-col md:flex-row w-full gap-[2px]">
        <FeatureCard
          iconColor="#9945FF"
          title={"ARCIUM\nENCRYPTION"}
          description="Every bid is encrypted using Arcium's multi-party computation network before it touches the blockchain. No one — not even validators — can see your bid until auction close."
          tag="// MPC POWERED"
          tagColor="#9945FF"
          bgColor="#111111"
          borderColor="#9945FF"
        />
        <FeatureCard
          iconColor="#4ADE80"
          title={"ZERO MEV\nPROTECTION"}
          description="Sealed bids eliminate front-running and MEV extraction entirely. Bots can't react to what they can't see. Your bid is private until the moment of reveal."
          tag="// ANTI-FRONTRUN"
          tagColor="#4ADE80"
        />
        <FeatureCard
          iconColor="#60A5FA"
          title={"SOLANA\nSPEED"}
          description="Built natively on Solana for sub-second finality and near-zero transaction fees. Submit encrypted bids and receive results in milliseconds, not minutes."
          tag="// <0.001 SOL FEE"
          tagColor="#60A5FA"
        />
      </div>

      <div className="flex flex-col md:flex-row w-full gap-[2px]">
        <FeatureCard
          iconColor="#FF6B35"
          title={"VICKREY\nAUCTION MODEL"}
          description="Winner pays the second-highest price — the gold standard for fair price discovery. No overbidding strategy required. Just bid your true valuation."
          tag="// FAIR PRICE"
          tagColor="#FF6B35"
        />
        <FeatureCard
          iconColor="#A78BFA"
          title={"TRUSTLESS\nREVEAL"}
          description="When the auction closes, Arcium's MPC nodes jointly decrypt all bids simultaneously. No single party controls the reveal. Results are verifiable on-chain."
          tag="// ON-CHAIN PROOF"
          tagColor="#A78BFA"
        />
        <FeatureCard
          iconColor="#9945FF"
          title={"OPEN\nSOURCE"}
          description="Every line of code is public. The smart contracts, the encryption layer, the frontend — all auditable, forkable, and community-owned. No black boxes."
          tag="// GITHUB VERIFIED"
          tagColor="#9945FF"
          bgColor="#111111"
          borderColor="#2D2D2D"
        />
      </div>
    </section>
  );
}
