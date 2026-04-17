// ============================================================
// NEXUS: Underworld — Zustand store
// Nerve / Energy / Stats / Crimes / Jail / Inventory
// Persisted to localStorage (no backend required for v1).
// ============================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Stat } from "../core/underworld/data";
import {
  CRIMES,
  ITEMS,
  xpForLevel,
  levelFromXp,
  trainingGain,
} from "../core/underworld/data";

// ── Constants ─────────────────────────────────────────────
export const NERVE_MAX = 100;
export const ENERGY_MAX = 100;
export const NERVE_REGEN_SEC = 300;  // 1 nerve every 5 min
export const ENERGY_REGEN_SEC = 180; // 1 energy every 3 min

export interface TempStatBuff {
  stat: Stat;
  value: number;
  expiresAt: number; // epoch ms
}

export interface UnderworldState {
  // Regenerating resources (stored as value+timestamp; readers compute current)
  nerve: number;
  nerveUpdatedAt: number;
  energy: number;
  energyUpdatedAt: number;

  // Progression
  xp: number;
  stats: Record<Stat, number>;
  tempBuffs: TempStatBuff[];

  // Jail
  jailUntil: number | null; // epoch ms

  // Inventory: itemId → quantity
  inventory: Record<string, number>;

  // Stats tracking
  crimesCommitted: number;
  crimesFailed: number;
  totalLoot: number;

