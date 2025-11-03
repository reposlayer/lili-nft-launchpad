"use client";

import { useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { sol, toMetaplexFileFromBrowser } from "@metaplex-foundation/js";
import { MintForm, type MintFormValues } from "../components/MintForm";
import { ListingGrid } from "../components/ListingGrid";
import { NetworkSelector } from "../components/NetworkSelector";
import { useMetaplex } from "../hooks/useMetaplex";
import { useMarketplaceListings } from "../hooks/useMarketplaceListings";
import { marketplaceConfig, formatCurrency } from "../lib/config";
import { getAuctionHousePublicKey } from "../lib/marketplace";

export default function Home() {
  const { publicKey, connected } = useWallet();
  const metaplex = useMetaplex();
  const { listings, loading, error, refresh, ready } = useMarketplaceListings();
  const [minting, setMinting] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const defaultMintValues: MintFormValues = {
    name: `${marketplaceConfig.title} #${Math.floor(Math.random() * 10_000)}`,
    symbol: "LILI",
    description: marketplaceConfig.description,
    priceSol: marketplaceConfig.defaultPriceSol,
    royaltyBps: marketplaceConfig.primarySaleFeeBps,
    file: null
  };

  const handleMint = async (values: MintFormValues) => {
    if (!connected || !publicKey) {
      throw new Error("Connect a wallet before minting.");
    }
    if (!metaplex) {
      throw new Error("Metaplex client not ready yet.");
    }
    const auctionHouseAddress = getAuctionHousePublicKey();
    if (!auctionHouseAddress) {
      throw new Error("Auction House not configured. Run npm run bootstrap:devnet first.");
    }
    setMinting(true);

    try {
      const assetFile = values.file ? await toMetaplexFileFromBrowser(values.file) : null;
      if (!assetFile) {
        throw new Error("Upload an asset to mint.");
      }

      const { uri } = await metaplex.nfts().uploadMetadata({
        name: values.name,
        description: values.description,
        symbol: values.symbol,
        image: assetFile,
        sellerFeeBasisPoints: values.royaltyBps
      });

      const { nft } = await metaplex.nfts().create({
        uri,
        name: values.name,
        sellerFeeBasisPoints: values.royaltyBps,
        symbol: values.symbol,
        isMutable: true
      });

      const auctionHouse = await metaplex.auctionHouse().findByAddress({ address: auctionHouseAddress });

      await metaplex.auctionHouse().list({
        auctionHouse,
        mintAccount: nft.address,
        seller: publicKey,
        price: sol(values.priceSol)
      });

      setBanner(`Listed ${values.name} for ${formatCurrency(values.priceSol)}.`);
      await refresh();
    } finally {
      setMinting(false);
    }
  };

  const handlePurchase = async (listing: (typeof listings)[number]) => {
    if (!marketplaceConfig.enablePurchases) {
      setBanner("Purchases are disabled via configuration.");
      return;
    }
    if (!connected || !publicKey) {
      setBanner("Connect a wallet before purchasing.");
      return;
    }
    if (!metaplex) {
      setBanner("Metaplex client is not ready yet. Try again in a moment.");
      return;
    }
    const auctionHouseAddress = getAuctionHousePublicKey();
    if (!auctionHouseAddress) {
      setBanner("Auction House not configured. Run npm run bootstrap:devnet first.");
      return;
    }

    setPurchasingId(listing.id);

    try {
      const auctionHouse = await metaplex.auctionHouse().findByAddress({ address: auctionHouseAddress });
      const { bid } = await metaplex.auctionHouse().bid({
        auctionHouse,
        mintAccount: listing.listing.asset.address,
        seller: listing.listing.sellerAddress,
        tokenAccount: listing.listing.asset.token.address,
        price: listing.listing.price
      });

      await metaplex.auctionHouse().executeSale({ auctionHouse, listing: listing.listing, bid });
      setBanner(`Purchase successful. You now own ${listing.name}.`);
      await refresh();
    } catch (err) {
      setBanner((err as Error).message ?? "Failed to complete purchase.");
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div className="space-y-4">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-primary">
            Lili Launchpad
            <NetworkSelector />
          </p>
          <h1 className="text-4xl font-semibold text-white">{marketplaceConfig.title}</h1>
          <p className="max-w-2xl text-sm text-slate-300">{marketplaceConfig.description}</p>
        </div>
        <WalletMultiButton className="w-full rounded-full bg-primary px-5 py-2 text-sm font-semibold text-slate-950 shadow transition hover:bg-primary-dark sm:w-auto" />
      </header>

      {banner && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
          {banner}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      <section className="grid gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Mint &amp; list a fixed-price NFT</h2>
          <p className="text-sm text-slate-400">
            Assets mint to the connected wallet. Listings post directly to the configured Metaplex Auction House.
          </p>
        </div>
        <MintForm defaultValues={defaultMintValues} loading={minting} onSubmit={handleMint} />
      </section>

      <section className="grid gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Marketplace listings</h2>
            <p className="text-sm text-slate-400">
              Powered by Metaplex Auction House —{" "}
              {ready ? "live data fetched directly from Solana." : "configure your marketplace to load listings."}
            </p>
          </div>
        </div>
        <ListingGrid
          listings={listings}
          loading={loading}
          onPurchase={handlePurchase}
          purchasingId={purchasingId}
          purchasesEnabled={marketplaceConfig.enablePurchases}
        />
      </section>
    </main>
  );
}
