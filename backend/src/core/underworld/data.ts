// ============================================================
// NEXUS: Underworld — Game Data
// Crimes, items, and stat-training catalog (Torn-City style).
// ============================================================

export interface Crime {
  id: string;
  tier: 1 | 2 | 3 | 4 | 5;
  name: string;
  description: string;
  icon: string;
  nerveCost: number;
  minCredits: number;
  maxCredits: number;
  xpReward: number;
  baseSuccessRate: number;   // 0-1, before level/stat modifiers
  jailTimeOnFail: number;    // seconds
  requiredLevel: number;
  requiredStat?: { stat: Stat; value: number };
  itemDrops?: { itemId: string; chance: number }[];
}

export type Stat = "strength" | "defense" | "speed" | "dexterity";

export const STAT_LABELS: Record<Stat, { label: string; icon: string }> = {
  strength:  { label: "Fuerza",    icon: "💪" },
  defense:   { label: "Defensa",   icon: "🛡️" },
  speed:     { label: "Velocidad", icon: "⚡" },
  dexterity: { label: "Destreza",  icon: "🎯" },
};

export interface Item {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: "drug" | "booster" | "consumable" | "loot" | "weapon";
  sellValue: number;
  // If consumable: effect when used
  effect?: {
    nerve?: number;       // restore nerve
    energy?: number;      // restore energy
    xp?: number;          // grant XP
    statBonusDays?: { stat: Stat; value: number; durationSec: number };
  };
  addictive?: boolean;    // drugs — chance of temporary debuff after use
}

// ─── ITEMS CATALOG ──────────────────────────────────────────
export const ITEMS: Record<string, Item> = {
  // Consumables
  "energy_drink":  { id: "energy_drink",  name: "Bebida Energética", description: "+25 energía al instante.", icon: "🥤", type: "consumable", sellValue: 800,   effect: { energy: 25 } },
  "nerve_tonic":   { id: "nerve_tonic",   name: "Tónico de Nervio",  description: "+15 nervio al instante.",   icon: "🧪", type: "consumable", sellValue: 1400,  effect: { nerve: 15 } },
  "adrenaline":    { id: "adrenaline",    name: "Adrenalina",        description: "+50 energía al instante.",  icon: "💉", type: "consumable", sellValue: 3500,  effect: { energy: 50 } },
  "xp_booster":    { id: "xp_booster",    name: "Chip Neural",       description: "+500 XP al instante.",      icon: "🧠", type: "booster",    sellValue: 5000,  effect: { xp: 500 } },
  // Drugs (addictive, temporary buffs)
  "speed_pill":    { id: "speed_pill",    name: "Píldora Veloz",     description: "+10 velocidad durante 10 min. Adictiva.", icon: "💊", type: "drug", sellValue: 2200, addictive: true, effect: { statBonusDays: { stat: "speed", value: 10, durationSec: 600 } } },
  "power_serum":   { id: "power_serum",   name: "Suero Alfa",        description: "+10 fuerza durante 10 min. Adictivo.",     icon: "🩸", type: "drug", sellValue: 2800, addictive: true, effect: { statBonusDays: { stat: "strength", value: 10, durationSec: 600 } } },
  "focus_tabs":    { id: "focus_tabs",    name: "Focus Tabs",        description: "+10 destreza durante 10 min. Adictivas.",  icon: "🟣", type: "drug", sellValue: 2400, addictive: true, effect: { statBonusDays: { stat: "dexterity", value: 10, durationSec: 600 } } },
  "iron_skin":     { id: "iron_skin",     name: "Piel de Hierro",    description: "+10 defensa durante 10 min. Adictivo.",    icon: "🟢", type: "drug", sellValue: 2400, addictive: true, effect: { statBonusDays: { stat: "defense", value: 10, durationSec: 600 } } },
  // Loot (sellable)
  "stolen_wallet": { id: "stolen_wallet", name: "Cartera Robada",    description: "Monedero con efectivo. Véndelo.", icon: "👛", type: "loot",   sellValue: 1500 },
  "burner_phone":  { id: "burner_phone",  name: "Móvil Desechable",  description: "Móvil usado y rastreado.",        icon: "📱", type: "loot",   sellValue: 900 },
  "encrypted_usb": { id: "encrypted_usb", name: "USB Cifrado",       description: "Datos de valor en mercado negro.", icon: "💾", type: "loot",   sellValue: 6500 },
  "gold_watch":    { id: "gold_watch",    name: "Reloj de Oro",      description: "Bien de lujo robado.",             icon: "⌚", type: "loot",   sellValue: 12000 },
  "rare_diamond":  { id: "rare_diamond",  name: "Diamante Raro",     description: "Piedra extremadamente valiosa.",  icon: "💎", type: "loot",   sellValue: 85000 },
  // Weapons
  "knuckles":      { id: "knuckles",      name: "Puños de Acero",    description: "+2 fuerza permanente al usarse.", icon: "🥊", type: "weapon", sellValue: 4500 },
  "stun_baton":    { id: "stun_baton",    name: "Bastón Paralizante",description: "+3 defensa permanente al usarse.", icon: "🏒", type: "weapon", sellValue: 7000 },
};

