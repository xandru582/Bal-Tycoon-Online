// ============================================================
// UnderworldService — server-authoritative Torn-style module.
// All game logic (crime rolls, training gains, item effects) runs
// here so clients cannot cheat by manipulating browser state.
// ============================================================

import { db } from "../config/database.js";
import {
  CRIMES,
  ITEMS,
  type Stat,
  xpForLevel,
  levelFromXp,
  trainingGain,
} from "../core/underworld/data.js";

// ── Constants (kept in sync with frontend) ────────────────
const NERVE_MAX = 100;
const ENERGY_MAX = 100;
const NERVE_REGEN_SEC = 300;   // 1 every 5 minutes
const ENERGY_REGEN_SEC = 180;  // 1 every 3 minutes

interface TempBuff {
  stat: Stat;
  value: number;
  expiresAt: number; // epoch ms
}

export interface UnderworldRow {
  user_id: string;
  nerve: number;
  nerve_updated_at: Date;
  energy: number;
  energy_updated_at: Date;
  xp: number;
  stats: Record<Stat, number>;
  temp_buffs: TempBuff[];
  jail_until: Date | null;
  inventory: Record<string, number>;
  crimes_committed: number;
  crimes_failed: number;
  total_loot: number;
  updated_at: Date;
}

export interface UnderworldClientState {
  nerve: number;
  nerveUpdatedAt: number;
  energy: number;
  energyUpdatedAt: number;
  xp: number;
  level: number;
  stats: Record<Stat, number>;
  effectiveStats: Record<Stat, number>;
  tempBuffs: TempBuff[];
  jailUntil: number | null;
  inventory: Record<string, number>;
  crimesCommitted: number;
  crimesFailed: number;
  totalLoot: number;
}

// ── Helpers ───────────────────────────────────────────────
function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function applyRegen(
  current: number,
  updatedAt: Date,
  max: number,
  regenSec: number,
  now = Date.now()
): { value: number; updatedAt: Date } {
  if (current >= max) return { value: max, updatedAt: new Date(now) };
  const elapsedSec = Math.floor((now - updatedAt.getTime()) / 1000);
  const gained = Math.floor(elapsedSec / regenSec);
  if (gained === 0) return { value: current, updatedAt };
  const newVal = Math.min(max, current + gained);
  const consumedSec = gained * regenSec;
  return { value: newVal, updatedAt: new Date(updatedAt.getTime() + consumedSec * 1000) };
}

function effectiveStats(row: UnderworldRow, now = Date.now()): Record<Stat, number> {
  const out: Record<Stat, number> = { ...row.stats };
  for (const b of row.temp_buffs) {
    if (b.expiresAt > now) out[b.stat] = (out[b.stat] ?? 0) + b.value;
  }
  return out;
}

function pruneBuffs(buffs: TempBuff[], now = Date.now()): TempBuff[] {
  return buffs.filter((b) => b.expiresAt > now);
}

function rowToClient(row: UnderworldRow): UnderworldClientState {
  const now = Date.now();
  const n = applyRegen(row.nerve, row.nerve_updated_at, NERVE_MAX, NERVE_REGEN_SEC, now);
  const e = applyRegen(row.energy, row.energy_updated_at, ENERGY_MAX, ENERGY_REGEN_SEC, now);
  const jail = row.jail_until && row.jail_until.getTime() > now ? row.jail_until.getTime() : null;
  const buffs = pruneBuffs(row.temp_buffs, now);
  return {
    nerve: n.value,
    nerveUpdatedAt: n.updatedAt.getTime(),
    energy: e.value,
    energyUpdatedAt: e.updatedAt.getTime(),
    xp: row.xp,
    level: levelFromXp(row.xp),
    stats: row.stats,
    effectiveStats: effectiveStats({ ...row, temp_buffs: buffs }, now),
    tempBuffs: buffs,
    jailUntil: jail,
    inventory: row.inventory ?? {},
    crimesCommitted: row.crimes_committed,
    crimesFailed: row.crimes_failed,
    totalLoot: Number(row.total_loot),
  };
}

// ── Result types ──────────────────────────────────────────
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

