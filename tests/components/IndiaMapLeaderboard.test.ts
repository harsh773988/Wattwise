import { describe, expect, it } from "vitest";
import {
  INDIA_STATE_DIRECTORY,
  PAN_INDIA_LEADERBOARD,
} from "../../src/components/IndiaMapLeaderboard";

describe("India state and UT explorer data", () => {
  it("lists 28 states and 8 union territories without duplicate codes", () => {
    expect(INDIA_STATE_DIRECTORY).toHaveLength(36);
    expect(INDIA_STATE_DIRECTORY.filter((entry) => entry.kind === "State")).toHaveLength(28);
    expect(
      INDIA_STATE_DIRECTORY.filter((entry) => entry.kind === "Union Territory"),
    ).toHaveLength(8);
    expect(new Set(INDIA_STATE_DIRECTORY.map((entry) => entry.stateCode)).size).toBe(36);
  });

  it("keeps example metrics scoped to states in the directory", () => {
    const codes = new Set(INDIA_STATE_DIRECTORY.map((entry) => entry.stateCode));
    expect(PAN_INDIA_LEADERBOARD.every((entry) => codes.has(entry.stateCode))).toBe(true);
  });
});
