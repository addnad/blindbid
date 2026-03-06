"use client";

import { useState } from "react";
import SectionHeader from "./SectionHeader";

const faqs = [
  {
    q: "HOW ARE BIDS KEPT PRIVATE?",
    a: "Every bid is encrypted using Arcium's Multi-Party Computation (MPC) network before it is submitted to Solana. The bid value is split across multiple independent Arcium nodes — no single node ever holds the complete value. Only when the auction closes do the nodes jointly compute the result, revealing only the winner and clearing price.",
  },
  {
    q: "WHAT IS A VICKREY AUCTION?",
    a: "A Vickrey auction is a sealed-bid format where the highest bidder wins but pays the second-highest price. This incentivizes bidders to bid their true valuation rather than strategically underbidding. It's considered the gold standard for fair price discovery and is widely used in economics and mechanism design.",
  },
  {
    q: "CAN VALIDATORS SEE MY BID ON SOLANA?",
    a: "No. Your bid is encrypted by Arcium's MPC before it is ever written to the blockchain. What validators see is an encrypted commitment — a cryptographic hash with no readable value. Even if a validator tried to front-run your transaction, they would have nothing to act on.",
  },
  {
    q: "WHAT HAPPENS IF AN ARCIUM NODE GOES OFFLINE?",
    a: "Arcium's MPC protocol is designed with fault tolerance. The network uses threshold cryptography, meaning a minimum threshold of nodes must participate in decryption — but a single offline node cannot halt the auction. The protocol continues as long as the threshold is met.",
  },
  {
    q: "WHAT AUCTION TYPES DOES BLINDBID SUPPORT?",
    a: "BlindBid currently supports three sealed-bid formats: Vickrey (second-price), First-Price (highest bid wins and pays their bid), and Uniform-Price (used for multi-unit auctions where all winners pay the same clearing price). More formats are on the roadmap.",
  },
  {
    q: "IS BLINDBID OPEN SOURCE?",
    a: "Yes. The smart contracts, Arcium integration layer, and frontend are all open source and available on GitHub. Anyone can audit the code, verify the cryptographic implementation, or fork the protocol for their own use.",
  },
  {
    q: "WHICH NETWORK IS BLINDBID ON?",
    a: "BlindBid is currently live on Solana Devnet for testing and demonstration. Mainnet deployment is planned following a full security audit of the smart contracts and Arcium integration.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="flex flex-col w-full bg-[#0A0A0A] py-16 px-6 md:py-[100px] md:px-[120px] gap-12 md:gap-[64px]"
      style={{ borderTop: "1px solid #1A1A1A" }}
    >
      <SectionHeader
        label="[06] // FAQ"
        title={"QUESTIONS.\nANSWERED."}
        subtitle="EVERYTHING YOU NEED TO KNOW ABOUT BLINDBID AND ENCRYPTED AUCTIONS."
      />

      <div className="flex flex-col gap-[2px] w-full max-w-[900px]">
        {faqs.map((faq, i) => (
          <div key={i} className="flex flex-col bg-[#111111]"
            style={{ borderLeft: `3px solid ${open === i ? "#9945FF" : "#2D2D2D"}` }}>
            <button
              className="flex items-center justify-between w-full p-6 md:p-[28px] text-left bg-transparent border-none cursor-pointer"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="font-grotesk text-[14px] md:text-[16px] font-bold text-[#F0EEFF] tracking-[0.5px] pr-4">
                {faq.q}
              </span>
              <span
                className="font-grotesk text-[20px] font-bold shrink-0 transition-transform duration-300"
                style={{
                  color: open === i ? "#9945FF" : "#444",
                  transform: open === i ? "rotate(45deg)" : "rotate(0deg)",
                }}
              >
                +
              </span>
            </button>
            <div
              className="overflow-hidden transition-all duration-300"
              style={{ maxHeight: open === i ? "300px" : "0px" }}
            >
              <p className="font-ibm-mono text-[12px] text-[#666] tracking-[0.5px] leading-[1.8] px-6 md:px-[28px] pb-6 md:pb-[28px]">
                {faq.a}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
