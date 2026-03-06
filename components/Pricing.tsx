import SectionHeader from "./SectionHeader";

const plans = [
  {
    name: "BIDDER",
    price: "FREE",
    sub: "FOREVER",
    description: "For anyone who wants to participate in sealed-bid auctions on BlindBid.",
    features: ["Unlimited sealed bids", "All auction types", "Wallet connect", "Bid history", "On-chain verification"],
    cta: "START BIDDING",
    accent: "#9945FF",
    highlight: false,
  },
  {
    name: "CREATOR",
    price: "0.1 SOL",
    sub: "PER AUCTION",
    description: "For projects and creators who want to run their own encrypted blind auctions.",
    features: ["Create unlimited auctions", "Custom floor price", "Vickrey / Uniform / First-price", "Automatic settlement", "Open-source smart contract"],
    cta: "CREATE AUCTION",
    accent: "#9945FF",
    highlight: true,
  },
  {
    name: "PROTOCOL",
    price: "OPEN",
    sub: "SOURCE",
    description: "Fork the entire BlindBid stack and deploy your own encrypted auction platform.",
    features: ["Full source code access", "Arcium integration guide", "Anchor smart contracts", "Community support", "MIT License"],
    cta: "VIEW GITHUB",
    accent: "#4ADE80",
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="flex flex-col w-full bg-[#0D0D0D] py-16 px-6 md:py-[100px] md:px-[120px] gap-12 md:gap-[64px]"
      style={{ borderTop: "1px solid #1A1A1A" }}>
      <SectionHeader
        label="[09] // PRICING"
        title={"SIMPLE.\nTRANSPARENT."}
        subtitle="NO HIDDEN FEES. NO SUBSCRIPTIONS. PAY ONLY WHEN YOU CREATE AN AUCTION."
      />
      <div className="flex flex-col md:flex-row gap-[2px] w-full">
        {plans.map((plan, i) => (
          <div key={i} className="flex flex-col gap-6 p-8 md:p-[40px] flex-1"
            style={{
              background: plan.highlight ? "#0D0A1A" : "#111111",
              borderTop: `3px solid ${plan.accent}`,
              outline: plan.highlight ? "1px solid #9945FF" : "none",
            }}>
            {plan.highlight && (
              <div className="flex items-center h-[24px] px-[10px] bg-[#9945FF] w-fit">
                <span className="font-ibm-mono text-[9px] text-[#0A0A0A] tracking-[2px] font-bold">MOST POPULAR</span>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span className="font-ibm-mono text-[10px] text-[#444] tracking-[3px]">{plan.name}</span>
              <div className="flex items-baseline gap-2">
                <span className="font-grotesk text-[40px] font-bold leading-none tracking-[-1px]"
                  style={{ color: plan.accent }}>{plan.price}</span>
                <span className="font-ibm-mono text-[10px] text-[#555] tracking-[2px]">{plan.sub}</span>
              </div>
            </div>
            <p className="font-ibm-mono text-[12px] text-[#666] tracking-[0.5px] leading-[1.6]">{plan.description}</p>
            <div className="flex flex-col gap-3">
              {plan.features.map((f, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="w-[6px] h-[6px] shrink-0" style={{ background: plan.accent }} />
                  <span className="font-ibm-mono text-[11px] text-[#666] tracking-[0.5px]">{f}</span>
                </div>
              ))}
            </div>
            <button className="flex items-center justify-center h-[48px] mt-auto transition-colors"
              style={{ background: plan.highlight ? plan.accent : "transparent", border: `1px solid ${plan.highlight ? plan.accent : "#2D2D2D"}` }}>
              <span className="font-grotesk text-[11px] font-bold tracking-[2px]"
                style={{ color: plan.highlight ? "#0A0A0A" : "#555" }}>{plan.cta}</span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
