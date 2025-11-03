import { useMemo } from "react";
import { Metaplex, irysStorage, walletAdapterIdentity } from "@metaplex-foundation/js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { marketplaceConfig } from "../lib/config";

export const useMetaplex = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  return useMemo(() => {
    if (!connection) {
      return null;
    }

    const instance = Metaplex.make(connection)
      .use(walletAdapterIdentity(wallet))
      .use(
        irysStorage({
          address: marketplaceConfig.bundlrAddress,
          providerUrl: marketplaceConfig.rpcUrl,
          timeout: marketplaceConfig.bundlrTimeoutMs
        })
      );

    return instance;
  }, [connection, wallet]);
};
