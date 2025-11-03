import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { Metaplex } from "@metaplex-foundation/js";
import type { JsonMetadata } from "@metaplex-foundation/js";
import { EnrichedListing, getAuctionHousePublicKey, solFromLamports } from "../lib/marketplace";

export const useMarketplaceListings = () => {
  const { connection } = useConnection();
  const [listings, setListings] = useState<EnrichedListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auctionHouseAddress = useMemo(() => getAuctionHousePublicKey(), []);

  const refresh = useCallback(async () => {
    if (!connection) {
      return;
    }

    if (!auctionHouseAddress) {
      setError("Auction House address missing. Run npm run bootstrap:devnet first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const metaplex = Metaplex.make(connection);
      const auctionHouse = await metaplex.auctionHouse().findByAddress({ address: auctionHouseAddress });
      const foundListings = await metaplex.auctionHouse().findListings({ auctionHouse });

      const detailed: EnrichedListing[] = (
        await Promise.all(
          foundListings.map(async (item) => {
            try {
              const listing = item.lazy
                ? await metaplex.auctionHouse().loadListing({ lazyListing: item })
                : item;

              if (listing.canceledAt || listing.purchaseReceiptAddress) {
                return null;
              }

              const asset = listing.asset;

              if (listing.price.currency.symbol !== "SOL") {
                console.warn(`Skipping non-SOL listing ${listing.tradeStateAddress.toBase58()}`);
                return null;
              }
              const metadataJson = (asset.json as JsonMetadata | null) ?? null;
              const priceLamports = listing.price.basisPoints.toNumber();

              return {
                id: listing.tradeStateAddress.toBase58(),
                listing,
                mintAddress: asset.address.toBase58(),
                name: asset.name,
                description: metadataJson?.description ?? null,
                image: (metadataJson?.image as string | undefined) ?? null,
                sellerAddress: listing.sellerAddress.toBase58(),
                priceSol: solFromLamports(priceLamports)
              } satisfies EnrichedListing;
            } catch (err) {
              console.warn(`Failed to load metadata for listing ${item.tradeStateAddress.toBase58()}:`, err);
              return null;
            }
          })
        )
      ).filter((value): value is EnrichedListing => Boolean(value));

      setListings(detailed);
    } catch (err) {
      setError((err as Error).message ?? "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [auctionHouseAddress, connection]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    listings,
    loading,
    error,
    refresh,
    ready: Boolean(auctionHouseAddress)
  };
};
