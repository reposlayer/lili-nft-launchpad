██╗     ██╗██╗     ██╗     ██████╗██╗     ██╗
██║     ██║██║     ██║    ██╔════╝██║     ██║
██║     ██║██║     ██║    ██║     ██║     ██║
██║     ██║██║     ██║    ██║     ██║     ██║
███████╗██║███████╗██║    ╚██████╗███████╗██║
╚══════╝╚═╝╚══════╝╚═╝     ╚═════╝╚══════╝╚═╝


# NFT Launchpad Starter

Next.js App Router template for orchestrating Solana NFT drops. Ships with wallet connect UI, drop configuration form, and helper utilities for integrating Bundlr uploads + Metaplex Candy Machine v3 flows.

## Quickstart

```bash
pnpm install
pnpm dev
```

Configure `.env.local`:

```env
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_BUNDLR=https://node1.bundlr.network
authority key material (handled via wallet adapter)
```

## Features

- Phantom + Solflare wallet adapters
- Launch configuration form for price, supply, and go-live timing
- `lib/launchpad.ts` stub for wiring Metaplex actions
- Tailwind CSS styling and ready-to-ship layout
- Extensible API routes for asset uploads and allowlist management
