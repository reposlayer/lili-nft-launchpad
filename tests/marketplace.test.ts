import { describe, expect, it } from "vitest";
import { lamportsFromSol, solFromLamports } from "../lib/marketplace";

describe("marketplace math helpers", () => {
  it("converts SOL to lamports", () => {
    expect(lamportsFromSol(1)).toBe(1_000_000_000n);
    expect(lamportsFromSol(2.5)).toBe(2_500_000_000n);
  });

  it("converts lamports to SOL", () => {
    expect(solFromLamports(1_000_000_000)).toBe(1);
    expect(solFromLamports(5_500_000_000n)).toBe(5.5);
  });
});