// ── Service ───────────────────────────────────────────────
class UnderworldService {
  /** Fetch the row for a user, creating a fresh default if missing. */
  async load(userId: string): Promise<UnderworldRow> {
    const { rows } = await db.query<UnderworldRow>(
      `SELECT * FROM underworld_states WHERE user_id = $1`,
      [userId]
    );
    if (rows.length > 0) return rows[0];

    // Create default
    await db.query(
      `INSERT INTO underworld_states (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );
    const again = await db.query<UnderworldRow>(
      `SELECT * FROM underworld_states WHERE user_id = $1`,
      [userId]
    );
    return again.rows[0];
  }

  async getClientState(userId: string): Promise<UnderworldClientState> {
    const row = await this.load(userId);
    return rowToClient(row);
  }

  /** Credit currency to the player's main game_states.credits balance atomically. */
  private async creditMainBalance(userId: string, amount: number): Promise<void> {
    if (amount <= 0) return;
    await db.query(
      `UPDATE game_states
         SET credits = credits + $2,
             total_earned = total_earned + $2,
             updated_at = NOW()
       WHERE user_id = $1`,
      [userId, amount]
    );
  }

  // ── commitCrime ─────────────────────────────────────────
  async commitCrime(userId: string, crimeId: string): Promise<{ state: UnderworldClientState; result: CrimeResult }> {
    const row = await this.load(userId);
    const now = Date.now();

    // Jail gate
    if (row.jail_until && row.jail_until.getTime() > now) {
      return {
        state: rowToClient(row),
        result: { kind: "blocked", reason: `Estás en la cárcel ${Math.ceil((row.jail_until.getTime() - now) / 1000)}s más.` },
      };
    }

    const crime = CRIMES.find((c) => c.id === crimeId);
    if (!crime) {
      return { state: rowToClient(row), result: { kind: "blocked", reason: "Crimen desconocido." } };
    }

    const level = levelFromXp(row.xp);
    if (level < crime.requiredLevel) {
      return { state: rowToClient(row), result: { kind: "blocked", reason: `Nivel ${crime.requiredLevel} requerido.` } };
    }

    const eff = effectiveStats(row, now);
    if (crime.requiredStat && eff[crime.requiredStat.stat] < crime.requiredStat.value) {
      return {
        state: rowToClient(row),
        result: { kind: "blocked", reason: `Requiere ${crime.requiredStat.value} de ${crime.requiredStat.stat}.` },
      };
    }

    // Regen nerve to current then check
    const n = applyRegen(row.nerve, row.nerve_updated_at, NERVE_MAX, NERVE_REGEN_SEC, now);
    if (n.value < crime.nerveCost) {
      return { state: rowToClient(row), result: { kind: "blocked", reason: "Nervio insuficiente." } };
    }

    // Success roll with level + stat bonuses
    const levelBonus = Math.min(0.2, (level - crime.requiredLevel) * 0.01);
    let statBonus = 0;
    if (crime.requiredStat) {
      const excess = eff[crime.requiredStat.stat] - crime.requiredStat.value;
      statBonus = Math.min(0.25, Math.max(0, excess) * 0.005);
    }
    const successRate = clamp(crime.baseSuccessRate + levelBonus + statBonus, 0.05, 0.97);
    const roll = Math.random();

    const nerveAfter = n.value - crime.nerveCost;
    const nerveUpdatedAt = new Date(now);

    if (roll <= successRate) {
      // SUCCESS
      const credits = Math.floor(crime.minCredits + Math.random() * (crime.maxCredits - crime.minCredits));
      let droppedItem: string | undefined;
      if (crime.itemDrops) {
        for (const d of crime.itemDrops) {
          if (Math.random() < d.chance) { droppedItem = d.itemId; break; }
        }
      }
      const newInventory = { ...row.inventory };
      if (droppedItem) newInventory[droppedItem] = (newInventory[droppedItem] ?? 0) + 1;
      const newXp = row.xp + crime.xpReward;
      const buffs = pruneBuffs(row.temp_buffs, now);

      await db.query(
        `UPDATE underworld_states SET
           nerve = $2, nerve_updated_at = $3,
           xp = $4, inventory = $5, temp_buffs = $6,
           crimes_committed = crimes_committed + 1,
           total_loot = total_loot + $7,
           updated_at = NOW()
         WHERE user_id = $1`,
        [userId, nerveAfter, nerveUpdatedAt, newXp, JSON.stringify(newInventory), JSON.stringify(buffs), credits]
      );
      await this.creditMainBalance(userId, credits);

      const updated = await this.load(userId);
      return {
        state: rowToClient(updated),
        result: { kind: "success", credits, xp: crime.xpReward, item: droppedItem },
      };
    } else {
      // FAIL
      const jailUntil = new Date(now + crime.jailTimeOnFail * 1000);
      const buffs = pruneBuffs(row.temp_buffs, now);
      await db.query(
        `UPDATE underworld_states SET
           nerve = $2, nerve_updated_at = $3,
           jail_until = $4, temp_buffs = $5,
           crimes_failed = crimes_failed + 1,
           updated_at = NOW()
         WHERE user_id = $1`,
        [userId, nerveAfter, nerveUpdatedAt, jailUntil, JSON.stringify(buffs)]
      );
      const updated = await this.load(userId);
      return {
        state: rowToClient(updated),
        result: { kind: "failure", jailSeconds: crime.jailTimeOnFail },
      };
    }
  }

  // ── trainStat ───────────────────────────────────────────
  async trainStat(userId: string, stat: Stat, energySpent: number): Promise<{ state: UnderworldClientState; result: TrainResult }> {
    const row = await this.load(userId);
    const now = Date.now();

    if (row.jail_until && row.jail_until.getTime() > now) {
      return { state: rowToClient(row), result: { kind: "blocked", reason: "No puedes entrenar en la cárcel." } };
    }
    if (!["strength", "defense", "speed", "dexterity"].includes(stat)) {
      return { state: rowToClient(row), result: { kind: "blocked", reason: "Estadística inválida." } };
    }
    const energyAmt = Math.max(1, Math.min(100, Math.floor(Number(energySpent) || 0)));
    const e = applyRegen(row.energy, row.energy_updated_at, ENERGY_MAX, ENERGY_REGEN_SEC, now);
    if (e.value < energyAmt) {
      return { state: rowToClient(row), result: { kind: "blocked", reason: "Energía insuficiente." } };
    }

    const gained = trainingGain(row.stats[stat], energyAmt);
    const newStatVal = Math.round((row.stats[stat] + gained) * 100) / 100;
    const newStats = { ...row.stats, [stat]: newStatVal };

    await db.query(
      `UPDATE underworld_states SET
         energy = $2, energy_updated_at = $3,
         stats = $4, updated_at = NOW()
       WHERE user_id = $1`,
      [userId, e.value - energyAmt, new Date(now), JSON.stringify(newStats)]
    );
    const updated = await this.load(userId);
    return {
      state: rowToClient(updated),
      result: { kind: "ok", stat, gained },
    };
  }

  // ── useItem ─────────────────────────────────────────────
  async useItem(userId: string, itemId: string): Promise<{ state: UnderworldClientState; result: ItemUseResult }> {
    const row = await this.load(userId);
    const now = Date.now();
    const qty = row.inventory[itemId] ?? 0;
    if (qty < 1) {
      return { state: rowToClient(row), result: { kind: "blocked", reason: "No tienes ese objeto." } };
    }
    const item = ITEMS[itemId];
    if (!item) {
      return { state: rowToClient(row), result: { kind: "blocked", reason: "Objeto desconocido." } };
    }
    if (item.type === "loot") {
      return { state: rowToClient(row), result: { kind: "blocked", reason: "Este objeto solo se puede vender." } };
    }

    // Apply effects
    let newNerve = row.nerve;
    let newNerveAt = row.nerve_updated_at;
    let newEnergy = row.energy;
    let newEnergyAt = row.energy_updated_at;
    let newXp = row.xp;
    let newStats = { ...row.stats };
    let newBuffs: TempBuff[] = pruneBuffs(row.temp_buffs, now);
    let message = `Usaste ${item.name}.`;

    if (item.effect?.nerve) {
      const cur = applyRegen(row.nerve, row.nerve_updated_at, NERVE_MAX, NERVE_REGEN_SEC, now);
      newNerve = Math.min(NERVE_MAX, cur.value + item.effect.nerve);
      newNerveAt = new Date(now);
      message += ` +${item.effect.nerve} nervio.`;
    }
    if (item.effect?.energy) {
      const cur = applyRegen(row.energy, row.energy_updated_at, ENERGY_MAX, ENERGY_REGEN_SEC, now);
      newEnergy = Math.min(ENERGY_MAX, cur.value + item.effect.energy);
      newEnergyAt = new Date(now);
      message += ` +${item.effect.energy} energía.`;
    }
    if (item.effect?.xp) {
      newXp = row.xp + item.effect.xp;
      message += ` +${item.effect.xp} XP.`;
    }
    if (item.effect?.statBonusDays) {
      const b = item.effect.statBonusDays;
      newBuffs = [...newBuffs, { stat: b.stat, value: b.value, expiresAt: now + b.durationSec * 1000 }];
      message += ` +${b.value} ${b.stat} por ${Math.floor(b.durationSec / 60)}m.`;
    }
    if (item.type === "weapon") {
      if (item.id === "knuckles") {
        newStats.strength = newStats.strength + 2;
        message += " +2 fuerza permanente.";
      } else if (item.id === "stun_baton") {
        newStats.defense = newStats.defense + 3;
        message += " +3 defensa permanente.";
      }
    }
    // Addiction debuff
    if (item.addictive && Math.random() < 0.25) {
      const pool: Stat[] = ["strength", "defense", "speed", "dexterity"];
      const pick = pool[Math.floor(Math.random() * 4)];
      newBuffs = [...newBuffs, { stat: pick, value: -5, expiresAt: now + 120_000 }];
      message += ` ⚠️ Efecto secundario: -5 ${pick} durante 2m.`;
    }

    const newInventory = { ...row.inventory, [itemId]: qty - 1 };
    if (newInventory[itemId] <= 0) delete newInventory[itemId];

    await db.query(
      `UPDATE underworld_states SET
         nerve = $2, nerve_updated_at = $3,
         energy = $4, energy_updated_at = $5,
         xp = $6, stats = $7, temp_buffs = $8,
         inventory = $9, updated_at = NOW()
       WHERE user_id = $1`,
      [
        userId,
        newNerve, newNerveAt,
        newEnergy, newEnergyAt,
        newXp, JSON.stringify(newStats), JSON.stringify(newBuffs),
        JSON.stringify(newInventory),
      ]
    );
    const updated = await this.load(userId);
    return {
      state: rowToClient(updated),
      result: { kind: "ok", message },
    };
  }

  // ── sellItem ────────────────────────────────────────────
  async sellItem(userId: string, itemId: string): Promise<{ state: UnderworldClientState; result: ItemSellResult }> {
    const row = await this.load(userId);
    const qty = row.inventory[itemId] ?? 0;
    if (qty < 1) {
      return { state: rowToClient(row), result: { kind: "blocked", reason: "No tienes ese objeto." } };
    }
    const item = ITEMS[itemId];
    if (!item) {
      return { state: rowToClient(row), result: { kind: "blocked", reason: "Objeto desconocido." } };
    }

    const newInventory = { ...row.inventory, [itemId]: qty - 1 };
    if (newInventory[itemId] <= 0) delete newInventory[itemId];

    await db.query(
      `UPDATE underworld_states SET
         inventory = $2,
         total_loot = total_loot + $3,
         updated_at = NOW()
       WHERE user_id = $1`,
      [userId, JSON.stringify(newInventory), item.sellValue]
    );
    await this.creditMainBalance(userId, item.sellValue);

    const updated = await this.load(userId);
    return {
      state: rowToClient(updated),
      result: { kind: "ok", received: item.sellValue },
    };
  }
}

export const underworldService = new UnderworldService();

// Expose constants for route validation if needed
export { NERVE_MAX, ENERGY_MAX, xpForLevel };
