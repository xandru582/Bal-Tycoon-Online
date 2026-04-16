// ============================================================
// NEXUS: Imperio del Mercado — B2B Contracts System
// ============================================================
// Full contract lifecycle: negotiation → active → completion
// Handles recurring revenue, penalties, performance tracking
// ============================================================

import { PRODUCTS } from "@/data/products";
import type { Product } from "@/types/index";

// ─── Contract Type Definitions ────────────────────────────────

export type ContractType =
  | "supply"
  | "distribution"
  | "licensing"
  | "exclusivity"
  | "joint_venture"
  | "franchise";

export type ContractStatus =
  | "available"
  | "negotiating"
  | "active"
  | "expiring"
  | "completed"
  | "breached";

export interface ContractRequirements {
  minQuality?: number;       // 0–100
  minQuantity?: number;      // units per month
  exclusivity?: boolean;     // player cannot serve competitors
  maxPrice?: number;         // price ceiling per unit (€)
}

export interface ContractPenalties {
  breach: number;            // one-time fee (€) for contract break
  delay: number;             // per-day penalty (€) for late delivery
  quality: number;           // per-unit penalty (€) for substandard goods
}

export interface ContractBonuses {
  earlyDelivery?: number;    // % payment bonus for early fulfillment
  overdelivery?: number;     // % bonus for exceeding minimums
  loyaltyYears?: number;     // years that trigger renewal bonus
}

export interface ContractOffer {
  id: string;
  counterpartyId: string;
  counterpartyName: string;
  type: ContractType;
  productId: string;
  monthlyValue: number;      // base payment (€/month)
  duration: number;          // contract length in months
  requirements: ContractRequirements;
  penalties: ContractPenalties;
  bonuses: ContractBonuses;
  expiresOn: number;         // game day when offer expires
  riskLevel: "low" | "medium" | "high";
  description: string;
}

export interface DeliveryRecord {
  day: number;
  quantity: number;
  quality: number;           // 0–100
  onTime: boolean;
  penaltyApplied: number;    // € penalty this delivery
  bonusApplied: number;      // € bonus this delivery
}

export interface ActiveContract extends ContractOffer {
  status: ContractStatus;
  startedOn: number;         // game day
  paymentsReceived: number;  // count of monthly payments received
  totalPaid: number;         // total € received so far
  performanceScore: number;  // 0–100, degrades on misses
  lastPaymentDay: number;
  deliveries: DeliveryRecord[];
  notes: string[];
  daysLate: number;          // accumulated late days (for penalties)
  pendingDeliveryUnits: number; // units still owed this month
}

export interface ContractTickResult {
  payments: number;          // € earned this tick
  penalties: number;         // € lost to penalties this tick
  events: string[];          // Spanish narrative events
  expiredIds: string[];      // contracts that expired
  breachedIds: string[];     // contracts that were auto-breached
}

// ─── Counterparty Data ────────────────────────────────────────

interface Counterparty {
  id: string;
  name: string;
  sector: string;
  preferredTypes: ContractType[];
  preferredProducts: string[];
  minReputation: number;     // reputation required to get offers
  maxDuration: number;       // max contract months this party signs
  paymentReliability: number; // 0–1, affects whether payments come on time
  backstory: string;
}

