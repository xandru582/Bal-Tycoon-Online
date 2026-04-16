// ============================================================
// NEXUS: Imperio del Mercado — Company Management
// ============================================================

import type {
  Worker,
  Facility,
  Contract,
  EconomicIndicators,
} from "@/types/index";
import {
  WorkerSkill,
  ContractStatus,
  ProductCategory,
} from "@/types/index";
import { PRODUCTS } from "@/data/products";

// ─── Worker Types & Costs ─────────────────────────────────────

export enum WorkerType {
  Junior = "junior",
  Senior = "senior",
  Manager = "manager",
  Specialist = "specialist",
}

export const WORKER_SALARY: Record<WorkerType, number> = {
  [WorkerType.Junior]: 800,
  [WorkerType.Senior]: 2000,
  [WorkerType.Manager]: 3500,
  [WorkerType.Specialist]: 4500,
};

export const WORKER_HIRING_COST: Record<WorkerType, number> = {
  [WorkerType.Junior]: 500,
  [WorkerType.Senior]: 1500,
  [WorkerType.Manager]: 3000,
  [WorkerType.Specialist]: 5000,
};

const WORKER_FIRST_NAMES = ["Elena", "Pedro", "Lucia", "Marcos", "Sofia", "Diego", "Carmen", "Rafael", "Ana", "Jorge", "Isabel", "Miguel", "Laura", "Carlos", "Marta"];
const WORKER_LAST_NAMES = ["García", "López", "Martínez", "Sánchez", "Torres", "Ramírez", "Flores", "Morales", "Jiménez", "Rivas", "Herrera", "Castro", "Vega", "Medina", "Ortiz"];

// ─── Facility Templates ───────────────────────────────────────

export interface FacilityTemplate {
  type: Facility["type"];
  name: string;
  purchaseCost: number;
  monthlyCost: number;
  capacity: number;
  productionBonus: number;
  description: string;
}

export const FACILITY_TEMPLATES: Record<string, FacilityTemplate> = {
  taller_pequeno: {
    type: "factory",
    name: "Taller Pequeño",
    purchaseCost: 5000,
    monthlyCost: 400,
    capacity: 50,
    productionBonus: 1.10,
    description: "Un pequeño taller de producción artesanal.",
  },
  oficina: {
    type: "office",
    name: "Oficina Estándar",
    purchaseCost: 8000,
    monthlyCost: 600,
    capacity: 10,
    productionBonus: 1.15,
    description: "Espacio de oficina para gestión y servicios.",
  },
  fabrica: {
    type: "factory",
    name: "Fábrica Industrial",
    purchaseCost: 25000,
    monthlyCost: 1800,
    capacity: 300,
    productionBonus: 1.40,
    description: "Producción industrial a gran escala.",
  },
  almacen: {
    type: "warehouse",
    name: "Almacén Logístico",
    purchaseCost: 15000,
    monthlyCost: 900,
    capacity: 500,
    productionBonus: 1.05,
    description: "Almacén para gestión de inventario y distribución.",
  },
  laboratorio: {
    type: "lab",
    name: "Laboratorio de I+D",
    purchaseCost: 20000,
    monthlyCost: 1400,
    capacity: 20,
    productionBonus: 1.30,
    description: "Centro de investigación y desarrollo de productos.",
  },
};

// ─── Financial History Entry ──────────────────────────────────

export interface DailyFinancialRecord {
  day: number;
  revenue: number;
  expenses: number;
  profit: number;
  cash: number;
}

export interface DailyTickResult {
  revenue: number;
  expenses: number;
  profit: number;
  events: string[];
}

export interface FinancialSummary {
  revenue30d: number;
  expenses30d: number;
  profit30d: number;
  growthPercent: number;
  profitMargin: number;
  averageDailyRevenue: number;
}

// ─── Company Class ────────────────────────────────────────────

export class Company {
  id: string;
  name: string;
  ownerId: string;
  sector: ProductCategory;
  cash: number;
  revenue: number;
  expenses: number;
  reputation: Record<ProductCategory, number>;
  workers: Worker[];
  facilities: Facility[];
  activeContracts: Contract[];
  inventory: Map<string, number>;
  level: number;
  xp: number;
  bonuses: Record<string, number>;
  financialHistory: DailyFinancialRecord[];
  currentDay: number;
  dailyPnL: number;
  esgScore: number;
  totalDebts: number;
  isPublic: boolean;
  stockSymbol?: string;

