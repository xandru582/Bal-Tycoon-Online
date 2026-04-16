// ============================================================
// NEXUS: Imperio del Mercado — AI Rival Companies System
// ============================================================
// Five distinct rival personalities that evolve daily, compete
// for market share, and react to the player's success.
// ============================================================

import type { Product } from "@/types/index";

// ─── Type Definitions ─────────────────────────────────────────

export type RivalPersonality =
  | "aggressive"
  | "conservative"
  | "opportunist"
  | "innovator"
  | "copycat";

export type RivalEvent = {
  day: number;
  rivalId: string;
  description: string;      // Spanish text shown to player
  type:
    | "expansion"
    | "attack"
    | "hiring"
    | "product_launch"
    | "partnership"
    | "retreat"
    | "scandal"
    | "growth";
  impactOnPlayer?: number;  // negative = bad for player, positive = opportunity
};

export interface RivalCompany {
  id: string;
  name: string;
  ownerName: string;
  ownerTitle: string;       // e.g. "CEO", "Fundadora"
  sector: string;
  personality: RivalPersonality;
  cash: number;
  netWorth: number;
  reputation: number;
  level: number;
  workerCount: number;
  facilityCount: number;
  currentStrategy: string;  // Spanish description of active strategy
  marketShare: Record<string, number>;    // productId → share % (0–100)
  recentActions: string[];               // last 5 actions in Spanish
  relationship: number;      // -100 to 100 with player (negative = hostile)
  threatLevel: number;       // 0–100, how dangerous this rival is
  founded: number;           // day founded
  backstory: string;
  tagline: string;           // short descriptor shown in UI
  color: string;             // brand color hex
  weeklyGrowthRate: number;  // % net worth growth per week baseline
  aggressionCooldown: number; // days until next attack on player
  lastIntelligenceDay: number; // when player last paid for intel
}

export interface RivalIntelligenceReport {
  rivalId: string;
  generatedDay: number;
  summary: string;           // Spanish overview
  strengths: string[];
  weaknesses: string[];
  recentMoves: string[];
  predictedNextMove: string;
  threatAssessment: string;
  financialEstimate: {
    estimatedCash: number;
    estimatedNetWorth: number;
    estimatedMonthlyRevenue: number;
  };
  cost: number;              // € to purchase this report
}

export interface RivalRankingEntry {
  id: string;
  name: string;
  ownerName: string;
  netWorth: number;
  reputation: number;
  sector: string;
  isPlayer: boolean;
  rank: number;
  change: number;            // rank change since last week (+/-)
}

export interface MarketAttackEvent {
  rivalId: string;
  rivalName: string;
  marketId: string;          // productId being contested
  shareStolen: number;       // % stolen from player (0–5)
  description: string;       // Spanish
}

// ─── Predefined Rivals ────────────────────────────────────────

const INITIAL_RIVALS: Omit<
  RivalCompany,
  "recentActions" | "aggressionCooldown" | "lastIntelligenceDay" | "weeklyGrowthRate"
