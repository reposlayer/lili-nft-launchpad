import type { Metadata } from "next";
import type { ReactNode } from "react";
import { marketplaceConfig } from "../lib/config";
import "./globals.css";
import { SolanaProviders } from "../components/SolanaProviders";

export const metadata: Metadata = {
  title: marketplaceConfig.title,
  description: marketplaceConfig.description
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-slate-950">
      <body className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100 antialiased">
        <SolanaProviders>{children}</SolanaProviders>
      </body>
    </html>
  );
}