  // Production queue: { productId, quantity, daysRemaining, totalDays }
  productionQueue: Array<{ productId: string; quantity: number; daysRemaining: number; totalDays: number; facilityId: string }>;

  constructor(id: string, name: string, ownerId: string, sector: ProductCategory, startingCash: number) {
    this.id = id;
    this.name = name;
    this.ownerId = ownerId;
    this.sector = sector;
    this.cash = startingCash;
    this.revenue = 0;
    this.expenses = 0;
    this.reputation = {} as Record<ProductCategory, number>;
    for (const cat of Object.values(ProductCategory)) {
      this.reputation[cat] = cat === sector ? 30 : 10;
    }
    this.workers = [];
    this.facilities = [];
    this.activeContracts = [];
    this.inventory = new Map();
    this.level = 1;
    this.xp = 0;
    this.bonuses = {};
    this.financialHistory = [];
    this.currentDay = 1;
    this.dailyPnL = 0;
    this.esgScore = 0;
    this.totalDebts = 0;
    this.isPublic = false;
    this.productionQueue = [];
  }

  // ─── Daily Tick ─────────────────────────────────────────────

  dailyTick(): DailyTickResult {
    const events: string[] = [];
    let dailyRevenue = 0;
    let dailyExpenses = 0;

    // --- Worker XP and salaries (prorated daily) ---
    for (const worker of this.workers) {
      const dailySalary = worker.salary / 30;
      dailyExpenses += dailySalary;

      // XP gain
      const xpGain = 0.5 + worker.skillLevel * 0.1 + (worker.morale / 100) * 0.4;
      const workerXP = (worker as any).xp ?? 0;
      (worker as any).xp = workerXP + xpGain;

      // Level-up threshold: 100 XP per level
      const workerLevel = (worker as any).workerLevel ?? 1;
      if ((worker as any).xp >= workerLevel * 100) {
        worker.skillLevel = Math.min(10, worker.skillLevel + 0.1);
        (worker as any).workerLevel = workerLevel + 1;
        worker.morale = Math.min(100, worker.morale + 5);
        events.push(`${worker.name} ha mejorado sus habilidades (nivel ${(worker as any).workerLevel})`);
      }

      // Morale drift (unbiased ±1 per day)
      worker.morale = Math.max(20, Math.min(100, worker.morale + (Math.random() - 0.5) * 2));
      worker.productivity = Math.round((worker.morale / 100) * worker.skillLevel * 10);
    }

    // --- Facility maintenance ---
    for (const facility of this.facilities) {
      const dailyMaintenance = facility.monthlyCost / 30;
      dailyExpenses += dailyMaintenance;

      // Utilization drift
      facility.currentUtilization = Math.max(
        0,
        Math.min(facility.capacity, facility.currentUtilization + (Math.random() - 0.5) * 5)
      );
    }

    // --- Process production queue ---
    const completedProduction: typeof this.productionQueue[0][] = [];
    const stillProcessing: typeof this.productionQueue[0][] = [];

    for (const task of this.productionQueue) {
      task.daysRemaining -= 1;
      if (task.daysRemaining <= 0) {
        completedProduction.push(task);
      } else {
        stillProcessing.push(task);
      }
    }

    for (const task of completedProduction) {
      const existing = this.inventory.get(task.productId) ?? 0;
      this.inventory.set(task.productId, existing + task.quantity);
      const product = PRODUCTS[task.productId];
      events.push(`Producción completada: ${task.quantity}x ${product?.name ?? task.productId}`);
    }
    this.productionQueue = stillProcessing;

    // --- Contract payments ---
    for (const contract of this.activeContracts) {
      if (contract.status !== ContractStatus.Active) continue;
      if (contract.endDay < this.currentDay) {
        contract.status = ContractStatus.Completed;
        events.push(`Contrato completado: ${contract.id}`);
        continue;
      }
      // Monthly payment converted to daily
      const dailyPayment = contract.valuePerMonth / 30;
      if (contract.partyA === this.id) {
        dailyExpenses += dailyPayment;
      } else {
        dailyRevenue += dailyPayment;
      }
    }

    // --- Passive reputation decay (reduced to 0.01/day = ~3.65/year so multi-sector play is viable) ---
    for (const cat of Object.values(ProductCategory)) {
      if (cat !== this.sector) {
        this.reputation[cat] = Math.max(0, this.reputation[cat] - 0.01);
      }
    }

    // --- Update totals ---
    this.revenue += dailyRevenue;
    this.expenses += dailyExpenses;
    const profit = dailyRevenue - dailyExpenses;
    this.cash += profit;
    this.dailyPnL = profit;

    // --- XP gain for company (only from profit, not from losses) ---
    if (profit > 0) this.xp += profit * 0.001 + 1;
    else this.xp += 0.5; // minimal XP even on bad days
    const xpThreshold = this.level * 1000;
    if (this.xp >= xpThreshold && this.level < 10) {
      this.level += 1;
      this.xp -= xpThreshold;
      events.push(`¡La empresa ha subido al nivel ${this.level}!`);
    }
    // Cap XP at max level to avoid overflow
    if (this.level >= 10) this.xp = Math.min(this.xp, 9999);

    // --- Financial history (90-day rolling) ---
    this.financialHistory.push({
      day: this.currentDay,
      revenue: dailyRevenue,
      expenses: dailyExpenses,
      profit,
      cash: this.cash,
    });
    if (this.financialHistory.length > 90) {
      this.financialHistory = this.financialHistory.slice(-90);
    }

    this.currentDay += 1;

    return { revenue: dailyRevenue, expenses: dailyExpenses, profit, events };
  }

