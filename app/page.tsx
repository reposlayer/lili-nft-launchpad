"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { scheduleDrop } from "../lib/launchpad";

export default function Home() {
  const wallet = useWallet();
  const [status, setStatus] = useState<string | null>(null);
  type LaunchFormState = {
    collectionName: string;
    symbol: string;
    price: string;
    supply: number;
    startDate: string;
  };

  const [formState, setFormState] = useState<LaunchFormState>({
    collectionName: "Lili Launch",
    symbol: "LILI",
    price: "1",
    supply: 100,
    startDate: new Date(Date.now() + 3600_000).toISOString().slice(0, 16)
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!wallet.publicKey) {
      setStatus("Connect a wallet first");
      return;
    }

    setStatus("Simulating drop creation...");
    try {
      const result = await scheduleDrop({
        authority: wallet.publicKey,
        collectionName: formState.collectionName,
        symbol: formState.symbol,
        price: Number(formState.price),
        maxSupply: formState.supply,
        goLiveDate: new Date(formState.startDate)
      });
      setStatus(`Generated launch config ${result.configAddress.toBase58()}`);
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-primary">Launchpad</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">Mint drop orchestrator</h1>
          <p className="mt-2 max-w-2xl text-slate-300">
            Upload art, configure mint price and schedule, and expose ready-made hooks for your front
            end. This template ships with server routes for asset upload via Bundlr/Irys and Metaplex
            Candy Machine v3 helpers.
          </p>
        </div>
        <WalletMultiButton className="w-full rounded bg-primary px-4 py-2 text-sm font-medium text-slate-950 shadow transition hover:bg-primary-dark sm:w-auto" />
      </header>

      <form
        className="grid gap-6 rounded-xl border border-white/10 bg-white/5 p-6"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col text-sm text-slate-300">
            Collection name
            <input
              className="mt-2 rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              value={formState.collectionName}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setFormState((prev) => ({ ...prev, collectionName: event.target.value }))
              }
            />
          </label>
          <label className="flex flex-col text-sm text-slate-300">
            Symbol
            <input
              className="mt-2 rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              value={formState.symbol}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setFormState((prev) => ({ ...prev, symbol: event.target.value }))
              }
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col text-sm text-slate-300">
            Price (SOL)
            <input
              className="mt-2 rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              type="number"
              min="0"
              step="0.01"
              value={formState.price}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setFormState((prev) => ({ ...prev, price: event.target.value }))
              }
            />
          </label>
          <label className="flex flex-col text-sm text-slate-300">
            Supply
            <input
              className="mt-2 rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              type="number"
              min="1"
              value={formState.supply}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setFormState((prev) => ({ ...prev, supply: Number(event.target.value) }))
              }
            />
          </label>
          <label className="flex flex-col text-sm text-slate-300">
            Go-live date
            <input
              className="mt-2 rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              type="datetime-local"
              value={formState.startDate}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setFormState((prev) => ({ ...prev, startDate: event.target.value }))
              }
            />
          </label>
        </div>

        <button className="rounded bg-primary px-4 py-2 text-sm font-semibold text-slate-950 shadow">
          Generate launch config
        </button>

        {status && <p className="text-xs text-slate-400">{status}</p>}
      </form>
    </main>
  );
}
