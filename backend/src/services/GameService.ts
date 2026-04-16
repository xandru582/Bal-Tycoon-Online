import { db } from "../config/database.js";
import { redis } from "../config/redis.js";
import { EconomyEngine } from "../core/economy/EconomyEngine.js";
import { StockMarket } from "../core/economy/Stocks.js";
import { ContractManager } from "../core/economy/Contracts.js";
import { RivalManager } from "../core/economy/Rivals.js";
import { PersonalLifeManager } from "../core/economy/PersonalLife.js";
import { GameEventsManager } from "../core/economy/GameEvents.js";

// ── Upgrade definitions (same as frontend gameStore) ──────────────
export interface SyndicateUpgrade {
  id: string; name: string; description: string;
  baseCost: number; cost: number; cpsEach: number;
  purchased: number; icon: string; tier: number;
}

// Balance v2: early game más fluido (cpsEach +50% tier 0-1), mid-game igual, late game intacto
// Multiplicador de coste: 1.15× (bajado de 1.18× para reducir muro mid-game)
const BASE_UPGRADES: SyndicateUpgrade[] = [
  { id:'u01', name:'Script Kiddie',         description:'Bot básico que escanea puertos abiertos.',          baseCost:30,           cost:30,           cpsEach:0.2,       purchased:0, icon:'🖱️', tier:0 },
  { id:'u02', name:'Nodo de Minería',       description:'Minero de datos pasivo en la darknet.',             baseCost:200,          cost:200,          cpsEach:1.2,       purchased:0, icon:'⛏️', tier:0 },
  { id:'u03', name:'Proxy Farm',            description:'Red de proxies para multiplicar extracción.',       baseCost:2200,         cost:2200,         cpsEach:8,         purchased:0, icon:'🌐', tier:1 },
  { id:'u04', name:'Granja Cuántica',       description:'Computación cuántica para descifrar datos.',        baseCost:24000,        cost:24000,        cpsEach:50,        purchased:0, icon:'💠', tier:1 },
  { id:'u05', name:'Cluster Neural',        description:'Red neuronal que aprende patrones de mercado.',     baseCost:280000,       cost:280000,       cpsEach:260,       purchased:0, icon:'🧠', tier:2 },
  { id:'u06', name:'Satélite Espía',        description:'Acceso orbital a comunicaciones corporativas.',     baseCost:3800000,      cost:3800000,      cpsEach:1400,      purchased:0, icon:'🛰️', tier:2 },
  { id:'u07', name:'Agente de Campo',       description:'Operativos encubiertos infiltrados en rivales.',    baseCost:52000000,     cost:52000000,     cpsEach:7800,      purchased:0, icon:'🕵️', tier:3 },
  { id:'u08', name:'Centro de Mando',       description:'Control centralizado de todas las operaciones.',    baseCost:900000000,    cost:900000000,    cpsEach:44000,     purchased:0, icon:'🏛️', tier:3 },
  { id:'u09', name:'Cable Submarino',       description:'Interceptas todo el ancho de banda transoceánico.',baseCost:15000000000,  cost:15000000000,  cpsEach:260000,    purchased:0, icon:'🌊', tier:4 },
  { id:'u10', name:'IA Omnisciente',        description:'Superinteligencia artificial autónoma.',            baseCost:220000000000, cost:220000000000, cpsEach:1600000,   purchased:0, icon:'🤖', tier:4 },
  { id:'u11', name:'Esfera de Dyson',       description:'Estrellas enteras puramente para minar cripto.',    baseCost:3e12,  cost:3e12,  cpsEach:10000000,  purchased:0, icon:'☀️', tier:5 },
  { id:'u12', name:'Motor de Materia',      description:'Convierte materia inerte en oro virtual.',          baseCost:4e13,  cost:4e13,  cpsEach:65000000,  purchased:0, icon:'⚛️', tier:5 },
  { id:'u13', name:'Computadora Galáctica', description:'Toda la Vía Láctea es un procesador.',             baseCost:5e14,  cost:5e14,  cpsEach:430000000, purchased:0, icon:'🌌', tier:6 },
  { id:'u14', name:'Manipulador Temporal',  description:'Invierte en el pasado con rendimientos futuros.',   baseCost:6e15,  cost:6e15,  cpsEach:2900000000,purchased:0, icon:'⏳', tier:6 },
];