  // ─── Workers ────────────────────────────────────────────────

  hireWorker(type: WorkerType = WorkerType.Junior): { success: boolean; worker?: Worker; message: string } {
    const hiringCost = WORKER_HIRING_COST[type];
    if (this.cash < hiringCost) {
      return { success: false, message: `Fondos insuficientes. Se necesitan €${hiringCost.toLocaleString()}` };
    }

    const firstName = WORKER_FIRST_NAMES[Math.floor(Math.random() * WORKER_FIRST_NAMES.length)];
    const lastName = WORKER_LAST_NAMES[Math.floor(Math.random() * WORKER_LAST_NAMES.length)];
    const name = `${firstName} ${lastName}`;

    const skills = Object.values(WorkerSkill);
    const primarySkill = skills[Math.floor(Math.random() * skills.length)];
    const secondarySkill = skills[Math.floor(Math.random() * skills.length)];

    const baseSkillLevel: Record<WorkerType, number> = {
      [WorkerType.Junior]: 2 + Math.floor(Math.random() * 2),
      [WorkerType.Senior]: 5 + Math.floor(Math.random() * 2),
      [WorkerType.Manager]: 6 + Math.floor(Math.random() * 2),
      [WorkerType.Specialist]: 7 + Math.floor(Math.random() * 2),
    };

    const worker: Worker & { xp: number; workerLevel: number } = {
      id: `worker_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name,
      role: type.charAt(0).toUpperCase() + type.slice(1),
      primarySkill,
      secondarySkill: secondarySkill !== primarySkill ? secondarySkill : undefined,
      skillLevel: baseSkillLevel[type],
      salary: WORKER_SALARY[type],
      morale: 70 + Math.floor(Math.random() * 20),
      productivity: 60 + Math.floor(Math.random() * 20),
      hiredOn: this.currentDay,
      isSpecialist: type === WorkerType.Specialist,
      xp: 0,
      workerLevel: 1,
    };

    this.cash -= hiringCost;
    this.workers.push(worker);
    this.reputation[this.sector] = Math.min(100, this.reputation[this.sector] + 0.5);

    return { success: true, worker, message: `${name} contratado como ${type}` };
  }

  fireWorker(workerId: string): { success: boolean; severanceCost: number; message: string } {
    const idx = this.workers.findIndex(w => w.id === workerId);
    if (idx === -1) return { success: false, severanceCost: 0, message: "Trabajador no encontrado" };

    const worker = this.workers[idx];
    const monthsEmployed = Math.max(1, (this.currentDay - worker.hiredOn) / 30);
    const severanceCost = worker.salary * Math.min(6, Math.floor(monthsEmployed));

    if (this.cash < severanceCost) {
      return { success: false, severanceCost, message: `Fondos insuficientes para la indemnización: €${severanceCost.toLocaleString()}` };
    }

    this.cash -= severanceCost;
    this.workers.splice(idx, 1);

    // Morale impact on remaining workers
    for (const w of this.workers) {
      w.morale = Math.max(10, w.morale - 3);
    }

    return { success: true, severanceCost, message: `${worker.name} ha sido despedido. Indemnización: €${severanceCost.toLocaleString()}` };
  }

  // ─── Facilities ─────────────────────────────────────────────

  addFacility(templateId: string): { success: boolean; facility?: Facility; message: string } {
    const template = FACILITY_TEMPLATES[templateId];
    if (!template) return { success: false, message: "Plantilla de instalación no encontrada" };

    if (this.cash < template.purchaseCost) {
      return { success: false, message: `Fondos insuficientes. Se necesitan €${template.purchaseCost.toLocaleString()}` };
    }

    const facility: Facility = {
      id: `facility_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: template.name,
      type: template.type,
      location: "Nueva Vista",
      capacity: template.capacity,
      currentUtilization: 0,
      monthlyCost: template.monthlyCost,
      productionBonus: template.productionBonus,
      upgrades: [],
      purchaseDate: this.currentDay,
    };

    this.cash -= template.purchaseCost;
    this.facilities.push(facility);

    return { success: true, facility, message: `${template.name} adquirida por €${template.purchaseCost.toLocaleString()}` };
  }

