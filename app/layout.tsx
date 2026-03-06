import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import SolanaWalletProvider from "@/components/WalletProvider";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  title: "BLINDBID — Encrypted Sealed-Bid Auctions on Solana",
  description:
    "The first sealed-bid auction protocol on Solana. Bids are encrypted via Arcium MPC — zero collusion, zero MEV, zero leakage. Vickrey, Uniform, and First-Price auctions.",
  keywords: ["Solana", "Arcium", "blind auction", "sealed bid", "MPC", "encrypted", "NFT auction", "Vickrey"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${ibmPlexMono.variable} ${spaceGrotesk.variable} antialiased`}>
        <SolanaWalletProvider>
          {children}
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
