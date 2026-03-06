"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { shortenAddress } from "@/lib/arcium";

const links = [
  { label: "HOW IT WORKS", href: "/how-it-works" },
  { label: "FEATURES",     href: "/features"     },
  { label: "AUCTIONS",     href: "/auctions"     },
  { label: "FAQ",          href: "/faq"          },
];

export default function Navbar() {
  const pathname                          = usePathname();
  const [menuOpen, setMenuOpen]           = useState(false);
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible }                    = useWalletModal();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background:           "rgba(10,10,10,0.92)",
        backdropFilter:       "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom:         "1px solid #1E1E1E",
      }}>
      <div className="flex items-center justify-between h-[60px] px-6 md:px-[48px] max-w-[1400px] mx-auto">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-[10px] shrink-0 group">
          <img src="/logo.svg" alt="BlindBid" className="w-[28px] h-[28px] group-hover:opacity-80 transition-opacity" />
          <span className="font-grotesk text-[13px] font-bold text-[#F0EEFF] tracking-[2.5px]">BLINDBID</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-[4px]">
          {links.map(({ label, href }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href}
                className="relative flex items-center h-[36px] px-[14px] font-ibm-mono text-[10px] tracking-[1.5px] transition-all duration-150 no-underline"
                style={{
                  color:      isActive ? "#9945FF" : "#555",
                  background: isActive ? "rgba(153,69,255,0.1)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.color = "#F0EEFF";
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(153,69,255,0.08)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.color = "#555";
                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  }
                }}>
                {label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#9945FF]" />
                )}
              </Link>
            );
          })}

          {/* Profile — always purple */}
          <Link href="/profile"
            className="relative flex items-center h-[36px] px-[14px] font-ibm-mono text-[10px] tracking-[1.5px] transition-all duration-150 no-underline ml-[4px]"
            style={{
              color:      pathname === "/profile" ? "#0A0A0A" : "#9945FF",
              background: pathname === "/profile" ? "#9945FF" : "rgba(153,69,255,0.15)",
              border:     "1px solid rgba(153,69,255,0.4)",
            }}
            onMouseEnter={(e) => {
              if (pathname !== "/profile") {
                (e.currentTarget as HTMLAnchorElement).style.background = "#9945FF";
                (e.currentTarget as HTMLAnchorElement).style.color = "#0A0A0A";
              }
            }}
            onMouseLeave={(e) => {
              if (pathname !== "/profile") {
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(153,69,255,0.15)";
                (e.currentTarget as HTMLAnchorElement).style.color = "#9945FF";
              }
            }}>
            PROFILE
          </Link>
        </nav>

        {/* Desktop wallet */}
        <div className="hidden md:flex items-center gap-[10px]">
          {connected && publicKey ? (
            <>
              <div className="flex items-center gap-[8px] h-[36px] px-[14px] bg-[#1A1A1A]"
                style={{ border: "1px solid #2D2D2D" }}>
                <div className="w-[6px] h-[6px] bg-[#4ADE80] rounded-full" />
                <span className="font-ibm-mono text-[10px] text-[#888] tracking-[1px]">
                  {shortenAddress(publicKey.toBase58())}
                </span>
              </div>
              <button onClick={() => disconnect()}
                className="font-ibm-mono text-[10px] text-[#555] tracking-[1.5px] hover:text-[#ff4444] transition-colors bg-transparent border-none cursor-pointer">
                DISCONNECT
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setVisible(true)}
                className="font-ibm-mono text-[10px] text-[#555] tracking-[1.5px] hover:text-[#F0EEFF] transition-colors bg-transparent border-none cursor-pointer">
                CONNECT WALLET
              </button>
              <Link href="/auctions"
                className="flex items-center justify-center h-[36px] px-[18px] font-grotesk text-[11px] font-bold text-[#0A0A0A] tracking-[1.5px] hover:opacity-90 transition-opacity no-underline"
                style={{ background: "#9945FF" }}>
                BID NOW
              </Link>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button className="md:hidden flex flex-col gap-[5px] p-2 -mr-2"
          onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
          <span className="block w-[20px] h-[1.5px] bg-[#F0EEFF] transition-transform duration-200 origin-center"
            style={{ transform: menuOpen ? "translateY(6.5px) rotate(45deg)" : "none" }} />
          <span className="block w-[20px] h-[1.5px] bg-[#F0EEFF] transition-opacity duration-200"
            style={{ opacity: menuOpen ? 0 : 1 }} />
          <span className="block w-[20px] h-[1.5px] bg-[#F0EEFF] transition-transform duration-200 origin-center"
            style={{ transform: menuOpen ? "translateY(-6.5px) rotate(-45deg)" : "none" }} />
        </button>
      </div>

      {/* Mobile drawer */}
      <div className="md:hidden overflow-hidden transition-all duration-300"
        style={{
          maxHeight:      menuOpen ? "500px" : "0px",
          background:     "rgba(10,10,10,0.97)",
          backdropFilter: "blur(14px)",
          borderBottom:   menuOpen ? "1px solid #1E1E1E" : "none",
        }}>
        <nav className="flex flex-col px-6 py-5 gap-0">
          {links.map(({ label, href }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 w-full font-ibm-mono text-[12px] tracking-[2px] py-[14px] no-underline"
                style={{
                  color:        isActive ? "#9945FF" : "#666",
                  borderBottom: "1px solid #141414",
                }}>
                <span className="w-[4px] h-[4px] rounded-full shrink-0"
                  style={{ background: isActive ? "#9945FF" : "#2D2D2D" }} />
                {label}
              </Link>
            );
          })}
          {/* Profile mobile */}
          <Link href="/profile" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 w-full font-ibm-mono text-[12px] tracking-[2px] py-[14px] no-underline"
            style={{ color: "#9945FF", borderBottom: "1px solid #141414" }}>
            <span className="w-[4px] h-[4px] rounded-full shrink-0 bg-[#9945FF]" />
            PROFILE
          </Link>
          <div className="flex flex-col gap-[10px] pt-5">
            {connected && publicKey ? (
              <button onClick={() => { disconnect(); setMenuOpen(false); }}
                className="font-ibm-mono text-[12px] text-[#ff4444] tracking-[1.5px] bg-transparent border-none cursor-pointer text-left">
                DISCONNECT {shortenAddress(publicKey.toBase58())}
              </button>
            ) : (
              <button onClick={() => { setVisible(true); setMenuOpen(false); }}
                className="font-ibm-mono text-[12px] text-[#555] tracking-[1.5px] bg-transparent border-none cursor-pointer text-left">
                CONNECT WALLET
              </button>
            )}
            <Link href="/auctions" onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center h-[44px] font-grotesk text-[11px] font-bold text-[#0A0A0A] tracking-[1.5px] text-center no-underline"
              style={{ background: "#9945FF" }}>
              BID NOW
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