  upgradeFacility(facilityId: string): { success: boolean; cost: number; message: string } {
    const facility = this.facilities.find(f => f.id === facilityId);
    if (!facility) return { success: false, cost: 0, message: "Instalación no encontrada" };

    const upgradeCost = Math.floor(facility.monthlyCost * 10 * (1 + facility.upgrades.length * 0.5));
    if (this.cash < upgradeCost) {
      return { success: false, cost: upgradeCost, message: `Fondos insuficientes para la mejora: €${upgradeCost.toLocaleString()}` };
    }

    this.cash -= upgradeCost;
    facility.capacity = Math.floor(facility.capacity * 1.25);
    facility.productionBonus = parseFloat((facility.productionBonus * 1.10).toFixed(2));
    facility.upgrades.push(`upgrade_${facility.upgrades.length + 1}`);

    return { success: true, cost: upgradeCost, message: `${facility.name} mejorada. Capacidad: ${facility.capacity}, Bonus: +${((facility.productionBonus - 1) * 100).toFixed(0)}%` };
  }

  // ─── Inventory & Trading ────────────────────────────────────

  buyFromMarket(productId: string, quantity: number, price: number): { success: boolean; message: string } {
    const totalCost = price * quantity;
    if (this.cash < totalCost) {
      return { success: false, message: `Fondos insuficientes. Se necesitan €${totalCost.toLocaleString()}` };
    }

    this.cash -= totalCost;
    const existing = this.inventory.get(productId) ?? 0;
    this.inventory.set(productId, existing + quantity);
    this.expenses += totalCost;

    return { success: true, message: `Comprados ${quantity}x ${productId} por €${totalCost.toLocaleString()}` };
  }

  sellToMarket(productId: string, quantity: number, price: number): { success: boolean; revenue: number; message: string } {
    const existing = this.inventory.get(productId) ?? 0;
    if (existing < quantity) {
      return { success: false, revenue: 0, message: `Inventario insuficiente. Disponibles: ${existing}` };
    }

    const totalRevenue = price * quantity;
    this.cash += totalRevenue;
    this.revenue += totalRevenue;
    this.inventory.set(productId, existing - quantity);
    if (this.inventory.get(productId) === 0) this.inventory.delete(productId);

    return { success: true, revenue: totalRevenue, message: `Vendidos ${quantity}x ${productId} por €${totalRevenue.toLocaleString()}` };
  }

  // ─── Contracts ──────────────────────────────────────────────

  addContract(contract: Contract): { success: boolean; message: string } {
    if (this.activeContracts.find(c => c.id === contract.id)) {
      return { success: false, message: "Contrato ya registrado" };
    }
    if (contract.status !== ContractStatus.Active && contract.status !== ContractStatus.Pending) {
      return { success: false, message: "El contrato no está disponible" };
    }

    // Validate we can afford potential penalties
    if (contract.penaltyForBreach > this.cash * 2) {
      return { success: false, message: "La penalización por incumplimiento supera la capacidad financiera" };
    }

    contract.status = ContractStatus.Active;
    contract.startDay = this.currentDay;
    contract.endDay = this.currentDay + contract.durationDays;
    this.activeContracts.push(contract);

    // Reputation boost
    if (contract.reputationEffect > 0) {
      this.reputation[this.sector] = Math.min(100, this.reputation[this.sector] + contract.reputationEffect);
    }

    return { success: true, message: `Contrato ${contract.id} aceptado. Duración: ${contract.durationDays} días` };
  }