const COUNTERPARTIES: Counterparty[] = [
  {
    id: "distribuidora_madrid",
    name: "Distribuidora Madrid S.L.",
    sector: "distribucion",
    preferredTypes: ["supply", "distribution"],
    preferredProducts: ["alimentos_procesados", "bebidas", "snacks"],
    minReputation: 0,
    maxDuration: 12,
    paymentReliability: 0.95,
    backstory: "Red de distribución con 200 puntos de venta en la Comunidad de Madrid.",
  },
  {
    id: "retail_nacional",
    name: "Retail Nacional S.A.",
    sector: "retail",
    preferredTypes: ["supply", "exclusivity"],
    preferredProducts: ["ropa_casual", "accesorios", "gadgets"],
    minReputation: 20,
    maxDuration: 18,
    paymentReliability: 0.9,
    backstory: "Cadena de tiendas con presencia en 15 provincias españolas.",
  },
  {
    id: "foodcorp_espana",
    name: "FoodCorp España",
    sector: "alimentacion",
    preferredTypes: ["supply", "joint_venture"],
    preferredProducts: ["alimentos_procesados", "materias_primas", "bebidas"],
    minReputation: 10,
    maxDuration: 24,
    paymentReliability: 0.98,
    backstory: "Multinacional alimentaria. Proveedores exigentes pero muy puntuales con los pagos.",
  },
  {
    id: "techdistrib",
    name: "TechDistrib Iberia",
    sector: "tecnologia",
    preferredTypes: ["distribution", "licensing"],
    preferredProducts: ["hardware", "software", "gadgets", "componentes"],
    minReputation: 30,
    maxDuration: 12,
    paymentReliability: 0.88,
    backstory: "Distribuidor tecnológico líder. Muy exigente con calidad y plazos.",
  },
  {
    id: "moda_iberica",
    name: "Moda Ibérica Group",
    sector: "moda",
    preferredTypes: ["supply", "franchise", "exclusivity"],
    preferredProducts: ["ropa_lujo", "ropa_casual", "accesorios"],
    minReputation: 25,
    maxDuration: 18,
    paymentReliability: 0.92,
    backstory: "Grupo de moda con marcas propias. Buscan proveedores nacionales de calidad.",
  },
  {
    id: "energiaplus",
    name: "EnergíaPlus Renovables",
    sector: "energia",
    preferredTypes: ["joint_venture", "supply"],
    preferredProducts: ["energia_solar", "componentes", "materias_primas"],
    minReputation: 15,
    maxDuration: 24,
    paymentReliability: 0.93,
    backstory: "Startup energética en plena expansión. Buenos pagadores a largo plazo.",
  },
  {
    id: "supermercados_corona",
    name: "Supermercados Corona",
    sector: "alimentacion",
    preferredTypes: ["supply", "distribution"],
    preferredProducts: ["alimentos_procesados", "bebidas", "productos_frescos"],
    minReputation: 0,
    maxDuration: 6,
    paymentReliability: 0.97,
    backstory: "Cadena regional de supermercados. Contratos cortos pero muy estables.",
  },
  {
    id: "hospitalidad_norte",
    name: "Hospitalidad Norte S.L.",
    sector: "hosteleria",
    preferredTypes: ["supply"],
    preferredProducts: ["alimentos_procesados", "bebidas", "textiles"],
    minReputation: 0,
    maxDuration: 12,
    paymentReliability: 0.85,
    backstory: "Grupo hotelero del norte de España. A veces pagan tarde.",
  },
  {
    id: "constructora_ibex",
    name: "Constructora Ibex",
    sector: "construccion",
    preferredTypes: ["supply", "joint_venture"],
    preferredProducts: ["materiales_construccion", "materias_primas", "energia"],
    minReputation: 20,
    maxDuration: 18,
    paymentReliability: 0.8,
    backstory: "Gran constructora con proyectos nacionales. Pagos irregulares pero cuantías altas.",
  },
  {
    id: "farmanueva",
    name: "FarmaNew S.A.",
    sector: "salud",
    preferredTypes: ["licensing", "supply"],
    preferredProducts: ["medicamentos", "suplementos", "equipos_medicos"],
    minReputation: 40,
    maxDuration: 24,
    paymentReliability: 0.99,
    backstory: "Laboratorio farmacéutico. Contratos exigentes pero los mejores pagadores del sector.",
  },
  {
    id: "mediaglobal",
    name: "MediaGlobal España",
    sector: "entretenimiento",
    preferredTypes: ["licensing", "joint_venture"],
    preferredProducts: ["contenido_digital", "software", "publicidad"],
    minReputation: 35,
    maxDuration: 12,
    paymentReliability: 0.87,
    backstory: "Grupo mediático en busca de licencias y contenidos exclusivos.",
  },
  {
    id: "logistica_sur",
    name: "Logística del Sur S.L.",
    sector: "logistica",
    preferredTypes: ["supply", "distribution"],
    preferredProducts: ["materias_primas", "alimentos_procesados"],
    minReputation: 5,
    maxDuration: 12,
    paymentReliability: 0.91,
    backstory: "Operador logístico andaluz con rutas a todo el sur de España.",
  },
  {
    id: "banco_nexia",
    name: "Banco Nexia",
    sector: "finanzas",
    preferredTypes: ["joint_venture", "licensing"],
    preferredProducts: ["software", "servicios_financieros"],
    minReputation: 50,
    maxDuration: 24,
    paymentReliability: 1.0,
    backstory: "Entidad financiera interesada en alianzas tecnológicas. Solo trabaja con empresas sólidas.",
  },
  {
    id: "agroiberica",
    name: "AgroIbérica Cooperativa",
    sector: "agricultura",
    preferredTypes: ["supply", "joint_venture"],
    preferredProducts: ["materias_primas", "productos_frescos"],
    minReputation: 0,
    maxDuration: 6,
    paymentReliability: 0.88,
    backstory: "Cooperativa agrícola. Ofrecen materias primas a buen precio con contratos cortos.",
  },
  {
    id: "telecomunica",
    name: "TeleComAvanT",
    sector: "telecomunicaciones",
    preferredTypes: ["distribution", "licensing", "franchise"],
    preferredProducts: ["hardware", "software", "gadgets"],
    minReputation: 30,
    maxDuration: 18,
    paymentReliability: 0.94,
    backstory: "Operador de telecomunicaciones que busca distribuidores de dispositivos.",
  },
];

