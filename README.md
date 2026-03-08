# BLINDBID — Sealed-Bid Auctions on Solana × Arcium MPC

> **Live:** https://blindbid.auction · **Network:** Solana Devnet

---

## What is BlindBid?

BlindBid is a trustless sealed-bid auction protocol built on Solana, powered by Arcium's Multi-Party Computation (MPC) network. Bid amounts are encrypted client-side using the Arcium MXE public key before ever touching the blockchain — no one, including the auction creator, can see individual bids until the auction closes.

---

## How It Works

1. **Create Auction** — Pay a small SOL fee to register an auction on-chain via a Memo transaction referencing the deployed BlindBid MXE program
2. **Place Sealed Bid** — Your bid is encrypted using x25519 Diffie-Hellman key exchange + RescueCipher (Arcium's ZK-friendly cipher) against the real MXE public key fetched from devnet
3. **Encrypted Commitment** — The ciphertext and commitment hash are anchored on Solana devnet, referencing the deployed MXE program ID
4. **Resolve Auction** — After the auction ends, trigger the Arcium MPC `reveal_winner` circuit which compares encrypted bids without revealing individual values

---

## Real Arcium Integration

| Component | Details |
|-----------|---------|
| **MXE Program** | `EaDV1kv2CAbGVD42mhD5okEfBAABz4n38yCAY7YiaqYE` |
| **MXE Account** | `32X9V2EjQQ4E9GtvFR3UQXd1GyLziPK9S8NuvQNYb5ML` |
| **Cluster Offset** | `456` (Arcium devnet cluster) |
| **Encryption** | x25519 key exchange + RescueCipher via `@arcium-hq/client` SDK |
| **MPC Circuits** | `submit_bid` + `reveal_winner` (compiled `.arcis` circuits) |
| **Network** | Solana Devnet |

### MXE Program Features
- `submit_bid` — Accepts encrypted bid, queues MPC computation, stores `BidRecord` on-chain
- `reveal_winner` — Compares two encrypted bids via Arcium MPC nodes, emits `WinnerRevealedEvent`
- `submit_bid_callback` — Emits `BidCommittedEvent` with encrypted commitment after MPC finalization
- `reveal_winner_callback` — Emits `WinnerRevealedEvent` with winner index after threshold decryption

---

## Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS v4
- **Blockchain:** Solana Web3.js, Wallet Adapter (Phantom)
- **MPC:** Arcium SDK (`@arcium-hq/client`), Anchor 0.32.1
- **Program:** Rust + `arcium-anchor` macros
- **Deployment:** Vercel (frontend), Solana Devnet (program)

---

## Project Structure
```
blindbid/
├── app/
│   ├── api/
│   │   ├── arcium/encrypt/    # Server-side Arcium encryption API
│   │   └── chain/
│   │       ├── auctions/      # Fetch on-chain auctions from Memo txs
│   │       └── bids/          # Fetch sealed bids per auction
│   └── (pages)/               # Next.js app router pages
├── components/
│   ├── BidModal.tsx           # Sealed bid flow with Arcium encryption
│   ├── CreateAuctionModal.tsx # Auction creation with on-chain tx
│   └── ResolveModal.tsx       # MPC reveal_winner trigger
├── lib/
│   ├── arcium.ts              # Arcium client functions
│   └── blindbid_mxe_idl.json # Deployed program IDL
└── program/
    ├── src/lib.rs             # Anchor program (Solana smart contract)
    ├── circuits.rs            # Arcium MPC circuits (submit_bid, reveal_winner)
    ├── Anchor.toml            # Anchor config
    └── Arcium.toml            # Arcium MXE config
```

---

## Running Locally
```bash
git clone https://github.com/addnad/blindbid
cd blindbid
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and connect a Phantom wallet on Solana Devnet.

---

## Deployed Program

The BlindBid MXE program is deployed and verified on Solana Devnet:

- [View Program on Solana Explorer](https://explorer.solana.com/address/EaDV1kv2CAbGVD42mhD5okEfBAABz4n38yCAY7YiaqYE?cluster=devnet)
- [View MXE Account](https://explorer.solana.com/address/32X9V2EjQQ4E9GtvFR3UQXd1GyLziPK9S8NuvQNYb5ML?cluster=devnet)

---

## Team

Built for the **Arcium RTG Hackathon** by @1stbernice