  fulfillContract(contractId: string): { success: boolean; payment: number; message: string } {
    const contract = this.activeContracts.find(c => c.id === contractId);
    if (!contract) return { success: false, payment: 0, message: "Contrato no encontrado" };
    if (contract.status !== ContractStatus.Active) {
      return { success: false, payment: 0, message: "El contrato no está activo" };
    }

    // Check product delivery requirement
    if (contract.productId) {
      const term = contract.terms.find(t => t.key === "quantity");
      const required = term ? Number(term.value) : 0;
      const available = this.inventory.get(contract.productId) ?? 0;

      if (available < required) {
        return { success: false, payment: 0, message: `Inventario insuficiente: necesitas ${required}, tienes ${available}` };
      }
      this.inventory.set(contract.productId, available - required);
    }

    const payment = contract.valuePerMonth;
    this.cash += payment;
    this.revenue += payment;
    contract.status = ContractStatus.Completed;

    this.reputation[this.sector] = Math.min(100, this.reputation[this.sector] + 2);

    return { success: true, payment, message: `Contrato cumplido. Pago recibido: €${payment.toLocaleString()}` };
  }

  breachContract(contractId: string): { penalty: number; message: string } {
    const contract = this.activeContracts.find(c => c.id === contractId);
    if (!contract) return { penalty: 0, message: "Contrato no encontrado" };

    const penalty = contract.penaltyForBreach;
    this.cash -= penalty;
    this.expenses += penalty;
    contract.status = ContractStatus.Breached;

    this.reputation[this.sector] = Math.max(0, this.reputation[this.sector] - 10);

    return { penalty, message: `Contrato incumplido. Penalización: €${penalty.toLocaleString()}` };
  }

  // ─── Production ─────────────────────────────────────────────

  queueProduction(productId: string, quantity: number, facilityId: string): { success: boolean; message: string } {
    const facility = this.facilities.find(f => f.id === facilityId);
    if (!facility) return { success: false, message: "Instalación no encontrada" };

    const product = PRODUCTS[productId];
    if (!product) return { success: false, message: "Producto no encontrado" };

    const chain = product.productionChain;
    if (chain) {
      // Check inputs
      for (const input of chain.inputs) {
        const available = this.inventory.get(input.productId) ?? 0;
        const needed = input.quantity * quantity;
        if (available < needed) {
          return { success: false, message: `Materia prima insuficiente: ${input.productId} (necesitas ${needed}, tienes ${available})` };
        }
      }
      // Consume inputs
      for (const input of chain.inputs) {
        const available = this.inventory.get(input.productId) ?? 0;
        this.inventory.set(input.productId, available - input.quantity * quantity);
      }
    }

    // Apply facility production bonus: higher bonus = fewer days needed
    const bonus = facility.productionBonus ?? 1.0;
    const baseDays = chain?.timeInDays ?? 1;
    // Bonus reduces time: 1.4x bonus → days / 1.4 → ~71% of base time
    const daysRequired = Math.max(1, Math.round(baseDays / bonus));

    // Apply worker efficiency bonus: avg efficiency reduces days further (up to -20%)
    const workerEff = this.getWorkerEfficiency() / 100; // 0..1
    const effMultiplier = 1 - workerEff * 0.2; // 1.0 at 0% eff, 0.8 at 100% eff
    const finalDays = Math.max(1, Math.round(daysRequired * effMultiplier));

    this.productionQueue.push({ productId, quantity, daysRemaining: finalDays, totalDays: finalDays, facilityId });

    return { success: true, message: `Producción de ${quantity}x ${product.name} iniciada. Listo en ${finalDays} días (base: ${baseDays})` };
  }

  // ─── Analytics ──────────────────────────────────────────────

  calculateNetWorth(marketPrices: Record<string, number> = {}): number {
    let netWorth = this.cash;

    // Inventory value
    for (const [productId, qty] of this.inventory) {
      const price = marketPrices[productId];
      if (price) {
        netWorth += price * qty;
      } else {
        const product = PRODUCTS[productId];
        netWorth += (product?.basePrice ?? 10) * qty;
      }
    }

    // Facility value (purchase cost * utilization factor)
    for (const facility of this.facilities) {
      const template = FACILITY_TEMPLATES[facility.type] ?? Object.values(FACILITY_TEMPLATES).find(t => t.name === facility.name);
      const baseValue = template?.purchaseCost ?? facility.monthlyCost * 12;
      netWorth += baseValue * (0.8 + facility.upgrades.length * 0.1);
    }

    // Subtract debts
    netWorth -= this.totalDebts;

    return Math.round(netWorth);
  }

