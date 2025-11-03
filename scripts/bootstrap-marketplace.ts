#!/usr/bin/env tsx
import "dotenv/config";

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  clusterApiUrl,
  type Cluster
} from "@solana/web3.js";
import { irysStorage, keypairIdentity, Metaplex, sol, toMetaplexFile } from "@metaplex-foundation/js";
import { NATIVE_MINT } from "@solana/spl-token";
import { marketplaceConfig, SUPPORTED_CLUSTERS } from "../lib/config";
import { loadAuthorityKeypair } from "../lib/server/authority";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const args = process.argv.slice(2);

const getFlagValue = (flag: string): string | null => {
  const index = args.indexOf(flag);
  if (index === -1 || index === args.length - 1) return null;
  return args[index + 1];
};

const envCluster = process.env.MARKETPLACE_TARGET_NETWORK?.trim().toLowerCase();
const targetCluster = (() => {
  if (envCluster && SUPPORTED_CLUSTERS.includes(envCluster as Cluster)) {
    return envCluster as Cluster;
  }
  const flag = getFlagValue("--network");
  if (flag && SUPPORTED_CLUSTERS.includes(flag as Cluster)) {
    return flag as Cluster;
  }
  return marketplaceConfig.cluster;
})();

if (!SUPPORTED_CLUSTERS.includes(targetCluster)) {
  console.error(`Unsupported cluster: ${targetCluster}. Options: ${SUPPORTED_CLUSTERS.join(", ")}`);
  process.exit(1);
}

const envSeed = process.env.MARKETPLACE_SEED_DEMO?.trim().toLowerCase();
const shouldSeed = args.includes("--seed") || envSeed === "true";

const resolveRpcUrl = (cluster: Cluster): string => {
  if (cluster === marketplaceConfig.cluster && process.env.NEXT_PUBLIC_SOLANA_RPC) {
    return process.env.NEXT_PUBLIC_SOLANA_RPC;
  }
  if (cluster === "devnet") return "https://api.devnet.solana.com";
  if (cluster === "mainnet-beta") return process.env.MAINNET_RPC_URL ?? clusterApiUrl(cluster);
  return clusterApiUrl(cluster);
};

const rpcUrl = resolveRpcUrl(targetCluster);

const ensureEnvFile = async (filePath: string) => {
  try {
    await fs.access(filePath);
  } catch {
    await fs.copyFile(path.join(projectRoot, ".env.example"), filePath).catch(async () => {
      await fs.writeFile(filePath, "", "utf8");
    });
  }
};

const updateEnvFile = async (filePath: string, updates: Record<string, string>) => {
  await ensureEnvFile(filePath);
  const raw = await fs.readFile(filePath, "utf8").catch(() => "");
  const lines = raw.split(/\r?\n/);
  const map = new Map<string, string>();

  lines.forEach((line) => {
    if (!line || line.startsWith("#")) return;
    const [key, ...rest] = line.split("=");
    if (key) map.set(key.trim(), rest.join("=").trim());
  });

  Object.entries(updates).forEach(([key, value]) => {
    if (!value) return;
    map.set(key, value);
  });

  const nextContent = [
    ...Array.from(map.entries()).map(([key, value]) => `${key}=${value}`),
    ""
  ].join("\n");

  await fs.writeFile(filePath, nextContent, "utf8");
};