>[] = [
  {
    id: "apex_industries",
    name: "Apex Industries",
    ownerName: "Victoria Solano",
    ownerTitle: "CEO",
    sector: "tecnologia",
    personality: "aggressive",
    cash: 80_000,
    netWorth: 220_000,
    reputation: 72,
    level: 5,
    workerCount: 45,
    facilityCount: 3,
    currentStrategy: "Dominar el mercado tecnológico antes de que los competidores reaccionen.",
    marketShare: {
      hardware: 28,
      software: 15,
      gadgets: 22,
    },
    relationship: -30,
    threatLevel: 75,
    founded: 1,
    backstory:
      "La rival principal. Victoria Solano construyó Apex desde cero con métodos cuestionables. Ha aplastado a 12 empresas en 3 años mediante prácticas agresivas de precios y adquisiciones hostiles. No le teme a nadie.",
    tagline: "Dominación tecnológica sin concesiones.",
    color: "#ff1744",
  },
  {
    id: "reyes_hermanos",
    name: "Reyes Hermanos",
    ownerName: "Carlos Reyes",
    ownerTitle: "Director General",
    sector: "moda",
    personality: "conservative",
    cash: 45_000,
    netWorth: 130_000,
    reputation: 65,
    level: 3,
    workerCount: 22,
    facilityCount: 2,
    currentStrategy: "Preservar la cuota de mercado de moda con calidad y tradición.",
    marketShare: {
      ropa_casual: 18,
      ropa_lujo: 11,
      accesorios: 14,
    },
    relationship: -10,
    threatLevel: 35,
    founded: 1,
    backstory:
      "Familia establecida en el sector de la moda desde hace tres generaciones. Carlos Reyes es conservador y detesta la competencia desleal, pero respeta a quien construye con honestidad. Odian a los recién llegados que intentan robarles clientes.",
    tagline: "Tradición, calidad y estilo desde 1985.",
    color: "#E91E8C",
  },
  {
    id: "novatech",
    name: "NovaTech",
    ownerName: "Ana Ruiz",
    ownerTitle: "Fundadora & CTO",
    sector: "tecnologia",
    personality: "innovator",
    cash: 30_000,
    netWorth: 75_000,
    reputation: 58,
    level: 2,
    workerCount: 12,
    facilityCount: 1,
    currentStrategy: "Lanzar tres productos innovadores este trimestre.",
    marketShare: {
      software: 8,
      gadgets: 5,
      componentes: 12,
    },
    relationship: 15,
    threatLevel: 30,
    founded: 1,
    backstory:
      "Joven startup fundada por Ana Ruiz, ex-investigadora del MIT. Apuesta por tecnología de vanguardia y prefiere la colaboración sobre la confrontación. Crece despacio pero sus productos son genuinamente innovadores. Podría ser aliada o amenaza futura.",
    tagline: "Innovación española para el mercado global.",
    color: "#00c9ff",
  },
  {
    id: "mercado_popular",
    name: "Mercado Popular",
    ownerName: "Jorge Castillo",
    ownerTitle: "Propietario",
    sector: "alimentacion",
    personality: "opportunist",
    cash: 25_000,
    netWorth: 60_000,
    reputation: 38,
    level: 2,
    workerCount: 18,
    facilityCount: 2,
    currentStrategy: "Copiar lo que funcione y moverse rápido al dinero fácil.",
    marketShare: {
      alimentos_procesados: 12,
      bebidas: 9,
      snacks: 16,
    },
    relationship: -5,
    threatLevel: 40,
    founded: 1,
    backstory:
      "Jorge Castillo es un oportunista nato. Sin escrúpulos y siempre donde huela a dinero. Ha copiado modelos de negocio, infravalorado productos para hundirte y no duda en usar contactos del mercado gris cuando le conviene. La reputación le importa poco.",
    tagline: "Siempre donde está el dinero.",
    color: "#FF6F00",
  },
  {
    id: "greenfuture",
    name: "GreenFuture",
    ownerName: "Lucía Martín",
    ownerTitle: "Directora de Sostenibilidad",
    sector: "energia",
    personality: "conservative",
    cash: 20_000,
    netWorth: 45_000,
    reputation: 70,
    level: 1,
    workerCount: 8,
    facilityCount: 1,
    currentStrategy: "Crecimiento sostenible con impacto ambiental positivo.",
    marketShare: {
      energia_solar: 7,
      materias_primas: 3,
    },
    relationship: 25,
    threatLevel: 15,
    founded: 1,
    backstory:
      "Startup fundada por Lucía Martín tras 10 años en ONGs medioambientales. Crecimiento lento pero sólido. Sus valores éticos le han ganado una reputación envidiable. No es agresiva, pero si el mercado verde despega, podría convertirse en un jugador mayor de lo esperado.",
    tagline: "El beneficio que no destruye el planeta.",
    color: "#00e676",
  },
];

// ─── Strategy Descriptions ────────────────────────────────────

const STRATEGY_POOL: Record<RivalPersonality, string[]> = {
  aggressive: [
    "Expandir a nuevos mercados antes de que la competencia reaccione.",
    "Reducir precios agresivamente para ganar cuota de mercado.",
    "Adquirir proveedores clave para controlar la cadena de suministro.",
    "Lanzar campaña de marketing masiva para dominar el sector.",
    "Contratar al mejor talento del mercado a cualquier coste.",
  ],
  conservative: [
    "Consolidar posición actual y reducir deuda.",
    "Invertir en calidad y retención de clientes existentes.",
    "Expandir gradualmente sin asumir riesgos excesivos.",
    "Mantener reservas de efectivo para oportunidades futuras.",
    "Mejorar eficiencia operativa para maximizar márgenes.",
  ],
  opportunist: [
    "Capitalizar la tendencia del momento antes de que caiga.",
    "Copiar el modelo más exitoso del mercado y mejorarlo.",
    "Entrar en el mercado gris si la rentabilidad lo justifica.",
    "Pivotar hacia el sector más rentable este trimestre.",
    "Formar alianzas oportunistas con quien ofrezca mejor retorno.",
  ],
  innovator: [
    "Desarrollar tecnología propietaria que nadie más tenga.",
    "Invertir en I+D para lanzar producto revolucionario.",
    "Explorar mercados sin explotar con soluciones creativas.",
    "Proteger propiedad intelectual y monetizar mediante licencias.",
    "Construir ecosistema de partners tecnológicos.",
  ],
  copycat: [
    "Replicar la estrategia de la empresa más exitosa esta semana.",
    "Imitar el modelo de negocio de Apex Industries.",
    "Copiar el catálogo de productos del líder del sector.",
    "Adoptando los precios de quien más vende actualmente.",
    "Siguiendo los pasos del jugador más rentable del mercado.",
  ],
};

