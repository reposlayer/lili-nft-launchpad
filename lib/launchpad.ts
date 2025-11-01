import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Metaplex } from "@metaplex-foundation/js";

export type LaunchpadConfig = {
  authority: PublicKey;
  collectionName: string;
  symbol: string;
  price: number;
  maxSupply: number;
  goLiveDate: Date;
};

export async function scheduleDrop(config: LaunchpadConfig) {
  const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC ?? "https://api.devnet.solana.com");
  const metaplex = Metaplex.make(connection);

  const configAddress = Keypair.generate().publicKey;

  return {
    configAddress,
    metaplex,
    connection
  };
}
