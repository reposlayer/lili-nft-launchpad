"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import type { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import type { Cluster } from "@solana/web3.js";
import { SUPPORTED_CLUSTERS, marketplaceConfig, getClusterEndpoint } from "../lib/config";

import "@solana/wallet-adapter-react-ui/styles.css";

type NetworkContextValue = {
  cluster: Cluster;
  endpoint: string;
  setCluster: (cluster: Cluster) => void;
  setCustomEndpoint: (endpoint: string) => void;
};

const NetworkContext = createContext<NetworkContextValue | null>(null);

const CLUSTER_STORAGE_KEY = "lili:solana-cluster";
const ENDPOINT_STORAGE_KEY = "lili:solana-endpoint";

export const useNetworkConfiguration = (): NetworkContextValue => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetworkConfiguration must be used within SolanaProviders");
  }
  return context;
};

export function SolanaProviders({ children }: { children: ReactNode }) {
  const [cluster, setCluster] = useState<Cluster>(marketplaceConfig.cluster);
  const [endpoint, setEndpoint] = useState<string>(() => getClusterEndpoint(marketplaceConfig.cluster));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedCluster = window.localStorage.getItem(CLUSTER_STORAGE_KEY) as Cluster | null;
    const storedEndpoint = window.localStorage.getItem(ENDPOINT_STORAGE_KEY);
    if (storedCluster && (SUPPORTED_CLUSTERS as readonly string[]).includes(storedCluster)) {
      setCluster(storedCluster);
      setEndpoint(storedEndpoint || getClusterEndpoint(storedCluster));
    } else if (storedEndpoint) {
      setEndpoint(storedEndpoint);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CLUSTER_STORAGE_KEY, cluster);
    window.localStorage.setItem(ENDPOINT_STORAGE_KEY, endpoint);
  }, [cluster, endpoint]);

  const handleClusterChange = useCallback((next: Cluster) => {
    setCluster(next);
    setEndpoint(getClusterEndpoint(next));
  }, []);

  const handleEndpointOverride = useCallback(
    (value: string) => {
      if (!value.trim()) {
        setEndpoint(getClusterEndpoint(cluster));
        return;
      }
      setEndpoint(value.trim());
    },
    [cluster]
  );

  const walletNetwork = cluster as WalletAdapterNetwork;
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network: walletNetwork })],
    [walletNetwork]
  );

  const value = useMemo<NetworkContextValue>(
    () => ({
      cluster,
      endpoint,
      setCluster: handleClusterChange,
      setCustomEndpoint: handleEndpointOverride
    }),
    [cluster, endpoint, handleClusterChange, handleEndpointOverride]
  );

  return (
    <NetworkContext.Provider value={value}>
      <ConnectionProvider endpoint={endpoint} config={{ commitment: "processed" }}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </NetworkContext.Provider>
  );
}