// ─── Action Message Templates ─────────────────────────────────

const ACTION_TEMPLATES: Record<
  RivalCompany["personality"],
  ((rival: RivalCompany) => string)[]
> = {
  aggressive: [
    (r) => `${r.name} ha lanzado una ofensiva de precios en su sector.`,
    (r) => `${r.ownerName} ha declarado en una entrevista que aplastará a su competencia este trimestre.`,
    (r) => `${r.name} ha contratado 8 nuevos empleados agresivamente.`,
    (r) => `${r.name} ha abierto una nueva instalación en Madrid.`,
    (r) => `${r.ownerName} ha firmado un acuerdo exclusivo con un proveedor clave.`,
    (r) => `${r.name} está ofreciendo descuentos del 30% para robar clientes.`,
    (r) => `${r.name} ha adquirido una empresa rival por absorción.`,
    (r) => `${r.ownerName} ha duplicado el presupuesto de marketing de ${r.name}.`,
  ],
  conservative: [
    (r) => `${r.name} ha renovado contratos con sus principales clientes.`,
    (r) => `${r.ownerName} ha anunciado un plan de ahorro para consolidar ${r.name}.`,
    (r) => `${r.name} ha mejorado sus procesos internos para reducir costes.`,
    (r) => `${r.name} ha contratado 2 especialistas en calidad.`,
    (r) => `${r.ownerName} ha evitado moverse hacia nuevos mercados por prudencia.`,
    (r) => `${r.name} ha reforzado su relación con clientes existentes.`,
    (r) => `${r.name} mantiene su estrategia conservadora mientras espera el momento correcto.`,
  ],
  opportunist: [
    (r) => `${r.name} ha pivotado repentinamente hacia el sector más caliente del momento.`,
    (r) => `${r.ownerName} de ${r.name} ha copiado el modelo de negocio de un competidor exitoso.`,
    (r) => `${r.name} está aprovechando la crisis del sector para comprar activos baratos.`,
    (r) => `${r.ownerName} ha buscado alianzas rápidas con distribuidores de otros sectores.`,
    (r) => `${r.name} ha entrado en un segmento de mercado gris aprovechando un vacío legal.`,
    (r) => `${r.name} ha lanzado una oferta flash agresiva para capturar cuota de mercado.`,
  ],
  innovator: [
    (r) => `${r.name} ha lanzado un nuevo producto que nadie esperaba.`,
    (r) => `${r.ownerName} ha publicado una patente tecnológica revolucionaria.`,
    (r) => `${r.name} ha iniciado un programa de I+D con la Universidad Politécnica.`,
    (r) => `${r.name} ha presentado su nueva tecnología en una conferencia internacional.`,
    (r) => `${r.ownerName} ha firmado un acuerdo de licencia con una empresa europea.`,
    (r) => `${r.name} ha abierto un laboratorio de innovación en Barcelona.`,
  ],
  copycat: [
    (r) => `${r.name} ha copiado la estrategia de precios del líder del mercado.`,
    (r) => `${r.ownerName} de ${r.name} ha imitado el catálogo de un competidor exitoso.`,
    (r) => `${r.name} ha replicado la estructura de distribución de un rival.`,
    (r) => `${r.name} está siguiendo cada movimiento de la empresa más rentable del sector.`,
    (r) => `${r.ownerName} ha adoptado la misma política de RR.HH. que el competidor dominante.`,
  ],
};

const ATTACK_MESSAGES: ((rivalName: string, market: string, share: number) => string)[] = [
  (n, m, s) => `${n} ha lanzado una campaña agresiva en ${m}, robando un ${s}% de cuota.`,
  (n, m, s) => `${n} ha bajado precios en ${m} drenando ${s}% del mercado del jugador.`,
  (n, m, s) => `Clientes de ${m} se han movido a ${n} tras su nueva oferta (${s}% de cuota perdida).`,
  (n, m, s) => `${n} ha firmado contratos exclusivos en ${m}. Pérdida de cuota: ${s}%.`,
];