// ── Session: estado en memoria por usuario activo ─────────────────
export interface UserSession {
  userId: string;
  username: string;
  credits: number;
  totalCreditsEarned: number;
  influence: number;
  creditsPerSecond: number;
  clickPower: number;
  totalClicks: number;
  currentDay: number;
  gameSpeed: number;
  upgrades: SyndicateUpgrade[];
  achievements: any[];
  engine: EconomyEngine;
  stockMarket: StockMarket;
  contractManager: ContractManager;
  rivalManager: RivalManager;
  personalManager: PersonalLifeManager;
  eventsManager: GameEventsManager;
  prestigeLevel: number;
  prestigeBonus: number;
  _timeAccumulator: number;
  _lastSavedAt: number;
  notifications: any[];
}

// ── Coste de upgrade con multiplicador 1.18× ─────────────────────
function upgradeCost(base: number, purchased: number): number {
  return Math.ceil(base * Math.pow(1.18, purchased));
}

function calcCPS(upgrades: SyndicateUpgrade[]): number {
  return upgrades.reduce((s, u) => s + u.cpsEach * u.purchased, 0);
}

async function calcBuildingCPS(userId: string): Promise<number> {
  const { rows } = await db.query(
    `SELECT COALESCE(SUM(cps_base * level), 0) AS total FROM buildings WHERE owner_id = $1`,
    [userId]
  );
  return parseFloat(rows[0].total) || 0;
}

class GameService {
  // Pool de sesiones activas en memoria
  private sessions = new Map<string, UserSession>();

  // ── Cargar sesión desde PostgreSQL ─────────────────────────────
  async loadSession(userId: string, username: string): Promise<UserSession> {
    if (this.sessions.has(userId)) return this.sessions.get(userId)!;

    const result = await db.query(
      `SELECT state_data, credits, total_earned, influence, current_day, prestige_level, prestige_bonus
       FROM game_states WHERE user_id = $1`,
      [userId]
    );

    const row = result.rows[0];
    const data = row?.state_data ?? {};

    // Restaurar o crear motores del juego
    const engine = new EconomyEngine();
    const stockMarket = new StockMarket();
    const contractManager = new ContractManager();
    const rivalManager = new RivalManager();
    const personalManager = new PersonalLifeManager();
    const eventsManager = new GameEventsManager();

    // Si hay datos guardados, restaurarlos
    if (data.engine) {
      try {
        engine.day       = data.engine.day ?? 1;
        engine.month     = data.engine.month ?? 1;
        engine.year      = data.engine.year ?? 1;
        engine.totalDays = data.engine.totalDays ?? 1;
        if (data.engine.indicators) engine.indicators = data.engine.indicators;
      } catch {}
    }
    if (data.stockMarket) {
      try { stockMarket.fromJSON(data.stockMarket); } catch {}
    }
    // ContractManager and RivalManager use static fromJSON — reassign the session vars
    let restoredContractManager = contractManager;
    if (data.contractManager) {
      try { restoredContractManager = ContractManager.fromJSON(data.contractManager); } catch {}
    }
    let restoredRivalManager = rivalManager;
    if (data.rivalManager) {
      try { restoredRivalManager = RivalManager.fromJSON(data.rivalManager); } catch {}
    }

    // Restaurar upgrades (aplicar costes ya calculados)
    const upgrades: SyndicateUpgrade[] = BASE_UPGRADES.map(base => {
      const saved = (data.upgrades ?? []).find((u: any) => u.id === base.id);
      if (saved) {
        return { ...base, purchased: saved.purchased, cost: upgradeCost(base.baseCost, saved.purchased) };
      }
      return { ...base };
    });

    const session: UserSession = {
      userId,
      username,
      credits:             parseFloat(row?.credits ?? '500'),
      totalCreditsEarned:  parseFloat(row?.total_earned ?? '500'),
      influence:           parseInt(row?.influence ?? '0', 10),
      creditsPerSecond:    calcCPS(upgrades), // building CPS added below
      clickPower:          1,
      totalClicks:         data.totalClicks ?? 0,
      currentDay:          row?.current_day ?? 1,
      gameSpeed:           1,
      upgrades,
      achievements:        data.achievements ?? [],
      engine,
      stockMarket,
      contractManager: restoredContractManager,
      rivalManager:    restoredRivalManager,
      personalManager,
      eventsManager,
      prestigeLevel:       row?.prestige_level ?? 0,
      prestigeBonus:       parseFloat(row?.prestige_bonus ?? '1.0'),
      _timeAccumulator:    0,
      _lastSavedAt:        Date.now(),
      notifications:       [],
    };

    // Add building CPS
    const buildingCps = await calcBuildingCPS(userId);
    session.creditsPerSecond = calcCPS(upgrades) + buildingCps;

    this.sessions.set(userId, session);
    return session;
  }

