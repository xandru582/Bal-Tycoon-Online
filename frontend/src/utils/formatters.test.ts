// ============================================================
// Tests for src/utils/formatters.ts
// Covers Issue #5 — baseline Vitest coverage for pure utilities
// ============================================================

import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatCurrencyDelta,
  formatPercent,
  formatPercentAbs,
  gameDayToDate,
  formatRelativeTime,
  getSeason,
  getSeasonIcon,
  getChangeArrow,
  getChangeEmoji,
  formatSector,
  clamp,
  lerp,
  roundTo,
  formatLargeNumber,
  hexToRgb,
  hexAlpha,
  interpolateColor,
  formatPlaytime,
  ordinal,
  formatESG,
} from "./formatters";

describe("formatCurrency", () => {
  it("formats a basic positive amount in euros", () => {
    expect(formatCurrency(1234)).toContain("€");
    expect(formatCurrency(1234)).toContain("1");
  });
  it("formats negative amount with leading minus", () => {
    expect(formatCurrency(-500)).toMatch(/^-€/);
  });
  it("shows '+' sign when showSign and positive", () => {
    expect(formatCurrency(100, false, true).startsWith("+")).toBe(true);
  });
  it("compact form produces M suffix for millions", () => {
    expect(formatCurrency(2_500_000, true)).toBe("€2.5M");
  });
  it("compact form produces K suffix for thousands", () => {
    expect(formatCurrency(45_300, true)).toBe("€45.3K");
  });
  it("compact form handles negatives", () => {
    expect(formatCurrency(-1_500_000, true)).toBe("€-1.5M");
  });
});

describe("formatCurrencyDelta", () => {
  it("prefixes positives with +", () => {
    expect(formatCurrencyDelta(100).startsWith("+")).toBe(true);
  });
  it("negatives keep their minus sign", () => {
    expect(formatCurrencyDelta(-50)).toMatch(/^-€/);
  });
});

describe("formatPercent / formatPercentAbs", () => {
  it("adds + sign for positives", () => {
    expect(formatPercent(5.2)).toBe("+5.2%");
  });
  it("negatives show minus implicitly", () => {
    expect(formatPercent(-3.7)).toBe("-3.7%");
  });
  it("zero has no sign", () => {
    expect(formatPercent(0)).toBe("0.0%");
  });
  it("respects decimals argument", () => {
    expect(formatPercent(5, 3)).toBe("+5.000%");
  });
  it("Abs variant never prefixes sign", () => {
    expect(formatPercentAbs(5.2)).toBe("5.2%");
  });
});

describe("gameDayToDate", () => {
  it("day 1 maps to 1 Jan 2025", () => {
    const d = gameDayToDate(1);
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });
  it("day 32 maps to 1 Feb 2025", () => {
    const d = gameDayToDate(32);
    expect(d.getMonth()).toBe(1);
    expect(d.getDate()).toBe(1);
  });
});

describe("formatRelativeTime", () => {
  it("0 → 'hoy'", () => expect(formatRelativeTime(0)).toBe("hoy"));
  it("1 → singular día", () => expect(formatRelativeTime(1)).toBe("hace 1 día"));
  it("3 → plural días", () => expect(formatRelativeTime(3)).toBe("hace 3 días"));
  it("8 → semana", () => expect(formatRelativeTime(8)).toContain("semana"));
  it("60 → meses", () => expect(formatRelativeTime(60)).toContain("mes"));
});

describe("seasons", () => {
  it("classifies winter for day 1 (Jan)", () => {
    expect(getSeason(1)).toBe("Invierno");
  });
  it("classifies spring for March", () => {
    // day ~70 = ~ 11 March
    expect(getSeason(70)).toBe("Primavera");
  });
  it("returns an emoji icon", () => {
    expect(getSeasonIcon(1)).toBe("❄️");
    expect(getSeasonIcon(200)).toBeTruthy();
  });
});

describe("getChangeArrow / getChangeEmoji", () => {
  it("up arrow for positive", () => expect(getChangeArrow(1)).toBe("▲"));
  it("down arrow for negative", () => expect(getChangeArrow(-1)).toBe("▼"));
  it("dash for zero", () => expect(getChangeArrow(0)).toBe("─"));
  it("rocket for strong positive", () => expect(getChangeEmoji(5)).toBe("🚀"));
  it("crash for strong negative", () => expect(getChangeEmoji(-5)).toBe("💥"));
});

describe("formatSector", () => {
  it("maps known sectors to display label", () => {
    expect(formatSector("moda")).toBe("Moda");
    expect(formatSector("materias_primas")).toBe("Materias Primas");
  });
  it("capitalizes unknown sectors", () => {
    expect(formatSector("custom")).toBe("Custom");
  });
});

describe("math helpers", () => {
  it("clamp keeps value inside bounds", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
  it("lerp interpolates", () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, 0.5)).toBe(5);
  });
  it("lerp clamps t to [0,1]", () => {
    expect(lerp(0, 10, 2)).toBe(10);
    expect(lerp(0, 10, -1)).toBe(0);
  });
  it("roundTo rounds to given decimals", () => {
    expect(roundTo(1.2345, 2)).toBe(1.23);
    expect(roundTo(1.9999, 0)).toBe(2);
  });
});

describe("formatLargeNumber", () => {
  it("uses B for billions", () => expect(formatLargeNumber(2_500_000_000)).toBe("2.5B"));
  it("uses M for millions", () => expect(formatLargeNumber(3_200_000)).toBe("3.2M"));
  it("uses K for thousands", () => expect(formatLargeNumber(4_500)).toBe("4.5K"));
  it("plain number when small", () => expect(formatLargeNumber(42)).toBe("42"));
});

describe("color helpers", () => {
  it("hexToRgb parses hex", () => {
    expect(hexToRgb("#ff0000")).toEqual([255, 0, 0]);
    expect(hexToRgb("00ff00")).toEqual([0, 255, 0]);
  });
  it("hexAlpha builds rgba string", () => {
    expect(hexAlpha("#000000", 0.5)).toBe("rgba(0, 0, 0, 0.5)");
  });
  it("interpolateColor midway", () => {
    // black→white at 0.5 should be ~rgb(128,128,128)
    const mid = interpolateColor("#000000", "#ffffff", 0.5);
    expect(mid).toMatch(/^rgb\(/);
    expect(mid).toContain("128");
  });
});

describe("formatPlaytime", () => {
  it("shows minutes only under 1h", () => {
    expect(formatPlaytime(90)).toBe("1m"); // 90s = 1.5m → floor 1
  });
  it("shows hours and minutes", () => {
    expect(formatPlaytime(3 * 3600 + 25 * 60)).toBe("3h 25m");
  });
});

describe("ordinal / ESG", () => {
  it("ordinal wraps with #", () => expect(ordinal(3)).toBe("#3"));
  it("ESG returns different labels per band", () => {
    expect(formatESG(8)).toContain("Excelente");
    expect(formatESG(5)).toContain("Bueno");
    expect(formatESG(1)).toContain("Neutro");
    expect(formatESG(-2)).toContain("Bajo");
    expect(formatESG(-5)).toContain("Crítico");
  });
});
