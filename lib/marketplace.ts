import type { Listing } from "@metaplex-foundation/js";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { marketplaceConfig } from "./config";

export type ListingView = {
  id: string;
  mintAddress: string;
  name: string;
  description: string | null;
  image: string | null;
  sellerAddress: string;
  priceSol: number;
};

export type EnrichedListing = ListingView & {
  listing: Listing;
};

export const lamportsFromSol = (value: number): bigint => {
  const parsed = Number.isFinite(value) ? value : marketplaceConfig.defaultPriceSol;
  return BigInt(Math.round(parsed * LAMPORTS_PER_SOL));
};

export const solFromLamports = (value: number | bigint): number => {
  const lamports = typeof value === "bigint" ? Number(value) : value;
  return lamports / LAMPORTS_PER_SOL;
};

export const getAuctionHousePublicKey = (): PublicKey | null => {
  const address = marketplaceConfig.auctionHouseAddress?.trim();
  if (!address) {
    return null;
  }
  try {
    return new PublicKey(address);
  } catch {
    return null;
  }
};

export const getTreasuryPublicKey = (): PublicKey | null => {
  const address = marketplaceConfig.treasuryAddress?.trim();
  if (!address) {
    return null;
  }
  try {
    return new PublicKey(address);
  } catch {
    return null;
  }
};
