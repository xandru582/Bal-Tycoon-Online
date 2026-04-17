// ============================================================
// Tests for Underworld data & helpers
// ============================================================

import { describe, it, expect } from "vitest";
import {
  CRIMES,
  ITEMS,
  TIER_LABELS,
  xpForLevel,
  levelFromXp,
  trainingGain,
} from "./data";

describe("Crimes catalog", () => {
  it("has at least 15 crimes", () => {
    expect(CRIMES.length).toBeGreaterThanOrEqual(15);
  });
  it("each crime has all 5 tiers covered", () => {
    const tiers = new Set(CRIMES.map((c) => c.tier));
    [1, 2, 3, 4, 5].forEach((t) => expect(tiers.has(t as any)).toBe(true));
  });
  it("success rates are in (0, 1]", () => {
    for (const c of CRIMES) {
      expect(c.baseSuccessRate).toBeGreaterThan(0);
      expect(c.baseSuccessRate).toBeLessThanOrEqual(1);
    }
  });
  it("min credits < max credits for every crime", () => {
    for (const c of CRIMES) {
      expect(c.minCredits).toBeLessThan(c.maxCredits);
    }
  });
  it("item drops reference known items", () => {
    for (const c of CRIMES) {
      for (const drop of c.itemDrops ?? []) {
        expect(ITEMS[drop.itemId]).toBeDefined();
        expect(drop.chance).toBeGreaterThan(0);
        expect(drop.chance).toBeLessThanOrEqual(1);
      }
    }
  });
  it("higher tier crimes require higher level", () => {
    const byTier: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    for (const c of CRIMES) byTier[c.tier].push(c.requiredLevel);
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    expect(avg(byTier[1])).toBeLessThan(avg(byTier[3]));
    expect(avg(byTier[3])).toBeLessThan(avg(byTier[5]));
  });
});

describe("Items catalog", () => {
  it("every item has a positive sell value", () => {
    Object.values(ITEMS).forEach((i) => expect(i.sellValue).toBeGreaterThan(0));
  });
  it("drug items are marked addictive", () => {
    Object.values(ITEMS)
      .filter((i) => i.type === "drug")
      .forEach((i) => expect(i.addictive).toBe(true));
  });
});

describe("Tier labels", () => {
  it("covers tiers 1-5", () => {
    for (let t = 1; t <= 5; t++) {
      expect(TIER_LABELS[t]).toBeDefined();
      expect(TIER_LABELS[t].label.length).toBeGreaterThan(0);
    }
  });
});

describe("XP curve", () => {
  it("level 1 requires 0 xp", () => {
    expect(xpForLevel(1)).toBe(0);
  });
  it("monotonically increases", () => {
    for (let l = 1; l < 20; l++) {
      expect(xpForLevel(l + 1)).toBeGreaterThan(xpForLevel(l));
    }
  });
  it("levelFromXp inverts xpForLevel", () => {
    for (let l = 1; l <= 15; l++) {
      expect(levelFromXp(xpForLevel(l))).toBe(l);
      expect(levelFromXp(xpForLevel(l + 1) - 1)).toBe(l);
    }
  });
});

describe("trainingGain", () => {
  it("returns positive gain for positive energy", () => {
    expect(trainingGain(10, 10)).toBeGreaterThan(0);
  });
  it("exhibits diminishing returns as stat grows", () => {
    const lowStat  = trainingGain(5,   10);
    const highStat = trainingGain(200, 10);
    expect(lowStat).toBeGreaterThan(highStat);
  });
  it("scales with energy", () => {
    expect(trainingGain(10, 25)).toBeGreaterThan(trainingGain(10, 5));
  });
  it("never returns zero (min floor)", () => {
    expect(trainingGain(99999, 1)).toBeGreaterThan(0);
  });
});
