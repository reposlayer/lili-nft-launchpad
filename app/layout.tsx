import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SolanaProviders } from "../components/SolanaProviders";

export const metadata: Metadata = {
  title: "NFT Launchpad Starter",
  description: "Upload assets, mint NFTs, and schedule drops"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SolanaProviders>{children}</SolanaProviders>
      </body>
    </html>
  );
}
