"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import clsx from "clsx";

export type MintFormValues = {
  name: string;
  symbol: string;
  description: string;
  priceSol: number;
  royaltyBps: number;
  file: File | null;
};

type MintFormProps = {
  defaultValues: MintFormValues;
  loading: boolean;
  onSubmit: (values: MintFormValues) => Promise<void>;
};

export const MintForm = ({ defaultValues, loading, onSubmit }: MintFormProps) => {
  const [values, setValues] = useState<MintFormValues>(defaultValues);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: keyof MintFormValues) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.type === "number" ? Number(event.target.value) : event.target.value;
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = Array.from(event.target.files ?? []);
    setValues((prev) => ({ ...prev, file: file ?? null }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!values.file) {
      setError("Upload an image or animation file to mint.");
      return;
    }

    try {
      await onSubmit(values);
      setValues({ ...defaultValues, file: null });
    } catch (err) {
      setError((err as Error).message ?? "Failed to mint NFT");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-sm text-slate-200">
          Name
          <input
            className="mt-2 rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            value={values.name}
            onChange={handleChange("name")}
            required
          />
        </label>
        <label className="flex flex-col text-sm text-slate-200">
          Symbol
          <input
            className="mt-2 rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            value={values.symbol}
            onChange={handleChange("symbol")}
            maxLength={10}
            required
          />
        </label>
      </div>

      <label className="flex flex-col text-sm text-slate-200">
        Description
        <textarea
          className="mt-2 h-24 rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          value={values.description}
          onChange={handleChange("description")}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col text-sm text-slate-200">
          Price (SOL)
          <input
            className="mt-2 rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            type="number"
            min="0"
            step="0.01"
            value={values.priceSol}
            onChange={handleChange("priceSol")}
            required
          />
        </label>
        <label className="flex flex-col text-sm text-slate-200">
          Royalty (bps)
          <input
            className="mt-2 rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            type="number"
            min="0"
            max="10000"
            step="10"
            value={values.royaltyBps}
            onChange={handleChange("royaltyBps")}
            required
          />
        </label>
        <label className="flex flex-col text-sm text-slate-200">
          Media asset
          <input
            className="mt-2 cursor-pointer rounded border border-dashed border-white/20 bg-black/40 px-3 py-2 text-sm text-white file:mr-4 file:rounded file:border-none file:bg-primary file:px-3 file:py-2 file:text-slate-950"
            type="file"
            accept="image/*,video/*"
            onChange={handleFile}
            required
          />
        </label>
      </div>

      <button
        type="submit"
        className={clsx(
          "inline-flex items-center justify-center rounded bg-primary px-4 py-2 text-sm font-semibold text-slate-950 shadow transition",
          loading && "cursor-progress bg-slate-700 text-slate-300"
        )}
        disabled={loading}
      >
        {loading ? "Minting…" : "Mint and list"}
      </button>

      {error && <p className="text-sm text-rose-300">{error}</p>}
    </form>
  );
};