  getFinancialSummary(): FinancialSummary {
    const last30 = this.financialHistory.slice(-30);
    const revenue30d = last30.reduce((s, r) => s + r.revenue, 0);
    const expenses30d = last30.reduce((s, r) => s + r.expenses, 0);
    const profit30d = revenue30d - expenses30d;

    const prev30 = this.financialHistory.slice(-60, -30);
    const prevProfit = prev30.reduce((s, r) => s + r.revenue - r.expenses, 0);
    const growthPercent = prevProfit !== 0 ? ((profit30d - prevProfit) / Math.abs(prevProfit)) * 100 : 0;

    const profitMargin = revenue30d > 0 ? (profit30d / revenue30d) * 100 : 0;
    const averageDailyRevenue = last30.length > 0 ? revenue30d / last30.length : 0;

    return {
      revenue30d: parseFloat(revenue30d.toFixed(2)),
      expenses30d: parseFloat(expenses30d.toFixed(2)),
      profit30d: parseFloat(profit30d.toFixed(2)),
      growthPercent: parseFloat(growthPercent.toFixed(2)),
      profitMargin: parseFloat(profitMargin.toFixed(2)),
      averageDailyRevenue: parseFloat(averageDailyRevenue.toFixed(2)),
    };
  }

  getProductionCapacity(): number {
    return this.facilities.reduce((sum, f) => sum + f.capacity, 0);
  }

  getWorkerEfficiency(): number {
    if (this.workers.length === 0) return 0;
    const total = this.workers.reduce((s, w) => s + (w.morale / 100) * (w.skillLevel / 10), 0);
    return parseFloat((total / this.workers.length * 100).toFixed(2));
  }

  // Company level gives a passive CPS multiplier: level 1 = 1.0x, level 10 = 2.0x
  getLevelCpsMultiplier(): number {
    return 1 + (this.level - 1) * 0.11;
  }

  // Reputation in home sector affects contract quality (0-100 → 1.0x-1.5x)
  getReputationContractMultiplier(): number {
    const rep = this.reputation[this.sector] ?? 30;
    return 1 + (rep / 100) * 0.5;
  }

  getTotalMonthlySalaries(): number {
    return this.workers.reduce((s, w) => s + w.salary, 0);
  }

  getTotalMonthlyFacilityCosts(): number {
    return this.facilities.reduce((s, f) => s + f.monthlyCost, 0);
  }

  getTotalMonthlyExpenses(): number {
    return this.getTotalMonthlySalaries() + this.getTotalMonthlyFacilityCosts();
  }

  // ─── Serialization ──────────────────────────────────────────

  toJSON(): object {
    return {
      id: this.id,
      name: this.name,
      ownerId: this.ownerId,
      sector: this.sector,
      cash: this.cash,
      revenue: this.revenue,
      expenses: this.expenses,
      reputation: this.reputation,
      workers: this.workers,
      facilities: this.facilities,
      activeContracts: this.activeContracts,
      inventory: Array.from(this.inventory.entries()),
      level: this.level,
      xp: this.xp,
      bonuses: this.bonuses,
      financialHistory: this.financialHistory,
      currentDay: this.currentDay,
      dailyPnL: this.dailyPnL,
      esgScore: this.esgScore,
      totalDebts: this.totalDebts,
      isPublic: this.isPublic,
      stockSymbol: this.stockSymbol,
      productionQueue: this.productionQueue,
    };
  }

  static fromJSON(data: Record<string, any>): Company {
    const company = new Company(
      data.id,
      data.name,
      data.ownerId,
      data.sector as ProductCategory,
      data.cash ?? 0
    );
    company.revenue = data.revenue ?? 0;
    company.expenses = data.expenses ?? 0;
    company.reputation = data.reputation ?? company.reputation;
    company.workers = data.workers ?? [];
    company.facilities = data.facilities ?? [];
    company.activeContracts = data.activeContracts ?? [];
    company.inventory = new Map(data.inventory ?? []);
    company.level = data.level ?? 1;
    company.xp = data.xp ?? 0;
    company.bonuses = data.bonuses ?? {};
    company.financialHistory = data.financialHistory ?? [];
    company.currentDay = data.currentDay ?? 1;
    company.dailyPnL = data.dailyPnL ?? 0;
    company.esgScore = data.esgScore ?? 0;
    company.totalDebts = data.totalDebts ?? 0;
    company.isPublic = data.isPublic ?? false;
    company.stockSymbol = data.stockSymbol;
    company.productionQueue = data.productionQueue ?? [];
    return company;
  }
}