// ─── Utility ──────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatEuros(n: number): string {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `€${(n / 1_000).toFixed(1)}k`;
  return `€${n.toLocaleString("es-ES")}`;
}

// ─── Rival Manager ────────────────────────────────────────────

export class RivalManager {
  private _rivals: RivalCompany[];
  private _day: number;
  private _eventLog: RivalEvent[];
  private _previousRankings: Map<string, number>;

  // ── Construction ──────────────────────────────────────────

  constructor() {
    this._day = 1;
    this._eventLog = [];
    this._previousRankings = new Map();

    this._rivals = INITIAL_RIVALS.map((r) => ({
      ...r,
      recentActions: [],
      aggressionCooldown: 0,
      lastIntelligenceDay: -1,
      weeklyGrowthRate: this._baseGrowthRate(r.personality),
    }));
  }

  // ── Getters ───────────────────────────────────────────────

  get rivals(): RivalCompany[] {
    return [...this._rivals];
  }

  get eventLog(): RivalEvent[] {
    return [...this._eventLog];
  }

  getRival(id: string): RivalCompany | undefined {
    return this._rivals.find((r) => r.id === id);
  }

  // ── Main Update ───────────────────────────────────────────

  /**
   * Advance all rivals by one day.
   * Returns events generated this tick.
   */
  update(day: number, economicPhase: string): RivalEvent[] {
    this._day = day;
    const events: RivalEvent[] = [];

    for (const rival of this._rivals) {
      const rivalEvents = this.rivalTick(rival, economicPhase);
      events.push(...rivalEvents);
    }

    // Weekly copycat resets
    if (day % 7 === 0) {
      this._updateCopycatStrategy();
    }

    // Update Apex threat escalation every 30 days
    if (day % 30 === 0) {
      this._updateThreatLevels();
    }

    // Push events to log (keep last 100)
    this._eventLog.push(...events);
    if (this._eventLog.length > 100) {
      this._eventLog.splice(0, this._eventLog.length - 100);
    }

    return events;
  }

