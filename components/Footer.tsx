"use client";
import Link from "next/link";

const LINKS = {
  PROTOCOL: [
    { label: "HOW IT WORKS",  href: "/how-it-works" },
    { label: "FEATURES",      href: "/features"     },
    { label: "AUCTIONS",      href: "/auctions"     },
    { label: "FAQ",           href: "/faq"          },
  ],
  DEVELOPERS: [
    { label: "GITHUB",          href: "https://github.com/addnad/blindbid"                                              },
    { label: "SMART CONTRACT",  href: "https://github.com/addnad/blindbid/tree/main/program"                            },
    { label: "ARCIUM DOCS",     href: "https://docs.arcium.com"                                                         },
    { label: "SOLANA DOCS",     href: "https://docs.solana.com"                                                         },
  ],
  COMMUNITY: [
    { label: "TWITTER / X",  href: "https://x.com/arcium"                   },
    { label: "DISCORD",      href: "https://discord.gg/arcium"               },
    { label: "ARCIUM RTG",   href: "https://rtg.arcium.com"                  },
    { label: "SOLANA",       href: "https://solana.com"                      },
  ],
};

export default function Footer() {
  return (
    <footer className="flex flex-col w-full bg-[#0A0A0A]" style={{ borderTop: "1px solid #1A1A1A" }}>
      <div className="flex flex-col md:flex-row items-start justify-between gap-10 px-6 md:px-[120px] py-12 md:py-[64px]">

        {/* Brand */}
        <div className="flex flex-col gap-4 max-w-[300px]">
          <Link href="/" className="flex items-center gap-[10px] no-underline">
            <img src="/logo.svg" alt="BlindBid" className="w-[28px] h-[28px]" />
            <span className="font-grotesk text-[13px] font-bold text-[#F0EEFF] tracking-[2.5px]">BLINDBID</span>
          </Link>
          <p className="font-ibm-mono text-[11px] text-[#444] tracking-[0.5px] leading-[1.8]">
            The first encrypted sealed-bid auction protocol on Solana. Powered by Arcium MPC. Zero front-running. Zero collusion.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-[6px] h-[6px] bg-[#4ADE80] rounded-full" />
            <span className="font-ibm-mono text-[10px] text-[#4ADE80] tracking-[1.5px]">DEVNET LIVE</span>
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
          {Object.entries(LINKS).map(([category, items]) => (
            <div key={category} className="flex flex-col gap-4">
              <span className="font-ibm-mono text-[10px] text-[#9945FF] tracking-[3px]">{category}</span>
              {items.map(({ label, href }) =>
                href.startsWith("http") ? (
                  <a key={label} href={href} target="_blank" rel="noreferrer"
                    className="font-ibm-mono text-[11px] text-[#444] tracking-[1px] hover:text-[#9945FF] transition-colors no-underline">
                    {label}
                  </a>
                ) : (
                  <Link key={label} href={href}
                    className="font-ibm-mono text-[11px] text-[#444] tracking-[1px] hover:text-[#9945FF] transition-colors no-underline">
                    {label}
                  </Link>
                )
              )}
            </div>
          ))}
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
            <div className="w-[6px] h-[6px] bg-[#4ADE80]" />
            <div className="w-[6px] h-[6px] bg-[#60A5FA]" />
          </div>
        </div>
      </div>
    </footer>
  );
}
