import SectionHeader from "./SectionHeader";

const rows = [
  { feature: "BID PRIVACY",         blindbid: true,  traditional: false, others: false  },
  { feature: "MEV PROTECTION",      blindbid: true,  traditional: false, others: false  },
  { feature: "FRONT-RUN PROOF",     blindbid: true,  traditional: false, others: false  },
  { feature: "ON-CHAIN SETTLEMENT", blindbid: true,  traditional: false, others: true   },
  { feature: "VICKREY SUPPORT",     blindbid: true,  traditional: false, others: false  },
  { feature: "TRUSTLESS REVEAL",    blindbid: true,  traditional: false, others: false  },
  { feature: "SOLANA SPEED",        blindbid: true,  traditional: false, others: true   },
  { feature: "OPEN SOURCE",         blindbid: true,  traditional: false, others: true   },
];

function Check({ yes }: { yes: boolean }) {
  return (
    <div className="flex items-center justify-center w-full">
      {yes ? (
        <div className="flex items-center justify-center w-[28px] h-[28px] bg-[#9945FF]">
          <span className="font-grotesk text-[14px] font-bold text-[#0A0A0A]">✓</span>
        </div>
      ) : (
        <div className="flex items-center justify-center w-[28px] h-[28px] bg-[#1A1A1A]">
          <span className="font-grotesk text-[14px] text-[#333]">✗</span>
        </div>
      )}
    </div>
  );
}

export default function Comparison() {
  return (
    <section
      id="comparison"
      className="flex flex-col w-full bg-[#0A0A0A] py-16 px-6 md:py-[100px] md:px-[120px] gap-12 md:gap-[64px]"
    >
      <SectionHeader
        label="[05] // COMPARISON"
        title={"BLINDBID VS.\nEVERYTHING ELSE."}
        subtitle="TRADITIONAL AUCTIONS LEAK BIDS. MOST ONCHAIN AUCTIONS DO TOO. WE DON'T."
      />

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr>
              <th className="text-left p-5 bg-[#111111] font-ibm-mono text-[10px] text-[#444] tracking-[2px] w-[40%]">
                FEATURE
              </th>
              <th className="p-5 bg-[#9945FF] font-grotesk text-[12px] font-bold text-[#0A0A0A] tracking-[2px]">
                BLINDBID
              </th>
              <th className="p-5 bg-[#111111] font-ibm-mono text-[10px] text-[#444] tracking-[2px]">
                TRADITIONAL
              </th>
              <th className="p-5 bg-[#111111] font-ibm-mono text-[10px] text-[#444] tracking-[2px]">
                OTHER ONCHAIN
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #1A1A1A" }}>
                <td className="p-5 bg-[#111111] font-ibm-mono text-[11px] text-[#666] tracking-[1px]">
                  {row.feature}
                </td>
                <td className="p-5 bg-[#100D1F]">
                  <Check yes={row.blindbid} />
                </td>
                <td className="p-5 bg-[#111111]">
                  <Check yes={row.traditional} />
                </td>
                <td className="p-5 bg-[#111111]">
                  <Check yes={row.others} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
