// ============================================================
// NEXUS: Underworld — Zustand store (API-backed, no localStorage).
// All gameplay state is server-authoritative (see backend
// UnderworldService). This store only holds a cached snapshot
// and sends RPCs to the backend.
// ============================================================

import { create } from "zustand";
import api from "../lib/api";
import type { Stat } from "../core/underworld/data";
import { levelFromXp, xpForLevel } from "../core/underworld/data";
import { useGameStore } from "./gameStore";

// ── Constants kept in sync with backend ──────────────────
export const NERVE_MAX = 100;
export const ENERGY_MAX = 100;
export const NERVE_REGEN_SEC = 300;
export const ENERGY_REGEN_SEC = 180;

export interface TempStatBuff {
  stat: Stat;
  value: number;
  expiresAt: number;
}

/** Snapshot returned by GET /underworld/state. */
export interface UnderworldSnapshot {
  nerve: number;
  nerveUpdatedAt: number;
  energy: number;
  energyUpdatedAt: number;
  xp: number;
  level: number;
  stats: Record<Stat, number>;
  effectiveStats: Record<Stat, number>;
  tempBuffs: TempStatBuff[];
  jailUntil: number | null;
  inventory: Record<string, number>;
  crimesCommitted: number;
  crimesFailed: number;
  totalLoot: number;
}

// Result shapes returned by the API alongside each mutation
export type CrimeResult =
  | { kind: "success"; credits: number; xp: number; item?: string }
  | { kind: "failure"; jailSeconds: number }
  | { kind: "blocked"; reason: string };

export type TrainResult =
  | { kind: "ok"; stat: Stat; gained: number }
  | { kind: "blocked"; reason: string };

export type ItemUseResult =
  | { kind: "ok"; message: string }
  | { kind: "blocked"; reason: string };

export type ItemSellResult =
  | { kind: "ok"; received: number }
  | { kind: "blocked"; reason: string };

interface UnderworldStore {
  snapshot: UnderworldSnapshot | null;
  loading: boolean;
  error: string | null;
  inFlight: boolean;

  fetchState: () => Promise<void>;
  commitCrime: (crimeId: string) => Promise<CrimeResult | null>;
  trainStat: (stat: Stat, energy: number) => Promise<TrainResult | null>;
  useItem: (itemId: string) => Promise<ItemUseResult | null>;
  sellItem: (itemId: string) => Promise<ItemSellResult | null>;
}

/** When the server credits the main balance, optimistically reflect it locally. */
function bumpLocalCredits(amount: number) {
  if (amount <= 0) return;
  const g = useGameStore.getState();
  useGameStore.setState({
    credits: g.credits + amount,
    totalCreditsEarned: g.totalCreditsEarned + amount,
  });
}

export const useUnderworldStore = create<UnderworldStore>((set, get) => ({
  snapshot: null,
  loading: false,
  error: null,
  inFlight: false,

  fetchState: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const { data } = await api.get<UnderworldSnapshot>("/underworld/state");
      set({ snapshot: data, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err?.response?.data?.error ?? err.message ?? "Error de red" });
    }
  },

  commitCrime: async (crimeId: string) => {
    if (get().inFlight) return null;
    set({ inFlight: true });
    try {
      const { data } = await api.post<{ state: UnderworldSnapshot; result: CrimeResult }>(
        "/underworld/crime",
        { crimeId }
      );
      if (data.result.kind === "success") bumpLocalCredits(data.result.credits);
      set({ snapshot: data.state, inFlight: false });
      return data.result;
    } catch (err: any) {
      set({ inFlight: false, error: err?.response?.data?.error ?? err.message });
      return { kind: "blocked", reason: err?.response?.data?.error ?? "Error de red" };
    }
  },

  trainStat: async (stat: Stat, energy: number) => {
    if (get().inFlight) return null;
    set({ inFlight: true });
    try {
      const { data } = await api.post<{ state: UnderworldSnapshot; result: TrainResult }>(
        "/underworld/train",
        { stat, energy }
      );
      set({ snapshot: data.state, inFlight: false });
      return data.result;
    } catch (err: any) {
      set({ inFlight: false, error: err?.response?.data?.error ?? err.message });
      return { kind: "blocked", reason: err?.response?.data?.error ?? "Error de red" };
    }
  },

  useItem: async (itemId: string) => {
    if (get().inFlight) return null;
    set({ inFlight: true });
    try {
      const { data } = await api.post<{ state: UnderworldSnapshot; result: ItemUseResult }>(
        "/underworld/item/use",
        { itemId }
      );
      set({ snapshot: data.state, inFlight: false });
      return data.result;
    } catch (err: any) {
      set({ inFlight: false, error: err?.response?.data?.error ?? err.message });
      return { kind: "blocked", reason: err?.response?.data?.error ?? "Error de red" };
    }
  },

  sellItem: async (itemId: string) => {
    if (get().inFlight) return null;
    set({ inFlight: true });
    try {
      const { data } = await api.post<{ state: UnderworldSnapshot; result: ItemSellResult }>(
        "/underworld/item/sell",
        { itemId }
      );
      if (data.result.kind === "ok") bumpLocalCredits(data.result.received);
      set({ snapshot: data.state, inFlight: false });
      return data.result;
    } catch (err: any) {
      set({ inFlight: false, error: err?.response?.data?.error ?? err.message });
      return { kind: "blocked", reason: err?.response?.data?.error ?? "Error de red" };
    }
  },
}));

// ── Derived read helpers (pure, for UI) ──────────────────

export function getLiveNerve(snap: UnderworldSnapshot | null): number {
  if (!snap) return 0;
  if (snap.nerve >= NERVE_MAX) return NERVE_MAX;
  const elapsed = Math.floor((Date.now() - snap.nerveUpdatedAt) / 1000);
  const gained = Math.floor(elapsed / NERVE_REGEN_SEC);
  return Math.min(NERVE_MAX, snap.nerve + gained);
}

export function getLiveEnergy(snap: UnderworldSnapshot | null): number {
  if (!snap) return 0;
  if (snap.energy >= ENERGY_MAX) return ENERGY_MAX;
  const elapsed = Math.floor((Date.now() - snap.energyUpdatedAt) / 1000);
  const gained = Math.floor(elapsed / ENERGY_REGEN_SEC);
  return Math.min(ENERGY_MAX, snap.energy + gained);
}

export function xpProgress(xp: number): { level: number; current: number; needed: number; pct: number } {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const current = xp - base;
  const needed = next - base;
  return { level, current, needed, pct: needed > 0 ? current / needed : 0 };
}
