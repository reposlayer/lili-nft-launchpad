import { promises as fs } from "fs";
import path from "path";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

const SERIALIZED_KEY_LENGTH = 64;

const decodeKeypair = (raw: string): Keypair => {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Secret key is empty. Provide MARKETPLACE_AUTHORITY_SECRET_KEY or MARKETPLACE_AUTHORITY_KEYPAIR.");
  }

  const parseJsonArray = (input: string): Uint8Array | null => {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return Uint8Array.from(parsed.map((value) => Number(value)));
      }
      return null;
    } catch {
      return null;
    }
  };

  const fromCsv = (input: string): Uint8Array | null => {
    const pieces = input.split(",");
    if (pieces.length < SERIALIZED_KEY_LENGTH) {
      return null;
    }
    const bytes = pieces
      .map((piece) => piece.trim())
      .map((piece) => Number(piece))
      .filter((value) => Number.isFinite(value));
    return bytes.length === pieces.length ? Uint8Array.from(bytes) : null;
  };

  const jsonBytes = parseJsonArray(trimmed);
  if (jsonBytes) {
    return Keypair.fromSecretKey(jsonBytes);
  }

  const csvBytes = fromCsv(trimmed);
  if (csvBytes) {
    return Keypair.fromSecretKey(csvBytes);
  }

  try {
    const decoded = bs58.decode(trimmed);
    return Keypair.fromSecretKey(decoded);
  } catch (error) {
    throw new Error(
      `Failed to decode authority secret key. Ensure MARKETPLACE_AUTHORITY_SECRET_KEY is base58 or a JSON array: ${(error as Error).message}`
    );
  }
};

export const loadAuthorityKeypair = async (baseDir: string = process.cwd()): Promise<Keypair> => {
  const inlineSecret = process.env.MARKETPLACE_AUTHORITY_SECRET_KEY?.trim();
  if (inlineSecret) {
    return decodeKeypair(inlineSecret);
  }

  const keyPathEnv = process.env.MARKETPLACE_AUTHORITY_KEYPAIR?.trim();
  if (keyPathEnv) {
    const resolved = path.isAbsolute(keyPathEnv) ? keyPathEnv : path.resolve(baseDir, keyPathEnv);
    const fileContents = await fs.readFile(resolved, "utf8");
    return decodeKeypair(fileContents);
  }

  throw new Error(
    "Marketplace authority not configured. Set MARKETPLACE_AUTHORITY_SECRET_KEY or MARKETPLACE_AUTHORITY_KEYPAIR before running bootstrap scripts."
  );
};