  // Recalculate CPS including owned buildings (call after buy/upgrade)
  async recalculateSessionCps(session: UserSession): Promise<void> {
    const upgradeCps = calcCPS(session.upgrades);
    const buildingCps = await calcBuildingCPS(session.userId);
    session.creditsPerSecond = upgradeCps + buildingCps;
  }

  // ── Tick del juego para una sesión ─────────────────────────────
  tick(session: UserSession, deltaSeconds: number): void {
    const REAL_SECS_PER_DAY = 300; // 5 minutos reales = 1 día de juego

    session._timeAccumulator += deltaSeconds * session.gameSpeed;

    // Generar créditos pasivos (CPS)
    const earned = session.creditsPerSecond * deltaSeconds * session.gameSpeed * session.prestigeBonus;
    session.credits += earned;
    session.totalCreditsEarned += earned;

    // Avanzar días de juego si corresponde
    while (session._timeAccumulator >= REAL_SECS_PER_DAY) {
      session._timeAccumulator -= REAL_SECS_PER_DAY;
      session.currentDay += 1;
      session.engine.advanceDay();
      session.stockMarket.update(session.currentDay, session.engine.indicators.phase);
      // ContractManager.tick requires playerCash + inventory
      const inv: Record<string, number> = {};
      if (session.engine.playerCompany) {
        session.engine.playerCompany.inventory.forEach((qty, id) => { inv[id] = qty; });
      }
      session.contractManager.tick(session.currentDay, session.credits, inv);
      session.rivalManager.update(session.currentDay, session.engine.indicators.phase);
      session.personalManager.tick(0, 0, 300, session.currentDay);
    }

    // Autosave cada 2 minutos
    if (Date.now() - session._lastSavedAt > 120_000) {
      this.saveSession(session).catch(console.error);
    }
  }

  // ── Procesar acción del jugador ─────────────────────────────────
  async processAction(session: UserSession, type: string, payload: any): Promise<{ success: boolean; delta?: any; error?: string }> {
    switch (type) {
      case "click": {
        const earned = session.clickPower + session.creditsPerSecond * 0.05;
        session.credits += earned * session.prestigeBonus;
        session.totalCreditsEarned += earned;
        session.totalClicks += 1;
        return { success: true, delta: { credits: session.credits, totalClicks: session.totalClicks } };
      }

      case "buy_upgrade": {
        const upg = session.upgrades.find(u => u.id === payload.id);
        if (!upg) return { success: false, error: "Upgrade not found" };
        if (upg.purchased >= 999) return { success: false, error: "Upgrade maxed" };
        if (session.credits < upg.cost) return { success: false, error: "Insufficient credits" };

        session.credits -= upg.cost;
        upg.purchased += 1;
        upg.cost = upgradeCost(upg.baseCost, upg.purchased);
        session.creditsPerSecond = calcCPS(session.upgrades);

        // Guardar inmediatamente — nunca perder una compra
        await this.saveSession(session);
        return { success: true, delta: { credits: session.credits, upgrades: session.upgrades, creditsPerSecond: session.creditsPerSecond } };
      }

      case "buy_from_market": {
        const { productId, quantity, price } = payload;
        if (!productId || !quantity || price == null) return { success: false, error: "Invalid payload" };
        const total = price * quantity;
        if (session.credits < total) return { success: false, error: "Insufficient credits" };
        session.credits -= total;
        if (session.engine.playerCompany) {
          const inv = session.engine.playerCompany.inventory;
          inv.set(productId, (inv.get(productId) ?? 0) + quantity);
        }
        await this.saveSession(session);
        return { success: true, delta: { credits: session.credits } };
      }

      case "sell_to_market": {
        const { productId, quantity, price } = payload;
        if (!productId || !quantity) return { success: false, error: "Invalid payload" };
        const inv = session.engine.playerCompany?.inventory;
        const has = inv?.get(productId) ?? 0;
        if (has < quantity) return { success: false, error: "Not enough inventory" };
        const total = (price ?? 0) * quantity;
        session.credits += total * session.prestigeBonus;
        session.totalCreditsEarned += total;
        inv!.set(productId, has - quantity);
        await this.saveSession(session);
        return { success: true, delta: { credits: session.credits } };
      }

      case "set_game_speed": {
        session.gameSpeed = Math.max(1, Math.min(10, payload.speed ?? 1));
        return { success: true, delta: { gameSpeed: session.gameSpeed } };
      }

      default:
        return { success: false, error: `Unknown action: ${type}` };
    }
  }

