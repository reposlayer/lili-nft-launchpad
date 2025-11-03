import { clusterApiUrl, type Cluster } from "@solana/web3.js";
import { z } from "zod";

const clusterSchema = z.enum(["devnet", "testnet", "mainnet-beta"]);

type EnvShape = {
  NEXT_PUBLIC_SOLANA_CLUSTER?: string;
  NEXT_PUBLIC_SOLANA_RPC?: string;
  NEXT_PUBLIC_MARKETPLACE_TITLE?: string;
  NEXT_PUBLIC_MARKETPLACE_DESCRIPTION?: string;
  NEXT_PUBLIC_MARKETPLACE_CURRENCY_SYMBOL?: string;
  NEXT_PUBLIC_DEFAULT_PRICE_SOL?: string;
  NEXT_PUBLIC_PRIMARY_SALE_FEE_BPS?: string;
  NEXT_PUBLIC_MARKETPLACE_TREASURY?: string;
  NEXT_PUBLIC_AUCTION_HOUSE_ADDRESS?: string;
  NEXT_PUBLIC_SUPPORT_EMAIL?: string;
  NEXT_PUBLIC_ENABLE_PURCHASES?: string;
  NEXT_PUBLIC_BUNDLR_NODE_URL?: string;
  NEXT_PUBLIC_BUNDLR_TIMEOUT_MS?: string;
};

const rawEnv: EnvShape = {
  NEXT_PUBLIC_SOLANA_CLUSTER: process.env.NEXT_PUBLIC_SOLANA_CLUSTER,
  NEXT_PUBLIC_SOLANA_RPC: process.env.NEXT_PUBLIC_SOLANA_RPC,
  NEXT_PUBLIC_MARKETPLACE_TITLE: process.env.NEXT_PUBLIC_MARKETPLACE_TITLE,
  NEXT_PUBLIC_MARKETPLACE_DESCRIPTION: process.env.NEXT_PUBLIC_MARKETPLACE_DESCRIPTION,
  NEXT_PUBLIC_MARKETPLACE_CURRENCY_SYMBOL: process.env.NEXT_PUBLIC_MARKETPLACE_CURRENCY_SYMBOL,
  NEXT_PUBLIC_DEFAULT_PRICE_SOL: process.env.NEXT_PUBLIC_DEFAULT_PRICE_SOL,
  NEXT_PUBLIC_PRIMARY_SALE_FEE_BPS: process.env.NEXT_PUBLIC_PRIMARY_SALE_FEE_BPS,
  NEXT_PUBLIC_MARKETPLACE_TREASURY: process.env.NEXT_PUBLIC_MARKETPLACE_TREASURY,
  NEXT_PUBLIC_AUCTION_HOUSE_ADDRESS: process.env.NEXT_PUBLIC_AUCTION_HOUSE_ADDRESS,
  NEXT_PUBLIC_SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
  NEXT_PUBLIC_ENABLE_PURCHASES: process.env.NEXT_PUBLIC_ENABLE_PURCHASES,
  NEXT_PUBLIC_BUNDLR_NODE_URL: process.env.NEXT_PUBLIC_BUNDLR_NODE_URL,
  NEXT_PUBLIC_BUNDLR_TIMEOUT_MS: process.env.NEXT_PUBLIC_BUNDLR_TIMEOUT_MS
};

const envSchema = z.object({
  NEXT_PUBLIC_SOLANA_CLUSTER: clusterSchema.optional(),
  NEXT_PUBLIC_SOLANA_RPC: z.string().url().optional(),
  NEXT_PUBLIC_MARKETPLACE_TITLE: z.string().optional(),
  NEXT_PUBLIC_MARKETPLACE_DESCRIPTION: z.string().optional(),
  NEXT_PUBLIC_MARKETPLACE_CURRENCY_SYMBOL: z.string().optional(),
  NEXT_PUBLIC_DEFAULT_PRICE_SOL: z.string().optional(),
  NEXT_PUBLIC_PRIMARY_SALE_FEE_BPS: z.string().optional(),
  NEXT_PUBLIC_MARKETPLACE_TREASURY: z.string().optional(),
  NEXT_PUBLIC_AUCTION_HOUSE_ADDRESS: z.string().optional(),
  NEXT_PUBLIC_SUPPORT_EMAIL: z.string().optional(),
  NEXT_PUBLIC_ENABLE_PURCHASES: z.string().optional(),
  NEXT_PUBLIC_BUNDLR_NODE_URL: z.string().optional(),
  NEXT_PUBLIC_BUNDLR_TIMEOUT_MS: z.string().optional()
});

const parsed = envSchema.parse(rawEnv);

const safeCluster: Cluster = (() => {
  const incoming = parsed.NEXT_PUBLIC_SOLANA_CLUSTER ?? "devnet";
  const result = clusterSchema.safeParse(incoming);
  return result.success ? result.data : "devnet";
})();

const rpcUrl = parsed.NEXT_PUBLIC_SOLANA_RPC ?? clusterApiUrl(safeCluster);

const parseNumber = (value: string | undefined, fallback: number) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const primarySaleFeeBps = Math.max(0, Math.min(10_000, Math.round(parseNumber(parsed.NEXT_PUBLIC_PRIMARY_SALE_FEE_BPS, 0))));

export const SUPPORTED_CLUSTERS: Cluster[] = ["devnet", "testnet", "mainnet-beta"];

export const marketplaceConfig = {
  cluster: safeCluster,
  rpcUrl,
  title: parsed.NEXT_PUBLIC_MARKETPLACE_TITLE ?? "Lili NFT Marketplace",
  description:
    parsed.NEXT_PUBLIC_MARKETPLACE_DESCRIPTION ??
    "Launch, list, and sell fixed-price NFTs with Metaplex and Lili CLI.",
  currencySymbol: parsed.NEXT_PUBLIC_MARKETPLACE_CURRENCY_SYMBOL ?? "◎",
  defaultPriceSol: parseNumber(parsed.NEXT_PUBLIC_DEFAULT_PRICE_SOL, 1),
  primarySaleFeeBps,
  treasuryAddress: parsed.NEXT_PUBLIC_MARKETPLACE_TREASURY ?? "",
  auctionHouseAddress: parsed.NEXT_PUBLIC_AUCTION_HOUSE_ADDRESS ?? "",
  supportEmail: parsed.NEXT_PUBLIC_SUPPORT_EMAIL ?? "",
  enablePurchases: parsed.NEXT_PUBLIC_ENABLE_PURCHASES !== "false",
  bundlrAddress: parsed.NEXT_PUBLIC_BUNDLR_NODE_URL ?? "https://node1.bundlr.network",
  bundlrTimeoutMs: parseNumber(parsed.NEXT_PUBLIC_BUNDLR_TIMEOUT_MS, 60_000)
};

export const formatCurrency = (value: number) => {
  return `${marketplaceConfig.currencySymbol}${value.toLocaleString(undefined, {
    minimumFractionDigits: value < 1 ? 2 : 0,
    maximumFractionDigits: 2
  })}`;
};

export const getClusterEndpoint = (cluster: Cluster): string => {
  if (cluster === safeCluster && parsed.NEXT_PUBLIC_SOLANA_RPC) {
    return parsed.NEXT_PUBLIC_SOLANA_RPC;
  }
  return clusterApiUrl(cluster);
};
