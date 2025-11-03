
# Lili Metaplex NFT Marketplace

Next.js App Router marketplace scaffold built on top of the Lili CLI. Mint and list fixed-price NFTs with Metaplex Auction House, manage flows on Solana devnet by default, and deploy to Vercel with production hardening out of the box.

## Stack

- Next.js App Router + React 18 + Tailwind CSS
- Metaplex JS SDK (Auction House + NFT modules)
- Wallet Adapter (Phantom, Solflare) with configurable cluster switching
- Bundlr/IPFS upload pipeline for metadata + assets
- Vitest unit tests and Playwright smoke tests

## Prerequisites

- Node.js 18+
- Solana CLI (for devnet airdrops)
- Lili CLI configured with a wallet (default network = devnet)
- Authority secret key available via `MARKETPLACE_AUTHORITY_SECRET_KEY` or `MARKETPLACE_AUTHORITY_KEYPAIR`

## Quickstart

```bash
npm install
npm run bootstrap:devnet  # creates Auction House, seeds env
npm run dev
```

Open http://localhost:3000 and connect a wallet to mint + list NFTs immediately.

## Environment configuration

`npm run bootstrap:devnet` prepares `.env.local`. If you prefer to configure manually, copy the template:

```bash
cp .env.example .env.local
```

Key variables:

```
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_AUCTION_HOUSE_ADDRESS=<populated by bootstrap script>
NEXT_PUBLIC_MARKETPLACE_TREASURY=<populated by bootstrap script>
MARKETPLACE_AUTHORITY_SECRET_KEY=<base58 or JSON array>
MAINNET_RPC_URL=<https provider if deploying on mainnet-beta>
```

For Vercel deployments set the same variables in the dashboard (Project → Settings → Environment Variables).

## CLI integration

The template is registered in `templates/manifest.json` and fully automated by `lili`. Run:

```bash
lili
# Templates → Featured Templates → NFT Launchpad
```

The bootstrap phase will:

1. Detect your configured Lili wallet (devnet by default)
2. Ensure sufficient SOL balance (requests airdrop on devnet)
3. Create a Metaplex Auction House with the provided authority
4. Persist the new addresses into `.env.local` / `.env.example`
5. Optionally seed demo listings when `--seed` is appended

## Available scripts

| Script | Purpose |
| ------ | ------- |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run bootstrap:devnet` | Provision Auction House on devnet |
| `npm run bootstrap:mainnet` | Generate env for mainnet-beta (manual funding required) |
| `npm run test` | Vitest unit suite |
| `npm run test:e2e` | Playwright smoke test |
| `npm run verify` | Lint + typecheck + unit tests |

## Minting & listing flow

1. Connect Phantom/Solflare
2. Upload media + metadata via the Mint form
3. The client uploads assets to Bundlr/IPFS and mints using Metaplex
4. The minted NFT is listed on the configured Auction House at a fixed price
5. Purchases are executed through Metaplex `bid` + `executeSale`

Purchasing can be toggled via `NEXT_PUBLIC_ENABLE_PURCHASES=false`.

## Testing

```bash
npm run test        # Vitest unit tests
npm run test:e2e    # Playwright smoke
npm run verify      # Lint + typecheck + unit coverage
```

Playwright installs browsers during `npm run prepare` (triggered automatically).

## Deploying to Vercel

1. `npm run build` locally to verify
2. Push to GitHub and import the repo into Vercel
3. Configure env vars (same as `.env.local`)
4. Enable the edge runtime if desired – the template runs on standard Node runtime by default

## Troubleshooting

- **Auction House not configured** – rerun `npm run bootstrap:devnet`
- **Bundlr upload failures** – ensure Bundlr devnet node is reachable or switch to Shadow Drive via `SHDW_DRIVE_API_KEY`
- **Low SOL balance** – run `lili → Wallet → Request Airdrop`

## License

MIT
