"use client";

import Image from "next/image";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import clsx from "clsx";
import { marketplaceConfig, formatCurrency } from "../lib/config";
import { EnrichedListing } from "../lib/marketplace";

type ListingGridProps = {
  listings: EnrichedListing[];
  loading: boolean;
  onPurchase: (listing: EnrichedListing) => Promise<void>;
  purchasingId: string | null;
  purchasesEnabled: boolean;
};

export const ListingGrid = ({ listings, loading, onPurchase, purchasingId, purchasesEnabled }: ListingGridProps) => {
  if (!marketplaceConfig.auctionHouseAddress) {
    return (
      <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-200">
        Auction House address is not configured. Run <code>npm run bootstrap:devnet</code> to generate one and update
        <code>.env.local</code>.
      </div>
    );
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Loading active listings…</p>;
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-white/5 bg-white/5 p-10 text-center">
        <p className="text-lg font-medium text-white">No listings yet</p>
        <p className="max-w-lg text-sm text-slate-400">
          Mint an NFT with the form above to seed the marketplace or run <code>npm run bootstrap:devnet -- --seed</code> to
          generate demo assets automatically.
        </p>
        <WalletMultiButton className="rounded bg-primary px-4 py-2 text-sm font-semibold text-slate-950 shadow" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((item) => (
        <article
          key={item.id}
          className="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 shadow-lg shadow-black/30 transition hover:border-primary/70"
        >
          <div className="relative aspect-square w-full bg-slate-900">
            {item.image ? (
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover transition duration-300 group-hover:scale-105"
                sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-500">No preview</div>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-3 p-5">
            <header className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                <p className="text-xs text-slate-400">Seller: {item.sellerAddress.slice(0, 4)}…{item.sellerAddress.slice(-4)}</p>
              </div>
              <span className="rounded-full border border-primary/60 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {formatCurrency(item.priceSol)}
              </span>
            </header>
            {item.description && <p className="flex-1 text-sm text-slate-300">{item.description}</p>}
            <button
              type="button"
              onClick={() => onPurchase(item)}
              disabled={purchasingId === item.id || !purchasesEnabled}
              className={clsx(
                "mt-auto w-full rounded-lg px-4 py-2 text-sm font-semibold transition",
                purchasingId === item.id
                  ? "cursor-progress bg-slate-700 text-slate-300"
                  : purchasesEnabled
                  ? "bg-primary text-slate-950 shadow hover:bg-primary-dark"
                  : "cursor-not-allowed border border-white/10 bg-slate-800 text-slate-500"
              )}
            >
              {purchasingId === item.id
                ? "Processing…"
                : purchasesEnabled
                ? `Buy for ${formatCurrency(item.priceSol)}`
                : "Purchases disabled"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
};
