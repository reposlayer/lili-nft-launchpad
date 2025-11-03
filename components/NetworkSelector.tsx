"use client";

import type { Cluster } from "@solana/web3.js";
import clsx from "clsx";
import { SUPPORTED_CLUSTERS } from "../lib/config";
import { useNetworkConfiguration } from "./SolanaProviders";

const LABELS: Record<Cluster, string> = {
  devnet: "Devnet",
  "mainnet-beta": "Mainnet",
  testnet: "Testnet"
};

export const NetworkSelector = () => {
  const { cluster, setCluster } = useNetworkConfiguration();

  const handleSelect = (next: Cluster) => () => {
    setCluster(next);
  };

  return (
    <div className="inline-flex overflow-hidden rounded-full border border-white/10 bg-white/5 p-1 text-xs">
      {SUPPORTED_CLUSTERS.map((item) => (
        <button
          key={item}
          type="button"
          onClick={handleSelect(item)}
          className={clsx(
            "px-3 py-1 transition",
            item === cluster ? "bg-primary text-slate-950" : "text-slate-300 hover:text-white"
          )}
          aria-label={`Switch to ${LABELS[item]}`}
        >
          {LABELS[item]}
        </button>
      ))}
    </div>
  );
};