// ─── CRIMES CATALOG ─────────────────────────────────────────
export const CRIMES: Crime[] = [
  // Tier 1 — starter crimes, cheap nerve, low reward, high success
  { id: "pickpocket",     tier: 1, name: "Carterista",            icon: "👜", description: "Robar una cartera en la calle.",                                 nerveCost: 3,  minCredits: 50,     maxCredits: 180,    xpReward: 8,   baseSuccessRate: 0.85, jailTimeOnFail: 90,   requiredLevel: 1,
    itemDrops: [{ itemId: "stolen_wallet", chance: 0.08 }, { itemId: "burner_phone", chance: 0.05 }] },
  { id: "shoplift",       tier: 1, name: "Hurto en Tienda",       icon: "🛍️", description: "Robar mercancía de una tienda de barrio.",                      nerveCost: 4,  minCredits: 80,     maxCredits: 240,    xpReward: 10,  baseSuccessRate: 0.80, jailTimeOnFail: 120,  requiredLevel: 1,
    itemDrops: [{ itemId: "energy_drink", chance: 0.06 }] },
  { id: "graffiti",       tier: 1, name: "Grafiti Ilegal",        icon: "🎨", description: "Pintar tu tag en la pared de una corporación.",                  nerveCost: 2,  minCredits: 30,     maxCredits: 100,    xpReward: 6,   baseSuccessRate: 0.90, jailTimeOnFail: 60,   requiredLevel: 1 },

  // Tier 2 — need some XP
  { id: "hot_wire",       tier: 2, name: "Hot-wire de Coche",     icon: "🚗", description: "Arrancar un coche sin llaves en un aparcamiento.",               nerveCost: 7,  minCredits: 400,    maxCredits: 1200,   xpReward: 22,  baseSuccessRate: 0.70, jailTimeOnFail: 240,  requiredLevel: 3, requiredStat: { stat: "dexterity", value: 5 },
    itemDrops: [{ itemId: "burner_phone", chance: 0.10 }] },
  { id: "store_robbery",  tier: 2, name: "Atraco a Licorería",    icon: "🔫", description: "Entrar armado y vaciar la caja.",                                nerveCost: 9,  minCredits: 700,    maxCredits: 2200,   xpReward: 30,  baseSuccessRate: 0.62, jailTimeOnFail: 360,  requiredLevel: 4, requiredStat: { stat: "strength", value: 8 },
    itemDrops: [{ itemId: "stolen_wallet", chance: 0.15 }, { itemId: "nerve_tonic", chance: 0.05 }] },
  { id: "mugging",        tier: 2, name: "Atraco Callejero",      icon: "🥷", description: "Asaltar a un ejecutivo al salir del bar.",                        nerveCost: 6,  minCredits: 350,    maxCredits: 1400,   xpReward: 20,  baseSuccessRate: 0.68, jailTimeOnFail: 200,  requiredLevel: 3, requiredStat: { stat: "speed", value: 5 },
    itemDrops: [{ itemId: "gold_watch", chance: 0.04 }] },

  // Tier 3 — mid-game, organised crime
  { id: "atm_skimmer",    tier: 3, name: "Skimmer de ATM",        icon: "💳", description: "Instalar un lector de tarjetas clonadoras.",                     nerveCost: 12, minCredits: 3500,   maxCredits: 11000,  xpReward: 55,  baseSuccessRate: 0.55, jailTimeOnFail: 600,  requiredLevel: 7, requiredStat: { stat: "dexterity", value: 15 },
    itemDrops: [{ itemId: "encrypted_usb", chance: 0.10 }] },
  { id: "drug_dealing",   tier: 3, name: "Tráfico de Drogas",     icon: "💊", description: "Mover producto en un barrio caliente.",                           nerveCost: 14, minCredits: 5000,   maxCredits: 16000,  xpReward: 70,  baseSuccessRate: 0.50, jailTimeOnFail: 720,  requiredLevel: 8,
    itemDrops: [{ itemId: "speed_pill", chance: 0.08 }, { itemId: "focus_tabs", chance: 0.08 }] },
  { id: "racket",         tier: 3, name: "Extorsión",             icon: "💼", description: "Proteger a comerciantes… de ti mismo.",                           nerveCost: 11, minCredits: 2800,   maxCredits: 9500,   xpReward: 48,  baseSuccessRate: 0.58, jailTimeOnFail: 500,  requiredLevel: 6, requiredStat: { stat: "strength", value: 12 } },

  // Tier 4 — high risk, requires real stats
  { id: "bank_hack",      tier: 4, name: "Hackeo Bancario",       icon: "🏦", description: "Infiltrarte en los servidores de un banco y drenar cuentas.",   nerveCost: 20, minCredits: 25000,  maxCredits: 90000,  xpReward: 140, baseSuccessRate: 0.40, jailTimeOnFail: 1200, requiredLevel: 12, requiredStat: { stat: "dexterity", value: 30 },
    itemDrops: [{ itemId: "encrypted_usb", chance: 0.20 }, { itemId: "xp_booster", chance: 0.05 }] },
  { id: "jewel_heist",    tier: 4, name: "Atraco Joyería",        icon: "💎", description: "Robo planificado a una joyería de élite.",                      nerveCost: 25, minCredits: 40000,  maxCredits: 160000, xpReward: 200, baseSuccessRate: 0.35, jailTimeOnFail: 1500, requiredLevel: 14, requiredStat: { stat: "speed", value: 28 },
    itemDrops: [{ itemId: "gold_watch", chance: 0.25 }, { itemId: "rare_diamond", chance: 0.06 }] },
  { id: "blackmail",      tier: 4, name: "Chantaje Corporativo",  icon: "📸", description: "Fotografía comprometedora de un CEO rival.",                    nerveCost: 18, minCredits: 30000,  maxCredits: 120000, xpReward: 160, baseSuccessRate: 0.42, jailTimeOnFail: 1000, requiredLevel: 11, requiredStat: { stat: "defense", value: 25 } },

  // Tier 5 — endgame, legendary
  { id: "art_heist",      tier: 5, name: "Robo de Museo",         icon: "🖼️", description: "Una sola obra vale una fortuna. Y un error, décadas en la celda.", nerveCost: 35, minCredits: 250000, maxCredits: 900000, xpReward: 450, baseSuccessRate: 0.25, jailTimeOnFail: 2700, requiredLevel: 20, requiredStat: { stat: "dexterity", value: 60 },
    itemDrops: [{ itemId: "rare_diamond", chance: 0.25 }, { itemId: "gold_watch", chance: 0.50 }] },
  { id: "cartel_run",     tier: 5, name: "Ruta del Cártel",       icon: "🚁", description: "Transporte en helicóptero de producto al otro lado de la frontera.", nerveCost: 40, minCredits: 350000, maxCredits: 1300000, xpReward: 550, baseSuccessRate: 0.22, jailTimeOnFail: 3000, requiredLevel: 22, requiredStat: { stat: "strength", value: 55 },
    itemDrops: [{ itemId: "power_serum", chance: 0.20 }, { itemId: "iron_skin", chance: 0.20 }] },
  { id: "nexus_raid",     tier: 5, name: "Asalto a NEXUS Corp",   icon: "🏛️", description: "Golpear a la torre corporativa más segura del continente.",      nerveCost: 50, minCredits: 800000, maxCredits: 3500000, xpReward: 900, baseSuccessRate: 0.18, jailTimeOnFail: 3600, requiredLevel: 28, requiredStat: { stat: "defense", value: 80 },
    itemDrops: [{ itemId: "rare_diamond", chance: 0.40 }, { itemId: "xp_booster", chance: 0.25 }] },
];

// ─── GYM TRAINING ──────────────────────────────────────────
// Each training action consumes energy. Gain follows diminishing returns.
export function trainingGain(currentStat: number, energySpent: number): number {
  // Base gain scales with energy; heavy diminishing returns past 50
  const base = energySpent * 0.35;
  const penalty = Math.pow(currentStat / 50, 0.55);
  return Math.max(0.05, base / (1 + penalty));
}

// ─── LEVEL CURVE ───────────────────────────────────────────
// XP required for level N (1-indexed). Linear-ish but scaling.
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level - 1, 1.45));
}

export function levelFromXp(xp: number): number {
  let lvl = 1;
  while (xpForLevel(lvl + 1) <= xp) lvl++;
  return lvl;
}

// ─── TIER LABELS ───────────────────────────────────────────
export const TIER_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Menor",       color: "#64748b" },
  2: { label: "Callejero",   color: "#22d3ee" },
  3: { label: "Organizado",  color: "#a78bfa" },
  4: { label: "Peligroso",   color: "#f97316" },
  5: { label: "Legendario",  color: "#f43f5e" },
};