  /**
   * Process a single rival for one day.
   */
  rivalTick(rival: RivalCompany, economicPhase: string): RivalEvent[] {
    const events: RivalEvent[] = [];
    const isBoom = economicPhase === "boom" || economicPhase === "growth";
    const isCrisis = economicPhase === "recession" || economicPhase === "crisis";

    // ── Cash & NetWorth Growth ───────────────────────────────
    const dailyGrowth = this._dailyGrowthMultiplier(rival.personality, economicPhase);
    rival.cash = Math.max(0, rival.cash * (1 + dailyGrowth));
    rival.netWorth = Math.max(0, rival.netWorth * (1 + dailyGrowth * 0.8));

    // ── Reputation Drift ─────────────────────────────────────
    if (rival.personality === "aggressive") {
      rival.reputation = clamp(rival.reputation + (isBoom ? 0.05 : -0.03), 0, 100);
    } else if (rival.personality === "conservative") {
      rival.reputation = clamp(rival.reputation + 0.02, 0, 100);
    } else if (rival.personality === "opportunist") {
      rival.reputation = clamp(rival.reputation + (Math.random() - 0.5) * 0.3, 0, 100);
    }

    // ── Action Generation (not every day) ───────────────────
    const actionChance = rival.personality === "aggressive" ? 0.25 : 0.1;
    if (Math.random() < actionChance) {
      const action = this.generateAction(rival);
      rival.recentActions.unshift(action);
      if (rival.recentActions.length > 5) rival.recentActions.pop();

      events.push({
        day: this._day,
        rivalId: rival.id,
        description: action,
        type: "growth",
        impactOnPlayer: 0,
      });
    }

    // ── Aggressive: attack player market ─────────────────────
    if (rival.personality === "aggressive" && rival.aggressionCooldown <= 0) {
      const attackChance = isBoom ? 0.15 : isCrisis ? 0.05 : 0.1;
      if (Math.random() < attackChance) {
        const markets = Object.keys(rival.marketShare);
        if (markets.length > 0) {
          const targetMarket = pickRandom(markets);
          const attackEvent = this.attackPlayerMarket(rival, targetMarket);
          events.push({
            day: this._day,
            rivalId: rival.id,
            description: attackEvent.description,
            type: "attack",
            impactOnPlayer: -attackEvent.shareStolen,
          });
          rival.aggressionCooldown = 14 + randInt(0, 7);
        }
      }
    } else if (rival.aggressionCooldown > 0) {
      rival.aggressionCooldown--;
    }

    // ── Opportunist: boom bonanza / crisis crash ─────────────
    if (rival.personality === "opportunist") {
      if (isBoom && Math.random() < 0.05) {
        rival.cash *= 1.1;
        rival.netWorth *= 1.08;
        const msg = `${rival.name} ha capitalizado el boom económico con un movimiento audaz.`;
        rival.recentActions.unshift(msg);
        if (rival.recentActions.length > 5) rival.recentActions.pop();
        events.push({ day: this._day, rivalId: rival.id, description: msg, type: "growth" });
      }
      if (isCrisis && Math.random() < 0.08) {
        rival.cash *= 0.92;
        rival.netWorth *= 0.94;
        const msg = `${rival.name} ha sufrido pérdidas por la crisis económica.`;
        rival.recentActions.unshift(msg);
        if (rival.recentActions.length > 5) rival.recentActions.pop();
        events.push({ day: this._day, rivalId: rival.id, description: msg, type: "retreat" });
      }
    }

    // ── Innovator: occasional market expansion ────────────────
    if (rival.personality === "innovator" && Math.random() < 0.02) {
      const newProduct = `producto_nuevo_${rival.id}_${this._day}`;
      rival.marketShare[newProduct] = randInt(2, 8);
      const msg = `${rival.name} ha entrado en un nuevo segmento de mercado con tecnología innovadora.`;
      rival.recentActions.unshift(msg);
      if (rival.recentActions.length > 5) rival.recentActions.pop();
      events.push({
        day: this._day,
        rivalId: rival.id,
        description: msg,
        type: "product_launch",
        impactOnPlayer: -2,
      });
    }

    // ── Conservative: occasional hiring ──────────────────────
    if (rival.personality === "conservative" && this._day % 30 === 0) {
      const newHires = randInt(1, 3);
      rival.workerCount += newHires;
      const msg = `${rival.name} ha contratado ${newHires} nuevo${newHires > 1 ? "s" : ""} empleado${newHires > 1 ? "s" : ""}.`;
      rival.recentActions.unshift(msg);
      if (rival.recentActions.length > 5) rival.recentActions.pop();
    }

    // ── Level-up check every 90 days ─────────────────────────
    if (this._day % 90 === 0 && rival.netWorth > this._levelThreshold(rival.level)) {
      rival.level = Math.min(10, rival.level + 1);
      rival.threatLevel = clamp(rival.threatLevel + 10, 0, 100);
      const msg = `${rival.name} ha alcanzado el nivel ${rival.level}. ¡Su amenaza aumenta!`;
      events.push({ day: this._day, rivalId: rival.id, description: msg, type: "expansion", impactOnPlayer: -5 });
    }

    // ── Strategy refresh every 30 days ───────────────────────
    if (this._day % 30 === 0) {
      const pool = STRATEGY_POOL[rival.personality];
      rival.currentStrategy = pickRandom(pool);
    }

    return events;
  }

  /**
   * Generate a single action description for a rival (Spanish).
   */
  generateAction(rival: RivalCompany): string {
    const templates = ACTION_TEMPLATES[rival.personality];
    return pickRandom(templates)(rival);
  }

  /**
   * Execute a market attack by a rival against the player.
   */
  attackPlayerMarket(rival: RivalCompany, marketId: string): MarketAttackEvent {
    const shareStolen = clamp(Math.random() * 5, 1, 5);
    const rounded = parseFloat(shareStolen.toFixed(1));

    rival.marketShare[marketId] = clamp(
      (rival.marketShare[marketId] ?? 0) + rounded,
      0,
      80
    );

    const template = pickRandom(ATTACK_MESSAGES);
    const description = template(rival.name, marketId, rounded);

    rival.recentActions.unshift(description);
    if (rival.recentActions.length > 5) rival.recentActions.pop();

    return {
      rivalId: rival.id,
      rivalName: rival.name,
      marketId,
      shareStolen: rounded,
      description,
    };
  }