  // ── Persistir sesión en PostgreSQL ─────────────────────────────
  async saveSession(session: UserSession): Promise<void> {
    session._lastSavedAt = Date.now();

    const stateData = {
      upgrades: session.upgrades,
      achievements: session.achievements,
      totalClicks: session.totalClicks,
      engine: {
        day: session.engine.day,
        month: session.engine.month,
        year: session.engine.year,
        totalDays: session.engine.totalDays,
        indicators: session.engine.indicators,
      },
      stockMarket: session.stockMarket.toJSON?.() ?? {},
      contractManager: session.contractManager.toJSON?.() ?? {},
      rivalManager: session.rivalManager.toJSON?.() ?? {},
      personalManager: (session.personalManager as any).toJSON?.() ?? {},
    };

    const netWorth = session.credits + (session.stockMarket.getPortfolioValue?.() ?? 0);

    await db.query(
      `UPDATE game_states
       SET state_data = $1, credits = $2, total_earned = $3, influence = $4,
           net_worth = $5, current_day = $6, last_tick_at = NOW(), updated_at = NOW()
       WHERE user_id = $7`,
      [
        JSON.stringify(stateData),
        session.credits,
        session.totalCreditsEarned,
        session.influence,
        netWorth,
        session.currentDay,
        session.userId,
      ]
    );

    // Actualizar Redis con resumen para leaderboard
    await redis.hset(`player:${session.userId}`, {
      username: session.username,
      net_worth: netWorth.toFixed(4),
      influence: session.influence,
      current_day: session.currentDay,
    });
  }

  // ── Serializar para enviar al cliente ──────────────────────────
  getClientState(session: UserSession): object {
    return {
      credits:            session.credits,
      totalCreditsEarned: session.totalCreditsEarned,
      influence:          session.influence,
      creditsPerSecond:   session.creditsPerSecond,
      clickPower:         session.clickPower,
      totalClicks:        session.totalClicks,
      currentDay:         session.currentDay,
      gameSpeed:          session.gameSpeed,
      upgrades:           session.upgrades,
      achievements:       session.achievements,
      prestigeLevel:      session.prestigeLevel,
      prestigeBonus:      session.prestigeBonus,
      engineDay:          session.engine.day,
      engineMonth:        session.engine.month,
      engineYear:         session.engine.year,
      indicators:         session.engine.indicators,
      notifications:      session.notifications.splice(0),
    };
  }

  getSession(userId: string): UserSession | undefined {
    return this.sessions.get(userId);
  }

  // Prestige reset
  async prestige(session: UserSession): Promise<{ success: boolean; error?: string }> {
    const PRESTIGE_THRESHOLD = 1e12; // 1 Billón Đ
    if (session.totalCreditsEarned < PRESTIGE_THRESHOLD) {
      return { success: false, error: `Necesitas ganar ${PRESTIGE_THRESHOLD.toExponential(2)} Đ en total` };
    }

    session.prestigeLevel += 1;
    session.prestigeBonus = 1 + session.prestigeLevel * 0.1; // +10% por nivel

    // Reset de economía base
    session.credits = 500;
    session.totalCreditsEarned = 500;
    session.creditsPerSecond = 0;
    session.upgrades = BASE_UPGRADES.map(u => ({ ...u, purchased: 0, cost: u.baseCost }));
    session.currentDay = 1;

    await db.query(
      `UPDATE game_states SET prestige_level = $1, prestige_bonus = $2 WHERE user_id = $3`,
      [session.prestigeLevel, session.prestigeBonus, session.userId]
    );

    await this.saveSession(session);
    return { success: true };
  }
}

export const gameService = new GameService();
