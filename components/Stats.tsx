import SectionHeader from "./SectionHeader";

const stats = [
  { value: "100%", label: "BID PRIVACY", sub: "ZERO LEAKAGE GUARANTEED", color: "#9945FF" },
  { value: "0",    label: "MEV ATTACKS", sub: "FRONT-RUNNING IMPOSSIBLE", color: "#4ADE80" },
  { value: "<400", label: "MS FINALITY", sub: "SOLANA BLOCK SPEED",       color: "#60A5FA" },
  { value: "3",    label: "MPC NODES",   sub: "ARCIUM ENCRYPTION NETWORK", color: "#A78BFA" },
];

export default function Stats() {
  return (
    <section className="flex flex-col w-full bg-[#0A0A0A] py-16 px-6 md:py-[100px] md:px-[120px] gap-12 md:gap-[64px]">
      <SectionHeader
        label="[03] // BY THE NUMBERS"
        title={"THE PROTOCOL\nIN PLAIN NUMBERS."}
        subtitle="CRYPTOGRAPHIC GUARANTEES. NOT MARKETING PROMISES."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-[2px] w-full">
        {stats.map((s, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 p-8 md:p-[40px] bg-[#111111]"
            style={{ borderTop: `3px solid ${s.color}` }}
          >
            <span
              className="font-grotesk text-[48px] md:text-[64px] font-bold leading-none tracking-[-2px]"
              style={{ color: s.color }}
            >
              {s.value}
            </span>
            <span className="font-grotesk text-[14px] font-bold text-[#F0EEFF] tracking-[1px]">
              {s.label}
            </span>
            <span className="font-ibm-mono text-[10px] text-[#555] tracking-[1.5px]">
              {s.sub}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