  /**
   * Apex Industries pressure event: when player grows fast, Apex escalates.
   */
  apexPressureEvent(playerNetWorth: number): RivalEvent | null {
    const apex = this._rivals.find((r) => r.id === "apex_industries");
    if (!apex) return null;

    const ratio = playerNetWorth / apex.netWorth;
    if (ratio < 0.3) return null;

    const escalationMessages = [
      `Victoria Solano de Apex Industries ha declarado que el jugador representa "una amenaza que será eliminada".`,
      `Apex Industries ha contratado un equipo de espionaje industrial para monitorear al jugador.`,
      `Victoria Solano ha iniciado una guerra de precios directa contra el jugador en su sector principal.`,
      `Apex Industries ha intentado comprar uno de los proveedores principales del jugador.`,
      `Victoria Solano ha convocado una reunión de emergencia en Apex para diseñar estrategia anticompetitiva.`,
    ];

    const msgIndex =
      ratio >= 0.9 ? 4 : ratio >= 0.7 ? 3 : ratio >= 0.5 ? 2 : ratio >= 0.4 ? 1 : 0;
    const description = escalationMessages[msgIndex];

    apex.threatLevel = clamp(apex.threatLevel + 5, 0, 100);
    apex.relationship = clamp(apex.relationship - 10, -100, 100);
    apex.recentActions.unshift(description);
    if (apex.recentActions.length > 5) apex.recentActions.pop();

    const event: RivalEvent = {
      day: this._day,
      rivalId: apex.id,
      description,
      type: "attack",
      impactOnPlayer: -10,
    };

    this._eventLog.push(event);
    return event;
  }

  // ── Queries ────────────────────────────────────────────────

  /**
   * Rivals with threatLevel > 60.
   */
  getThreats(): RivalCompany[] {
    return this._rivals.filter((r) => r.threatLevel > 60).sort((a, b) => b.threatLevel - a.threatLevel);
  }

  /**
   * All rivals sorted by netWorth descending.
   */
  getRivalsByNetWorth(): RivalCompany[] {
    return [...this._rivals].sort((a, b) => b.netWorth - a.netWorth);
  }

  /**
   * Generate an intelligence report for a rival (costs €500).
   */
  getIntelligenceReport(rivalId: string): RivalIntelligenceReport | null {
    const rival = this._rivals.find((r) => r.id === rivalId);
    if (!rival) return null;

    rival.lastIntelligenceDay = this._day;

    const marketEntries = Object.entries(rival.marketShare);
    const dominantMarkets = marketEntries
      .filter(([, share]) => share > 10)
      .map(([id, share]) => `${id} (${share.toFixed(1)}%)`);

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (rival.cash > 50_000) strengths.push("Sólida posición de liquidez.");
    if (rival.reputation > 70) strengths.push("Reputación excelente en el sector.");
    if (rival.workerCount > 30) strengths.push("Equipo humano grande y experimentado.");
    if (rival.level >= 4) strengths.push("Alta madurez empresarial con acceso a recursos premium.");
    if (dominantMarkets.length > 0)
      strengths.push(`Cuota dominante en: ${dominantMarkets.join(", ")}.`);

    if (rival.cash < 15_000) weaknesses.push("Liquidez ajustada, vulnerable a shocks.");
    if (rival.reputation < 50) weaknesses.push("Reputación baja, pierde contratos.");
    if (rival.workerCount < 10) weaknesses.push("Equipo reducido, capacidad operativa limitada.");
    if (rival.relationship < -20)
      weaknesses.push("Relaciones tensas con proveedores y socios.");
    if (rival.personality === "opportunist")
      weaknesses.push("Estrategia inconsistente, difícil de predecir pero sin visión a largo plazo.");

    const predictedMoves: Record<RivalPersonality, string> = {
      aggressive: "Probablemente lanzará una ofensiva de precios o intentará adquirir un competidor.",
      conservative: "Seguirá consolidando su posición actual. Pocas sorpresas esperadas.",
      opportunist: "Pivotará hacia el sector más rentable del momento. Difícil de anticipar.",
      innovator: "Anunciará un nuevo producto o tecnología pronto.",
      copycat: "Copiará la estrategia del jugador o del líder del sector esta semana.",
    };

    const threats: Record<string, string> = {
      apex_industries: "ALTO. Victoria Solano es despiadada. Prepararse para ataques directos.",
      reyes_hermanos: "MEDIO. Defensivos pero peligrosos si se les amenaza en su territorio.",
      novatech: "BAJO-MEDIO. Más interesada en innovar que en atacar. Posible aliado.",
      mercado_popular: "MEDIO. Oportunista peligroso en momentos de crisis. Sin ética.",
      greenfuture: "BAJO. No busca conflicto. Amenaza solo si el mercado verde explota.",
    };

    return {
      rivalId: rival.id,
      generatedDay: this._day,
      summary: `${rival.name} (${rival.ownerName}) opera en el sector ${rival.sector} con ${rival.workerCount} empleados y un patrimonio estimado de ${formatEuros(rival.netWorth)}. Personalidad: ${rival.personality}. Relación con el jugador: ${rival.relationship > 0 ? "positiva" : "negativa"} (${rival.relationship}).`,
      strengths: strengths.length > 0 ? strengths : ["Nada destacable en este momento."],
      weaknesses: weaknesses.length > 0 ? weaknesses : ["No se detectan debilidades claras."],
      recentMoves: rival.recentActions.slice(0, 3),
      predictedNextMove: predictedMoves[rival.personality],
      threatAssessment: threats[rival.id] ?? `DESCONOCIDO. Nivel de amenaza: ${rival.threatLevel}/100.`,
      financialEstimate: {
        estimatedCash: Math.round(rival.cash * (0.9 + Math.random() * 0.2)),
        estimatedNetWorth: Math.round(rival.netWorth * (0.85 + Math.random() * 0.3)),
        estimatedMonthlyRevenue: Math.round(rival.netWorth * 0.04),
      },
      cost: 500,
    };
  }