// ─── Contract Type Descriptions ───────────────────────────────

const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  supply: "Suministro",
  distribution: "Distribución",
  licensing: "Licencia",
  exclusivity: "Exclusividad",
  joint_venture: "Joint Venture",
  franchise: "Franquicia",
};

const CONTRACT_TYPE_DESCRIPTIONS: Record<ContractType, string> = {
  supply:
    "Acuerdo de suministro regular de productos. Pagos mensuales garantizados a cambio de entregas puntuales.",
  distribution:
    "Contrato de distribución exclusiva. Tu empresa distribuye los productos del cliente en una región.",
  licensing:
    "Licencia de uso de tu propiedad intelectual o marca. Ingresos pasivos sin necesidad de producción.",
  exclusivity:
    "Acuerdo de exclusividad total. No puedes servir a competidores durante la vigencia.",
  joint_venture:
    "Empresa conjunta para un proyecto específico. Alto riesgo, alta recompensa.",
  franchise:
    "Tu empresa adopta o vende una franquicia. Flujo estable pero con restricciones operativas.",
};

// ─── Utility Functions ────────────────────────────────────────

function generateId(): string {
  return `CTR-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

function weightedRandom<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickNRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

// ─── Contract Manager ─────────────────────────────────────────

export class ContractManager {
  private _available: ContractOffer[];
  private _active: ActiveContract[];
  private _history: ActiveContract[];
  private _nextRefreshDay: number;

  // ── Construction ──────────────────────────────────────────

  constructor() {
    this._available = [];
    this._active = [];
    this._history = [];
    this._nextRefreshDay = 1;

    // Seed with 8 initial offers visible from day 1
    this._available = this._generateInitialOffers();
  }

  // ── Getters ───────────────────────────────────────────────

  get available(): ContractOffer[] {
    return [...this._available];
  }

  get active(): ActiveContract[] {
    return [...this._active];
  }

  get history(): ActiveContract[] {
    return [...this._history];
  }

  // ── Public API: Offer Management ──────────────────────────

  /**
   * Called periodically to refresh the pool of available contract offers.
   * Higher reputation unlocks better counterparties and higher monthly values.
   */
  refreshAvailable(playerSector: string, day: number, reputation: number): ContractOffer[] {
    if (day < this._nextRefreshDay) return this._available;

    // Remove expired offers
    this._available = this._available.filter((o) => o.expiresOn > day);

    // Generate 3–5 new contracts depending on reputation
    const newCount = reputation >= 60 ? 5 : reputation >= 30 ? 4 : 3;

    // Eligible counterparties based on reputation threshold
    const eligible = COUNTERPARTIES.filter((c) => c.minReputation <= reputation);

    for (let i = 0; i < newCount; i++) {
      const party = pickRandom(eligible);
      const type = pickRandom(party.preferredTypes);
      const offer = this.generateOffer(type, playerSector, day, reputation, party);
      this._available.push(offer);
    }

    this._nextRefreshDay = day + 7; // refresh weekly
    return this._available;
  }

  /**
   * Generate a single contract offer.
   * Monthly value scales with reputation (€500 base → €15,000 at rep 100).
   */
  generateOffer(
    type: ContractType,
    sector: string,
    day: number,
    reputation: number,
    party?: Counterparty
  ): ContractOffer {
    const counterparty = party ?? pickRandom(COUNTERPARTIES);

    // Monthly value: exponential scaling with reputation
    const repFactor = clamp(reputation / 100, 0, 1);
    const baseValue = lerp(500, 15000, repFactor * repFactor);
    const varianceFactor = 0.8 + Math.random() * 0.4; // ±20%
    const monthlyValue = Math.round(baseValue * varianceFactor);

    // Duration: short contracts available early, long ones need reputation
    const maxDur = Math.min(counterparty.maxDuration, reputation >= 50 ? 24 : reputation >= 25 ? 12 : 6);
    const minDur = 3;
    const duration = minDur + Math.floor(Math.random() * (maxDur - minDur + 1));

    // Quality requirements scale with counterparty prestige
    const minQuality = counterparty.minReputation > 30
      ? 60 + Math.floor(Math.random() * 25)
      : 40 + Math.floor(Math.random() * 30);

    // Min quantity: 10–200 units depending on contract size
    const minQuantity = 10 + Math.floor((monthlyValue / 15000) * 190);

    // Penalties: bigger contracts → heavier penalties
    const breachPenalty = Math.round(monthlyValue * (1.5 + Math.random() * 1.5));
    const delayPenalty = Math.round(monthlyValue * 0.01);
    const qualityPenalty = Math.round(monthlyValue * 0.005);

    // Risk level based on penalty/value ratio
    const penaltyRatio = breachPenalty / monthlyValue;
    const riskLevel: ContractOffer["riskLevel"] =
      penaltyRatio >= 3 ? "high" : penaltyRatio >= 2 ? "medium" : "low";

    // Optional bonuses for attractive offers
    const bonuses: ContractBonuses = {};
    if (Math.random() > 0.5) bonuses.earlyDelivery = Math.round(2 + Math.random() * 8);
    if (Math.random() > 0.6) bonuses.overdelivery = Math.round(3 + Math.random() * 7);
    if (duration >= 12 && Math.random() > 0.5) bonuses.loyaltyYears = Math.floor(duration / 12);

    // Pick a product from counterparty preferences or fallback
    const productId =
      counterparty.preferredProducts.length > 0
        ? pickRandom(counterparty.preferredProducts)
        : "alimentos_procesados";

    const exclusivity = type === "exclusivity" || (type === "franchise" && Math.random() > 0.5);

    return {
      id: generateId(),
      counterpartyId: counterparty.id,
      counterpartyName: counterparty.name,
      type,
      productId,
      monthlyValue,
      duration,
      requirements: {
        minQuality,
        minQuantity,
        exclusivity,
        maxPrice: exclusivity ? Math.round(monthlyValue / minQuantity) : undefined,
      },
      penalties: {
        breach: breachPenalty,
        delay: delayPenalty,
        quality: qualityPenalty,
      },
      bonuses,
      expiresOn: day + 14 + Math.floor(Math.random() * 14), // 2–4 weeks to decide
      riskLevel,
      description: this._buildDescription(counterparty, type, monthlyValue, duration),
    };
  }

  /**
   * Accept a contract offer and move it to the active pool.
   * Returns the created ActiveContract or null if offer not found.
   */
  acceptContract(offerId: string, day: number): ActiveContract | null {
    const idx = this._available.findIndex((o) => o.id === offerId);
    if (idx === -1) return null;

    const offer = this._available[idx];
    this._available.splice(idx, 1);

    const active: ActiveContract = {
      ...offer,
      status: "active",
      startedOn: day,
      paymentsReceived: 0,
      totalPaid: 0,
      performanceScore: 100,
      lastPaymentDay: day,
      deliveries: [],
      notes: [`Contrato iniciado el día ${day}.`],
      daysLate: 0,
      pendingDeliveryUnits: offer.requirements.minQuantity ?? 0,
    };

    this._active.push(active);
    return active;
  }

  /**
   * Decline a contract offer and remove it from the available pool.
   */
  declineContract(offerId: string): boolean {
    const idx = this._available.findIndex((o) => o.id === offerId);
    if (idx === -1) return false;
    this._available.splice(idx, 1);
    return true;
  }

  // ── Tick: Daily Processing ─────────────────────────────────

  /**
   * Main tick called every game day.
   * Processes payments, late penalties, expiry and generates events.
   */
  tick(
    day: number,
    playerCash: number,
    playerInventory: Record<string, number>
  ): ContractTickResult {
    const result: ContractTickResult = {
      payments: 0,
      penalties: 0,
      events: [],
      expiredIds: [],
      breachedIds: [],
    };

    const toArchive: string[] = [];

    for (const contract of this._active) {
      const endDay = contract.startedOn + contract.duration * 30;
      const daysActive = day - contract.startedOn;

      // ── Expiry check ────────────────────────────────────────
      if (day >= endDay) {
        if (contract.status !== "breached" && contract.status !== "completed") {
          contract.status = "completed";
          contract.notes.push(`Contrato completado el día ${day} con éxito.`);
          result.events.push(
            `✔ Contrato con ${contract.counterpartyName} completado. Puntuación: ${contract.performanceScore}/100.`
          );
          result.expiredIds.push(contract.id);
          toArchive.push(contract.id);
        }
        continue;
      }

      // ── Mark as expiring in last 30 days ───────────────────
      if (endDay - day <= 30 && contract.status === "active") {
        contract.status = "expiring";
        result.events.push(
          `⚠ Contrato con ${contract.counterpartyName} vence en ${endDay - day} días.`
        );
      }

      // ── Monthly payment (every 30 days) ───────────────────
      if (daysActive > 0 && daysActive % 30 === 0) {
        const expectedMonth = Math.floor(daysActive / 30);
        if (contract.paymentsReceived < expectedMonth) {
          // Check if delivery requirements were met this month
          const monthStart = contract.startedOn + (expectedMonth - 1) * 30;
          const monthDeliveries = contract.deliveries.filter(
            (d) => d.day >= monthStart && d.day < monthStart + 30
          );
          const totalDelivered = monthDeliveries.reduce((s, d) => s + d.quantity, 0);
          const minRequired = contract.requirements.minQuantity ?? 0;

          if (totalDelivered >= minRequired || minRequired === 0) {
            // Payment issued
            let payment = contract.monthlyValue;

            // Early delivery bonus
            if (contract.bonuses.earlyDelivery && contract.daysLate === 0) {
              const bonus = Math.round(payment * (contract.bonuses.earlyDelivery / 100));
              payment += bonus;
              result.events.push(
                `💰 Bonus de entrega anticipada de ${contract.counterpartyName}: +€${bonus.toLocaleString("es-ES")}`
              );
            }

            // Overdelivery bonus
            if (
              contract.bonuses.overdelivery &&
              minRequired > 0 &&
              totalDelivered >= minRequired * 1.2
            ) {
              const bonus = Math.round(payment * (contract.bonuses.overdelivery / 100));
              payment += bonus;
              result.events.push(
                `📦 Bonus por volumen extra de ${contract.counterpartyName}: +€${bonus.toLocaleString("es-ES")}`
              );
            }

            contract.paymentsReceived++;
            contract.totalPaid += payment;
            contract.lastPaymentDay = day;
            contract.pendingDeliveryUnits = minRequired; // reset for next month
            result.payments += payment;
            result.events.push(
              `💳 ${contract.counterpartyName} ha pagado €${payment.toLocaleString("es-ES")} (mes ${expectedMonth}/${contract.duration}).`
            );
          } else {
            // Short delivery — partial penalty and performance hit
            const shortfall = minRequired - totalDelivered;
            const penalty = Math.round(shortfall * (contract.penalties.quality ?? 0));

            contract.performanceScore = clamp(contract.performanceScore - 10, 0, 100);
            result.penalties += penalty;
            contract.notes.push(
              `Entrega corta mes ${expectedMonth}: ${totalDelivered}/${minRequired} unidades. Penalización: €${penalty}.`
            );
            result.events.push(
              `❌ Entrega incompleta a ${contract.counterpartyName}: ${shortfall} unidades faltantes. Penalización: €${penalty.toLocaleString("es-ES")}.`
            );

            // Auto-breach if performance drops too low
            if (contract.performanceScore <= 20) {
              this._autoBreachContract(contract, day, result);
              result.breachedIds.push(contract.id);
              toArchive.push(contract.id);
            }
          }
        }
      }

      // ── Late delivery penalty accrual ─────────────────────
      if (contract.pendingDeliveryUnits > 0 && daysActive > 0) {
        const dayInMonth = daysActive % 30;
        if (dayInMonth > 25) {
          // Last 5 days of month with pending units → late
          contract.daysLate++;
          const latePenalty = contract.penalties.delay;
          result.penalties += latePenalty;
          if (dayInMonth === 26) {
            result.events.push(
              `🕐 ${contract.counterpartyName}: entrega retrasada. Penalización diaria: €${latePenalty.toLocaleString("es-ES")}.`
            );
          }
        }
      } else {
        contract.daysLate = 0; // reset if deliveries are on track
      }
    }

    // Archive completed/breached contracts
    for (const id of toArchive) {
      const idx = this._active.findIndex((c) => c.id === id);
      if (idx !== -1) {
        this._history.push(this._active[idx]);
        this._active.splice(idx, 1);
      }
    }

    return result;
  }

  // ── Delivery & Breach ────────────────────────────────────

  /**
   * Record a delivery for a specific contract.
   * Updates performanceScore and pendingDeliveryUnits.
   */
  fulfillDelivery(contractId: string, quantity: number, quality: number, currentDay = 0): string {
    const contract = this._active.find((c) => c.id === contractId);
    if (!contract) return `Contrato ${contractId} no encontrado.`;

    const minQuality = contract.requirements.minQuality ?? 50;
    const minQuantity = contract.requirements.minQuantity ?? 0;

    let penaltyApplied = 0;
    let bonusApplied = 0;
    const qualityOk = quality >= minQuality;

    if (!qualityOk) {
      const deficit = minQuality - quality;
      penaltyApplied = Math.round(quantity * contract.penalties.quality * (deficit / 100));
      contract.performanceScore = clamp(contract.performanceScore - 5, 0, 100);
    } else {
      // Quality above minimum boosts score
      contract.performanceScore = clamp(contract.performanceScore + 2, 0, 100);
    }

    contract.pendingDeliveryUnits = Math.max(0, contract.pendingDeliveryUnits - quantity);

    const record: DeliveryRecord = {
      day: currentDay,
      quantity,
      quality,
      onTime: contract.pendingDeliveryUnits <= 0,
      penaltyApplied,
      bonusApplied,
    };

    contract.deliveries.push(record);

    const message = qualityOk
      ? `Entrega registrada: ${quantity} unidades (calidad ${quality}/100) a ${contract.counterpartyName}.`
      : `Entrega con penalización: calidad ${quality}/${minQuality} mínimo. Penalización: €${penaltyApplied}.`;

    contract.notes.push(message);
    return message;
  }

  /**
   * Manually breach a contract. Applies the full breach penalty.
   * Returns the penalty amount.
   */
  breachContract(contractId: string): number {
    const idx = this._active.findIndex((c) => c.id === contractId);
    if (idx === -1) return 0;

    const contract = this._active[idx];
    const penalty = contract.penalties.breach;

    contract.status = "breached";
    contract.notes.push(`Contrato rescindido manualmente. Penalización aplicada: €${penalty}.`);

    this._history.push(contract);
    this._active.splice(idx, 1);

    return penalty;
  }

  // ── Analytics ─────────────────────────────────────────────

  /**
   * Monthly Recurring Revenue from all active contracts.
   */
  getMonthlyRecurringRevenue(): number {
    return this._active
      .filter((c) => c.status === "active" || c.status === "expiring")
      .reduce((sum, c) => sum + c.monthlyValue, 0);
  }

  /**
   * Filter active contracts by status.
   */
  getContractsByStatus(status: ContractStatus): ActiveContract[] {
    return this._active.filter((c) => c.status === status);
  }

  /**
   * Total potential financial exposure if all active contracts were breached.
   */
  getTotalPenaltiesRisk(): number {
    return this._active.reduce((sum, c) => sum + c.penalties.breach, 0);
  }

  /**
   * Total value of a contract over its full duration.
   */
  calculateContractValue(contract: ContractOffer): number {
    return contract.monthlyValue * contract.duration;
  }

  /**
   * Return total estimated value of all active contracts.
   */
  getTotalActiveContractValue(): number {
    return this._active.reduce((sum, c) => {
      const remaining = c.duration - c.paymentsReceived;
      return sum + c.monthlyValue * remaining;
    }, 0);
  }

  /**
   * Average performance score across all active contracts.
   */
  getAveragePerformanceScore(): number {
    if (this._active.length === 0) return 100;
    const total = this._active.reduce((s, c) => s + c.performanceScore, 0);
    return Math.round(total / this._active.length);
  }

  /**
   * Count contracts by type.
   */
  getContractCountByType(): Record<ContractType, number> {
    const result: Record<ContractType, number> = {
      supply: 0,
      distribution: 0,
      licensing: 0,
      exclusivity: 0,
      joint_venture: 0,
      franchise: 0,
    };
    for (const c of this._active) {
      result[c.type]++;
    }
    return result;
  }

  /**
   * Best performing contracts (score >= 80, sorted by monthly value).
   */
  getBestContracts(): ActiveContract[] {
    return this._active
      .filter((c) => c.performanceScore >= 80)
      .sort((a, b) => b.monthlyValue - a.monthlyValue);
  }

  /**
   * At-risk contracts (performance score <= 40).
   */
  getAtRiskContracts(): ActiveContract[] {
    return this._active.filter((c) => c.performanceScore <= 40);
  }

  /**
   * Get a summary string (Spanish) for UI display.
   */
  getSummaryText(): string {
    const mrr = this.getMonthlyRecurringRevenue();
    const count = this._active.length;
    const atRisk = this.getAtRiskContracts().length;
    const expiring = this.getContractsByStatus("expiring").length;

    let text = `${count} contrato${count !== 1 ? "s" : ""} activo${count !== 1 ? "s" : ""}. `;
    text += `Ingresos recurrentes: €${mrr.toLocaleString("es-ES")}/mes. `;
    if (atRisk > 0) text += `⚠ ${atRisk} en riesgo. `;
    if (expiring > 0) text += `⏳ ${expiring} próximo${expiring !== 1 ? "s" : ""} a vencer.`;
    return text.trim();
  }

  /**
   * Get a counterparty by ID.
   */
  getCounterparty(id: string): Counterparty | undefined {
    return COUNTERPARTIES.find((c) => c.id === id);
  }

  // ── Private Helpers ───────────────────────────────────────

  private _autoBreachContract(
    contract: ActiveContract,
    day: number,
    result: ContractTickResult
  ): void {
    contract.status = "breached";
    contract.notes.push(
      `Contrato incumplido automáticamente el día ${day} por rendimiento bajo (${contract.performanceScore}/100).`
    );
    result.penalties += contract.penalties.breach;
    result.events.push(
      `💥 Contrato con ${contract.counterpartyName} INCUMPLIDO. Penalización: €${contract.penalties.breach.toLocaleString("es-ES")}.`
    );
  }

  private _buildDescription(
    party: Counterparty,
    type: ContractType,
    monthlyValue: number,
    duration: number
  ): string {
    const typeLabel = CONTRACT_TYPE_LABELS[type];
    const totalValue = monthlyValue * duration;
    return (
      `${party.name} solicita un contrato de ${typeLabel.toLowerCase()} ` +
      `por ${duration} meses a €${monthlyValue.toLocaleString("es-ES")}/mes ` +
      `(valor total: €${totalValue.toLocaleString("es-ES")}). ` +
      party.backstory
    );
  }

  private _generateInitialOffers(): ContractOffer[] {
    const day = 1;
    const reputation = 10; // starting reputation

    // Ensure variety: one per major sector
    const initialParties: Counterparty[] = pickNRandom(
      COUNTERPARTIES.filter((c) => c.minReputation <= reputation),
      8
    );

    return initialParties.map((party) => {
      const type = pickRandom(party.preferredTypes);
      return this.generateOffer(type, "general", day, reputation, party);
    });
  }

  // ── Serialisation ─────────────────────────────────────────

  toJSON(): object {
    return {
      available: this._available,
      active: this._active,
      history: this._history,
      nextRefreshDay: this._nextRefreshDay,
    };
  }

  static fromJSON(data: {
    available: ContractOffer[];
    active: ActiveContract[];
    history: ActiveContract[];
    nextRefreshDay: number;
  }): ContractManager {
    const mgr = new ContractManager();
    // Override the constructor-generated offers with saved state
    mgr._available = data.available ?? [];
    mgr._active = data.active ?? [];
    mgr._history = data.history ?? [];
    mgr._nextRefreshDay = data.nextRefreshDay ?? 1;
    return mgr;
  }
}

// ─── Standalone Helpers (used by UI) ──────────────────────────

/**
 * Return a human-readable contract type label in Spanish.
 */
export function getContractTypeLabel(type: ContractType): string {
  return CONTRACT_TYPE_LABELS[type] ?? type;
}

/**
 * Return a description of the contract type in Spanish.
 */
export function getContractTypeDescription(type: ContractType): string {
  return CONTRACT_TYPE_DESCRIPTIONS[type] ?? "";
}

/**
 * Return a CSS color code for the given risk level.
 */
export function getRiskColor(risk: ContractOffer["riskLevel"]): string {
  switch (risk) {
    case "low":    return "#00e676";
    case "medium": return "#ffab40";
    case "high":   return "#ff1744";
    default:       return "#7b8fa8";
  }
}

/**
 * Return a CSS color for a contract status badge.
 */
export function getStatusColor(status: ContractStatus): string {
  switch (status) {
    case "available":   return "#00c9ff";
    case "negotiating": return "#ffab40";
    case "active":      return "#00e676";
    case "expiring":    return "#ff6d00";
    case "completed":   return "#7b8fa8";
    case "breached":    return "#ff1744";
    default:            return "#7b8fa8";
  }
}

/**
 * Format a monthly value into an MRR badge string.
 */
export function formatMRR(value: number): string {
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M/mes`;
  if (value >= 1_000)     return `€${(value / 1_000).toFixed(1)}k/mes`;
  return `€${value.toLocaleString("es-ES")}/mes`;
}

/**
 * Calculate how many days remain on a contract.
 */
export function contractDaysRemaining(contract: ActiveContract, currentDay: number): number {
  const endDay = contract.startedOn + contract.duration * 30;
  return Math.max(0, endDay - currentDay);
}

/**
 * Describe contract performance in Spanish.
 */
export function describePerformance(score: number): string {
  if (score >= 90) return "Excelente";
  if (score >= 75) return "Bueno";
  if (score >= 55) return "Aceptable";
  if (score >= 35) return "Deficiente";
  return "Crítico";
}

// Export counterparty list for UI usage
export { COUNTERPARTIES, CONTRACT_TYPE_LABELS, type Counterparty };