  // Actions
  commitCrime: (crimeId: string, creditsGrant: (n: number) => void) =>
    | { success: true; credits: number; xp: number; item?: string }
    | { success: false; jailSeconds: number }
    | { blocked: string };
  trainStat: (stat: Stat, energySpent: number) => { gained: number } | { blocked: string };
  useItem: (itemId: string) => { ok: true; message: string } | { ok: false; reason: string };
  sellItem: (itemId: string, credits: (n: number) => void) => { ok: true; received: number } | { ok: false };
  refreshDerived: () => void; // recompute nerve/energy from timestamps
  reset: () => void;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function computeRegen(current: number, updatedAt: number, max: number, regenSec: number, now = Date.now()) {
  if (current >= max) return { value: max, updatedAt: now };
  const elapsed = Math.floor((now - updatedAt) / 1000);
  const gained = Math.floor(elapsed / regenSec);
  if (gained === 0) return { value: current, updatedAt };
  const newVal = Math.min(max, current + gained);
  const consumed = gained * regenSec;
  return { value: newVal, updatedAt: updatedAt + consumed * 1000 };
}

export function getCurrentNerve(s: Pick<UnderworldState, "nerve" | "nerveUpdatedAt">): number {
  return computeRegen(s.nerve, s.nerveUpdatedAt, NERVE_MAX, NERVE_REGEN_SEC).value;
}
export function getCurrentEnergy(s: Pick<UnderworldState, "energy" | "energyUpdatedAt">): number {
  return computeRegen(s.energy, s.energyUpdatedAt, ENERGY_MAX, ENERGY_REGEN_SEC).value;
}

export function getEffectiveStats(s: Pick<UnderworldState, "stats" | "tempBuffs">): Record<Stat, number> {
  const now = Date.now();
  const out: Record<Stat, number> = { ...s.stats };
  for (const b of s.tempBuffs) {
    if (b.expiresAt > now) out[b.stat] = (out[b.stat] ?? 0) + b.value;
  }
  return out;
}

export function getLevel(xp: number): number {
  return levelFromXp(xp);
}
export function xpProgress(xp: number): { level: number; current: number; needed: number; pct: number } {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const current = xp - base;
  const needed = next - base;
  return { level, current, needed, pct: needed > 0 ? current / needed : 0 };
}

export const useUnderworldStore = create<UnderworldState>()(
  persist(
    (set, get) => ({
      nerve: NERVE_MAX,
      nerveUpdatedAt: Date.now(),
      energy: ENERGY_MAX,
      energyUpdatedAt: Date.now(),
      xp: 0,
      stats: { strength: 1, defense: 1, speed: 1, dexterity: 1 },
      tempBuffs: [],
      jailUntil: null,
      inventory: {},
      crimesCommitted: 0,
      crimesFailed: 0,
      totalLoot: 0,

      refreshDerived: () => {
        set((s) => {
          const n = computeRegen(s.nerve, s.nerveUpdatedAt, NERVE_MAX, NERVE_REGEN_SEC);
          const e = computeRegen(s.energy, s.energyUpdatedAt, ENERGY_MAX, ENERGY_REGEN_SEC);
          const now = Date.now();
          // Prune expired buffs and jail
          const tempBuffs = s.tempBuffs.filter(b => b.expiresAt > now);
          const jailUntil = s.jailUntil && s.jailUntil > now ? s.jailUntil : null;
          return {
            nerve: n.value, nerveUpdatedAt: n.updatedAt,
            energy: e.value, energyUpdatedAt: e.updatedAt,
            tempBuffs, jailUntil,
          };
        });
      },

      commitCrime: (crimeId, creditsGrant) => {
        const s = get();
        const now = Date.now();
        if (s.jailUntil && s.jailUntil > now) {
          return { blocked: `Estás en la cárcel ${Math.ceil((s.jailUntil - now) / 1000)}s más.` };
        }
        const crime = CRIMES.find((c) => c.id === crimeId);
        if (!crime) return { blocked: "Crimen desconocido." };

        const level = levelFromXp(s.xp);
        if (level < crime.requiredLevel) return { blocked: `Nivel ${crime.requiredLevel} requerido.` };
        const effective = getEffectiveStats(s);
        if (crime.requiredStat && effective[crime.requiredStat.stat] < crime.requiredStat.value) {
          return { blocked: `Requiere ${crime.requiredStat.value} de ${crime.requiredStat.stat}.` };
        }

        const curNerve = getCurrentNerve(s);
        if (curNerve < crime.nerveCost) return { blocked: "Nervio insuficiente." };

        // Compute success rate with level + stat bonuses (+1% per level over req, +0.5% per stat pt over req)
        const levelBonus = Math.min(0.2, (level - crime.requiredLevel) * 0.01);
        let statBonus = 0;
        if (crime.requiredStat) {
          const excess = effective[crime.requiredStat.stat] - crime.requiredStat.value;
          statBonus = Math.min(0.25, Math.max(0, excess) * 0.005);
        }
        const successRate = clamp(crime.baseSuccessRate + levelBonus + statBonus, 0.05, 0.97);
        const roll = Math.random();

        // Consume nerve first
        const nerveAfter = curNerve - crime.nerveCost;
        const nerveUpdatedAt = nerveAfter >= NERVE_MAX ? Date.now() : Date.now();

        if (roll <= successRate) {
          // SUCCESS
          const credits = Math.floor(crime.minCredits + Math.random() * (crime.maxCredits - crime.minCredits));
          creditsGrant(credits);
          // Item drop
          let droppedItem: string | undefined;
          if (crime.itemDrops) {
            for (const d of crime.itemDrops) {
              if (Math.random() < d.chance) { droppedItem = d.itemId; break; }
            }
          }
          set((state) => ({
            nerve: nerveAfter,
            nerveUpdatedAt,
            xp: state.xp + crime.xpReward,
            inventory: droppedItem
              ? { ...state.inventory, [droppedItem]: (state.inventory[droppedItem] ?? 0) + 1 }
              : state.inventory,
            crimesCommitted: state.crimesCommitted + 1,
            totalLoot: state.totalLoot + credits,
          }));
          return { success: true, credits, xp: crime.xpReward, item: droppedItem };
        } else {
          // FAIL → jail
          set((state) => ({
            nerve: nerveAfter,
            nerveUpdatedAt,
            jailUntil: Date.now() + crime.jailTimeOnFail * 1000,
            crimesFailed: state.crimesFailed + 1,
          }));
          return { success: false, jailSeconds: crime.jailTimeOnFail };
        }
      },

      trainStat: (stat, energySpent) => {
        const s = get();
        const curEnergy = getCurrentEnergy(s);
        if (curEnergy < energySpent) return { blocked: "Energía insuficiente." };
        const now = Date.now();
        if (s.jailUntil && s.jailUntil > now) return { blocked: "No puedes entrenar en la cárcel." };
        const gained = trainingGain(s.stats[stat], energySpent);
        set((state) => ({
          energy: curEnergy - energySpent,
          energyUpdatedAt: now,
          stats: { ...state.stats, [stat]: Math.round((state.stats[stat] + gained) * 100) / 100 },
        }));
        return { gained };
      },

      useItem: (itemId) => {
        const s = get();
        if ((s.inventory[itemId] ?? 0) < 1) return { ok: false, reason: "No tienes ese objeto." };
        const item = ITEMS[itemId];
        if (!item) return { ok: false, reason: "Objeto desconocido." };
        if (item.type === "loot") return { ok: false, reason: "Este objeto solo se puede vender." };

        const now = Date.now();
        const updates: Partial<UnderworldState> = {};
        let message = `Usaste ${item.name}.`;

        if (item.effect?.nerve) {
          const cur = getCurrentNerve(s);
          const next = Math.min(NERVE_MAX, cur + item.effect.nerve);
          updates.nerve = next;
          updates.nerveUpdatedAt = now;
          message += ` +${item.effect.nerve} nervio.`;
        }
        if (item.effect?.energy) {
          const cur = getCurrentEnergy(s);
          const next = Math.min(ENERGY_MAX, cur + item.effect.energy);
          updates.energy = next;
          updates.energyUpdatedAt = now;
          message += ` +${item.effect.energy} energía.`;
        }
        if (item.effect?.xp) {
          updates.xp = s.xp + item.effect.xp;
          message += ` +${item.effect.xp} XP.`;
        }
        if (item.effect?.statBonusDays) {
          const bonus: TempStatBuff = {
            stat: item.effect.statBonusDays.stat,
            value: item.effect.statBonusDays.value,
            expiresAt: now + item.effect.statBonusDays.durationSec * 1000,
          };
          updates.tempBuffs = [...s.tempBuffs, bonus];
          message += ` +${bonus.value} ${bonus.stat} por ${Math.floor(item.effect.statBonusDays.durationSec / 60)}m.`;
        }
        if (item.type === "weapon") {
          // Weapons grant permanent small stat bump when "used"
          if (item.id === "knuckles") {
            updates.stats = { ...s.stats, strength: s.stats.strength + 2 };
            message += " +2 fuerza permanente.";
          } else if (item.id === "stun_baton") {
            updates.stats = { ...s.stats, defense: s.stats.defense + 3 };
            message += " +3 defensa permanente.";
          }
        }

        // Addiction side effect: 25% chance of -5 random stat for 2 minutes
        if (item.addictive && Math.random() < 0.25) {
          const stats: Stat[] = ["strength", "defense", "speed", "dexterity"];
          const pick = stats[Math.floor(Math.random() * 4)];
          const debuff: TempStatBuff = { stat: pick, value: -5, expiresAt: now + 120_000 };
          updates.tempBuffs = [...(updates.tempBuffs ?? s.tempBuffs), debuff];
          message += ` ⚠️ Efecto secundario: -5 ${pick} durante 2m.`;
        }

        set((state) => ({
          ...updates,
          inventory: { ...state.inventory, [itemId]: (state.inventory[itemId] ?? 0) - 1 },
        }));
        return { ok: true, message };
      },

      sellItem: (itemId, credits) => {
        const s = get();
        const item = ITEMS[itemId];
        if (!item || (s.inventory[itemId] ?? 0) < 1) return { ok: false };
        credits(item.sellValue);
        set((state) => ({
          inventory: { ...state.inventory, [itemId]: state.inventory[itemId] - 1 },
          totalLoot: state.totalLoot + item.sellValue,
        }));
        return { ok: true, received: item.sellValue };
      },

      reset: () => set({
        nerve: NERVE_MAX, nerveUpdatedAt: Date.now(),
        energy: ENERGY_MAX, energyUpdatedAt: Date.now(),
        xp: 0, stats: { strength: 1, defense: 1, speed: 1, dexterity: 1 },
        tempBuffs: [], jailUntil: null, inventory: {},
        crimesCommitted: 0, crimesFailed: 0, totalLoot: 0,
      }),
    }),
    {
      name: "nexus-underworld-v1",
      version: 1,
    }
  )
);