  /**
   * Improve relationship with a rival (via gift or partnership).
   */
  improveRelationship(rivalId: string, amount: number): string {
    const rival = this._rivals.find((r) => r.id === rivalId);
    if (!rival) return `Rival ${rivalId} no encontrado.`;

    const before = rival.relationship;
    rival.relationship = clamp(rival.relationship + amount, -100, 100);
    const change = rival.relationship - before;

    if (change > 0) {
      rival.threatLevel = clamp(rival.threatLevel - Math.round(change / 3), 0, 100);
      rival.recentActions.unshift(
        `${rival.ownerName} ha notado el gesto del jugador. La relación ha mejorado.`
      );
      return `Relación con ${rival.name} mejorada en ${change} puntos. Ahora: ${rival.relationship}.`;
    }
    return `Relación con ${rival.name} sin cambios.`;
  }

  /**
   * Declare a formal rivalry, triggering competitive events.
   */
  declareRivalry(rivalId: string): string[] {
    const rival = this._rivals.find((r) => r.id === rivalId);
    if (!rival) return [`Rival ${rivalId} no encontrado.`];

    rival.relationship = clamp(rival.relationship - 30, -100, 100);
    rival.threatLevel = clamp(rival.threatLevel + 20, 0, 100);
    rival.aggressionCooldown = 0;

    const events = [
      `Rivalidad declarada con ${rival.name}. ${rival.ownerName} ha aceptado el desafío públicamente.`,
      `La prensa económica cubre la guerra entre el jugador y ${rival.name}.`,
      `${rival.name} ha aumentado su agresividad tras la declaración de rivalidad.`,
    ];

    for (const evt of events) {
      this._eventLog.push({
        day: this._day,
        rivalId,
        description: evt,
        type: "attack",
        impactOnPlayer: -3,
      });
    }

    return events;
  }

  /**
   * Return all rivals + player ranked by netWorth.
   */
  getRankings(playerNetWorth: number, playerName: string): RivalRankingEntry[] {
    const entries: RivalRankingEntry[] = [
      {
        id: "player",
        name: playerName,
        ownerName: "Tú",
        netWorth: playerNetWorth,
        reputation: 0,
        sector: "varios",
        isPlayer: true,
        rank: 0,
        change: 0,
      },
      ...this._rivals.map((r) => ({
        id: r.id,
        name: r.name,
        ownerName: r.ownerName,
        netWorth: r.netWorth,
        reputation: r.reputation,
        sector: r.sector,
        isPlayer: false,
        rank: 0,
        change: 0,
      })),
    ];

    entries.sort((a, b) => b.netWorth - a.netWorth);
    entries.forEach((e, i) => {
      e.rank = i + 1;
      const prev = this._previousRankings.get(e.id);
      e.change = prev != null ? prev - (i + 1) : 0;
    });

    entries.forEach((e) => this._previousRankings.set(e.id, e.rank));

    return entries;
  }

  /**
   * Total market share held by rivals in a given product market.
   */
  getTotalRivalShareInMarket(productId: string): number {
    return this._rivals.reduce((sum, r) => sum + (r.marketShare[productId] ?? 0), 0);
  }

  /**
   * Get recent events, optionally filtered by rivalId.
   */
  getRecentEvents(count = 10, rivalId?: string): RivalEvent[] {
    const filtered = rivalId
      ? this._eventLog.filter((e) => e.rivalId === rivalId)
      : this._eventLog;
    return filtered.slice(-count).reverse();
  }

  // ── Private Helpers ───────────────────────────────────────

  private _baseGrowthRate(personality: RivalPersonality): number {
    switch (personality) {
      case "aggressive":   return 5;
      case "conservative": return 2;
      case "opportunist":  return 4;
      case "innovator":    return 3;
      case "copycat":      return 2.5;
      default:             return 2;
    }
  }