const run = async () => {
  console.log(`\n▶ Bootstrapping marketplace on ${targetCluster} (${rpcUrl})`);

  const authority = await loadAuthorityKeypair(projectRoot);
  console.log(`Authority: ${authority.publicKey.toBase58()}`);

  const connection = new Connection(rpcUrl, "confirmed");
  if (targetCluster === "devnet") {
    const balance = await connection.getBalance(authority.publicKey);
    if (balance < 2 * LAMPORTS_PER_SOL) {
      console.log("Requesting devnet airdrop…");
      const signature = await connection.requestAirdrop(authority.publicKey, 2 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(signature, "confirmed");
    }
  } else if (targetCluster === "mainnet-beta" && !process.env.MAINNET_RPC_URL) {
    console.warn("MAINNET_RPC_URL not set – using public Solana endpoint. Provide a dedicated RPC for production usage.");
  }

  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(authority))
    .use(
      irysStorage({
        address: process.env.BUNDLR_NODE_URL ?? marketplaceConfig.bundlrAddress,
        providerUrl: rpcUrl,
        timeout: marketplaceConfig.bundlrTimeoutMs
      })
    );

  let auctionHouseAddress = process.env.NEXT_PUBLIC_AUCTION_HOUSE_ADDRESS ?? marketplaceConfig.auctionHouseAddress;
  let auctionHouse;

  if (auctionHouseAddress) {
    try {
      const address = new PublicKey(auctionHouseAddress);
      auctionHouse = await metaplex.auctionHouse().findByAddress({ address });
      console.log(`Found existing Auction House: ${auctionHouse.address.toBase58()}`);
    } catch (error) {
      console.warn(`Failed to load existing Auction House (${auctionHouseAddress}): ${(error as Error).message}`);
      auctionHouseAddress = "";
    }
  }

  if (!auctionHouse) {
    console.log("Creating new Auction House…");
    const { auctionHouse: created } = await metaplex.auctionHouse().create({
      sellerFeeBasisPoints: marketplaceConfig.primarySaleFeeBps,
      authority,
      treasuryMint: NATIVE_MINT,
      requiresSignOff: false,
      canChangeSalePrice: true
    });
    auctionHouse = created;
    auctionHouseAddress = auctionHouse.address.toBase58();
    console.log(`Created Auction House: ${auctionHouseAddress}`);
  }

  const updates = {
    NEXT_PUBLIC_SOLANA_CLUSTER: targetCluster,
    NEXT_PUBLIC_SOLANA_RPC: rpcUrl,
    NEXT_PUBLIC_AUCTION_HOUSE_ADDRESS: auctionHouse.address.toBase58(),
    NEXT_PUBLIC_MARKETPLACE_TREASURY: auctionHouse.treasuryAccountAddress.toBase58(),
    MARKETPLACE_AUTHORITY_PUBLIC_KEY: authority.publicKey.toBase58(),
    MARKETPLACE_LAST_BOOTSTRAP: new Date().toISOString()
  } satisfies Record<string, string>;

  await updateEnvFile(path.join(projectRoot, ".env.local"), updates);
  await updateEnvFile(path.join(projectRoot, ".env.example"), updates);

  if (shouldSeed) {
    console.log("Seeding demo listing…");
    const demoName = `Demo Asset #${Math.floor(Math.random() * 10_000)}`;
    const pixel = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAukB9Wk8SGUAAAAASUVORK5CYII=",
      "base64"
    );

    const assetFile = toMetaplexFile(pixel, "demo.png");
    const { uri } = await metaplex.nfts().uploadMetadata({
      name: demoName,
      description: "Seeded by npm run bootstrap:devnet -- --seed",
      symbol: "LILI",
      image: assetFile,
      sellerFeeBasisPoints: marketplaceConfig.primarySaleFeeBps
    });

    const { nft } = await metaplex.nfts().create({
      uri,
      name: demoName,
      sellerFeeBasisPoints: marketplaceConfig.primarySaleFeeBps,
      symbol: "LILI",
      isMutable: true
    });

    await metaplex.auctionHouse().list({
      auctionHouse,
      mintAccount: nft.address,
      seller: authority.publicKey,
      price: sol(marketplaceConfig.defaultPriceSol)
    });

    console.log(`Seeded listing for ${demoName}`);
  }

  console.log("\nMarketplace bootstrap complete. Variables written to .env.local");
  console.log(`Auction House: ${auctionHouse.address.toBase58()}`);
  console.log(`Treasury: ${auctionHouse.treasuryAccountAddress.toBase58()}`);
};

run().catch((error) => {
  console.error("Bootstrap failed:", error);
  process.exit(1);
});