  private _dailyGrowthMultiplier(personality: RivalPersonality, phase: string): number {
    const isBoom   = phase === "boom" || phase === "growth";
    const isCrisis = phase === "recession" || phase === "crisis";

    const base: Record<RivalPersonality, number> = {
      aggressive:   isBoom ? 0.007 : isCrisis ? -0.003 : 0.003,
      conservative: isBoom ? 0.003 : isCrisis ? 0.001  : 0.002,
      opportunist:  isBoom ? 0.014 : isCrisis ? -0.011 : 0.004,
      innovator:    isBoom ? 0.005 : isCrisis ? 0.002  : 0.004,
      copycat:      isBoom ? 0.004 : isCrisis ? -0.002 : 0.003,
    };

    return (base[personality] ?? 0.002) + (Math.random() - 0.5) * 0.002;
  }

  private _levelThreshold(level: number): number {
    const thresholds = [0, 50_000, 120_000, 250_000, 500_000, 900_000, 1_500_000, 2_500_000, 4_000_000, 7_000_000];
    return thresholds[level] ?? 10_000_000;
  }

  private _updateCopycatStrategy(): void {
    const best = this.getRivalsByNetWorth()[0];
    const copycat = this._rivals.find((r) => r.personality === "copycat");
    if (!copycat || !best || copycat.id === best.id) return;

    copycat.currentStrategy = `Copiando la estrategia de ${best.name}: "${best.currentStrategy}"`;
    copycat.recentActions.unshift(
      `${copycat.name} ha adoptado la estrategia de ${best.name} esta semana.`
    );
    if (copycat.recentActions.length > 5) copycat.recentActions.pop();
  }

  private _updateThreatLevels(): void {
    for (const rival of this._rivals) {
      const wealthFactor = Math.min(rival.netWorth / 1_000_000, 1) * 30;
      const relFactor    = (rival.relationship / 100) * 15;
      rival.threatLevel  = clamp(Math.round(wealthFactor + (rival.level * 5) - relFactor), 0, 100);
    }
  }

  // ── Serialisation ─────────────────────────────────────────

  toJSON(): object {
    return {
      rivals: this._rivals,
      day: this._day,
      eventLog: this._eventLog.slice(-50),
      previousRankings: Array.from(this._previousRankings.entries()),
    };
  }

  static fromJSON(data: {
    rivals: RivalCompany[];
    day: number;
    eventLog: RivalEvent[];
    previousRankings: [string, number][];
  }): RivalManager {
    const mgr = new RivalManager();
    mgr._rivals = data.rivals ?? mgr._rivals;
    mgr._day = data.day ?? 1;
    mgr._eventLog = data.eventLog ?? [];
    mgr._previousRankings = new Map(data.previousRankings ?? []);
    return mgr;
  }
}

// ─── Standalone Helpers ───────────────────────────────────────

/**
 * Return a CSS color for a personality badge.
 */
export function getPersonalityColor(personality: RivalPersonality): string {
  switch (personality) {
    case "aggressive":   return "#ff1744";
    case "conservative": return "#00e676";
    case "opportunist":  return "#ffab40";
    case "innovator":    return "#00c9ff";
    case "copycat":      return "#ce93d8";
    default:             return "#7b8fa8";
  }
}

/**
 * Return a Spanish label for a rival personality.
 */
export function getPersonalityLabel(personality: RivalPersonality): string {
  switch (personality) {
    case "aggressive":   return "Agresivo";
    case "conservative": return "Conservador";
    case "opportunist":  return "Oportunista";
    case "innovator":    return "Innovador";
    case "copycat":      return "Imitador";
    default:             return personality;
  }
}

/**
 * Return a threat level label in Spanish.
 */
export function getThreatLabel(threatLevel: number): string {
  if (threatLevel >= 80) return "Crítico";
  if (threatLevel >= 60) return "Alto";
  if (threatLevel >= 40) return "Medio";
  if (threatLevel >= 20) return "Bajo";
  return "Mínimo";
}

/**
 * Return a CSS color for a threat level.
 */
export function getThreatColor(threatLevel: number): string {
  if (threatLevel >= 80) return "#ff1744";
  if (threatLevel >= 60) return "#ff6d00";
  if (threatLevel >= 40) return "#ffab40";
  if (threatLevel >= 20) return "#ffee58";
  return "#00e676";
}

/**
 * Return relationship label in Spanish.
 */
export function getRelationshipLabel(rel: number): string {
  if (rel >= 60)  return "Aliado";
  if (rel >= 30)  return "Amistoso";
  if (rel >= -10) return "Neutral";
  if (rel >= -40) return "Tenso";
  if (rel >= -70) return "Hostil";
  return "Enemigo declarado";
}
