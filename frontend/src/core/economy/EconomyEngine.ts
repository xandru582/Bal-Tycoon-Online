// ============================================================
// NEXUS: Imperio del Mercado — Economy Engine (Central Orchestrator)
// ============================================================

import type {
  EconomicIndicators,
  AIRival,
  NewsItem,
  MarketEvent,
  Achievement,
} from "@/types/index";
import {
  EconomicPhase,
  NewsSeverity,
  ProductCategory,
} from "@/types/index";
import { Company } from "./Company";
import { Market, createAllMarkets, MARKET_DEFINITIONS } from "./Market";
import { PRODUCTS } from "@/data/products";

// ─── Engine Types ─────────────────────────────────────────────

export interface EngineLeaderboardEntry {
  id: string;
  name: string;
  companyName: string;
  netWorth: number;
  sector: ProductCategory;
  rank: number;
  isPlayer: boolean;
}

export interface WinLoseCondition {
  type: "win" | "lose";
  reason: string;
  netWorth?: number;
  day?: number;
}

// ─── Economy Engine ───────────────────────────────────────────

export class EconomyEngine {
  day: number;
  month: number;
  year: number;
  totalDays: number;

  playerCompany: Company | null;
  markets: Map<string, Market>;
  indicators: EconomicIndicators;
  rivals: AIRival[];
  rivalCompanies: Map<string, Company>;
  news: NewsItem[];
  activeEvents: MarketEvent[];

  dayCallbacks: Array<(engine: EconomyEngine) => void>;
  monthCallbacks: Array<(engine: EconomyEngine) => void>;
  winLoseCallbacks: Array<(condition: WinLoseCondition) => void>;

  achievements: Record<string, Achievement>;
  unlockedAchievementIds: Set<string>;

  private _accumulator: number;
  private readonly DAY_DURATION = 1; // 1 dt unit = 1 day

  constructor() {
    this.day = 1;
    this.month = 1;
    this.year = 2025;
    this.totalDays = 1;
    this.playerCompany = null;
    this.markets = createAllMarkets();
    this.indicators = this._initialIndicators();
    this.rivals = [];
    this.rivalCompanies = new Map();
    this.news = [];
    this.activeEvents = [];
    this.dayCallbacks = [];
    this.monthCallbacks = [];
    this.winLoseCallbacks = [];
    this.achievements = {};
    this.unlockedAchievementIds = new Set();
    this._accumulator = 0;

    this.initRivalCompanies();
    this._generateStartingNews();
  }

  // ─── Initial State ──────────────────────────────────────────

  private _initialIndicators(): EconomicIndicators {
    return {
      gdpGrowth: 2.5,
      inflation: 2.0,
      unemployment: 8.5,
      consumerConfidence: 55,
      businessConfidence: 58,
      interestRate: 3.5,
      exchangeRate: 1.08,
      stockIndexValue: 4200,
      phase: EconomicPhase.Stable,
      weeklyReport: "Economía estable con leve crecimiento. Los mercados muestran confianza moderada.",
      lastShockDay: undefined,
      shockDescription: undefined,
    };
  }

  private _generateStartingNews(): void {
    this.addNews(
      "NVX News: Apertura de mercados en Nueva Vista",
      "general",
      NewsSeverity.Info,
      "Los mercados de Nueva Vista abren con expectativas moderadas. Analistas prevén crecimiento sostenido en tecnología y moda."
    );
    this.addNews(
      "Informe Económico Mensual",
      "general",
      NewsSeverity.Info,
      `Crecimiento del PIB al ${this.indicators.gdpGrowth}% anual. Inflación controlada al ${this.indicators.inflation}%. Confianza del consumidor: ${this.indicators.consumerConfidence}/100.`
    );
  }

  // ─── Update Loop ────────────────────────────────────────────

  update(dt: number): void {
    this._accumulator += dt;
    while (this._accumulator >= this.DAY_DURATION) {
      this._accumulator -= this.DAY_DURATION;
      this.advanceDay();
    }
  }

  advanceDay(): void {
    this.totalDays += 1;
    this.day += 1;

    // Track month transitions
    if (this.day > 30) {
      this.day = 1;
      this.month += 1;
      if (this.month > 12) {
        this.month = 1;
        this.year += 1;
      }
      this.advanceMonth();
    }

    // --- Tick markets ---
    for (const market of this.markets.values()) {
      market.update(1, this.indicators);
    }

    // --- Tick player company ---
    if (this.playerCompany) {
      this.playerCompany.dailyTick();
    }

    // --- Tick rival companies ---
    for (const rival of this.rivals) {
      this.rivalAITick(rival);
    }

    // --- Random events (5% daily chance) ---
    if (Math.random() < 0.05) {
      this.generateRandomEvent();
    }

    // --- Update economic indicators ---
    this._updateIndicators();

    // --- Check win/lose ---
    this._checkWinLoseConditions();

    // --- Generate daily news ---
    this._generateDailyNews();

    // --- Fire day callbacks ---
    for (const cb of this.dayCallbacks) {
      cb(this);
    }

    // --- Check achievements ---
    this.checkAchievements();
  }

  advanceMonth(): void {
    // Larger economic shifts
    const gdpDrift = (Math.random() - 0.5) * 1.0;
    this.indicators.gdpGrowth = Math.max(-5, Math.min(8, this.indicators.gdpGrowth + gdpDrift));

    const inflationDrift = (Math.random() - 0.45) * 0.5;
    this.indicators.inflation = Math.max(0, Math.min(15, this.indicators.inflation + inflationDrift));

    // Interest rate adjustments based on inflation
    if (this.indicators.inflation > 5 && Math.random() < 0.3) {
      this.indicators.interestRate = Math.min(12, this.indicators.interestRate + 0.25);
      this.addNews(
        "Banco Central sube los tipos de interés",
        "political",
        NewsSeverity.Warning,
        `El Banco Central de Nueva Vista eleva los tipos al ${this.indicators.interestRate.toFixed(2)}% para combatir la inflación.`
      );
    } else if (this.indicators.inflation < 1.5 && Math.random() < 0.3) {
      this.indicators.interestRate = Math.max(0, this.indicators.interestRate - 0.25);
      this.addNews(
        "Banco Central baja los tipos de interés",
        "political",
        NewsSeverity.Info,
        `El Banco Central reduce los tipos al ${this.indicators.interestRate.toFixed(2)}% para estimular la economía.`
      );
    }

    // Consumer confidence shift
    const confDrift = (Math.random() - 0.5) * 8;
    this.indicators.consumerConfidence = Math.max(10, Math.min(95, this.indicators.consumerConfidence + confDrift));

    // Monthly policy events
    if (Math.random() < 0.15) {
      this._generatePolicyEvent();
    }

    // Update economic phase
    this.indicators.phase = this.getEconomicPhase();

    // Monthly report
    this.indicators.weeklyReport = this._generateWeeklyReport();

    this.addNews(
      `Informe Mensual — ${this._monthName(this.month)} ${this.year}`,
      "general",
      NewsSeverity.Info,
      this.indicators.weeklyReport
    );

    // Fire month callbacks
    for (const cb of this.monthCallbacks) {
      cb(this);
    }
  }

  // ─── Indicator Updates ──────────────────────────────────────

  private _updateIndicators(): void {
    // Daily micro-fluctuations
    this.indicators.consumerConfidence = Math.max(
      10, Math.min(95,
        this.indicators.consumerConfidence + (Math.random() - 0.5) * 1.5
      )
    );
    this.indicators.businessConfidence = Math.max(
      10, Math.min(95,
        this.indicators.businessConfidence + (Math.random() - 0.5) * 1.5
      )
    );
    this.indicators.unemployment = Math.max(
      2, Math.min(25,
        this.indicators.unemployment + (Math.random() - 0.5) * 0.1
      )
    );

    // Stock index movement
    const indexChange = (Math.random() - 0.5) * 0.02;
    this.indicators.stockIndexValue = Math.max(
      500, this.indicators.stockIndexValue * (1 + indexChange)
    );

    // Exchange rate drift
    this.indicators.exchangeRate = Math.max(
      0.5, Math.min(2.5,
        this.indicators.exchangeRate + (Math.random() - 0.5) * 0.005
      )
    );
  }

  // ─── Rival Companies ────────────────────────────────────────

  initRivalCompanies(): void {
    const rivalDefs = [
      { id: "rival_nexus_corp", name: "Elena Voss", companyName: "Nexus Corp", sector: ProductCategory.Tecnologia, strategy: "aggressive" as const, aggression: 0.8, startCash: 80000 },
      { id: "rival_vista_fashion", name: "Isabella Chen", companyName: "Vista Fashion", sector: ProductCategory.Moda, strategy: "defensive" as const, aggression: 0.3, startCash: 45000 },
      { id: "rival_golden_harvest", name: "Roberto Fuentes", companyName: "Golden Harvest", sector: ProductCategory.Alimentacion, strategy: "diversified" as const, aggression: 0.5, startCash: 60000 },
      { id: "rival_energy_plus", name: "Viktor Dragan", companyName: "EnergyPlus", sector: ProductCategory.Energia, strategy: "opportunistic" as const, aggression: 0.7, startCash: 120000 },
      { id: "rival_prime_capital", name: "Natasha Reyes", companyName: "Prime Capital", sector: ProductCategory.Finanzas, strategy: "aggressive" as const, aggression: 0.9, startCash: 200000 },
    ];

    this.rivals = rivalDefs.map(def => ({
      id: def.id,
      name: def.name,
      companyName: def.companyName,
      sector: def.sector,
      aggressionLevel: def.aggression,
      cashReserves: def.startCash,
      marketShare: {},
      reputation: 40 + Math.floor(Math.random() * 30),
      strategy: def.strategy,
      relationships: {},
      lastAction: undefined,
      lastActionDay: undefined,
    }));

    for (const def of rivalDefs) {
      const company = new Company(def.id, def.companyName, def.id, def.sector, def.startCash);
      company.level = 1 + Math.floor(Math.random() * 3);
      this.rivalCompanies.set(def.id, company);
    }
  }

  rivalAITick(rival: AIRival): void {
    const company = this.rivalCompanies.get(rival.id);
    if (!company) return;

    company.dailyTick();

    const market = this.markets.get(rival.sector.toLowerCase()) ?? this.markets.values().next().value;
    if (!market) return;

    const products = market.getAllProductStates();
    if (products.length === 0) return;

    switch (rival.strategy) {
      case "aggressive": {
        // Buy cheap, sell high — active trading
        for (const ps of products) {
          if (ps.rsi < 35 && company.cash > ps.currentPrice * 20) {
            const qty = Math.floor((company.cash * 0.1) / ps.currentPrice);
            if (qty > 0) {
              company.buyFromMarket(ps.productId, qty, ps.currentPrice);
              market.buyProduct(ps.productId, qty, 0);
              rival.lastAction = `Compra agresiva de ${ps.productId}`;
              rival.lastActionDay = this.totalDays;
            }
          } else if (ps.rsi > 65) {
            const held = company.inventory.get(ps.productId) ?? 0;
            if (held > 0) {
              company.sellToMarket(ps.productId, held, ps.currentPrice);
              market.sellProduct(ps.productId, held, 0);
              rival.lastAction = `Venta agresiva de ${ps.productId}`;
              rival.lastActionDay = this.totalDays;
            }
          }
        }
        rival.cashReserves = company.cash;
        break;
      }

      case "defensive": {
        // Steady production and contracts, minimal risk
        if (company.workers.length < 3 && company.cash > 10000) {
          company.hireWorker();
        }
        if (company.facilities.length < 2 && company.cash > 8000) {
          company.addFacility("oficina");
        }
        rival.lastAction = "Gestión conservadora";
        rival.cashReserves = company.cash;
        break;
      }

      case "opportunistic": {
        // Exploit market events
        const volatile = products.filter(p => p.volatilityIndex > 0.6);
        for (const ps of volatile) {
          if (ps.trend === "rising" && ps.changePercent > 3 && company.cash > ps.currentPrice * 10) {
            const qty = Math.floor((company.cash * 0.15) / ps.currentPrice);
            if (qty > 0) {
              company.buyFromMarket(ps.productId, qty, ps.currentPrice);
              market.buyProduct(ps.productId, qty, 0);
              rival.lastAction = `Compra oportunista en ${ps.productId} (volatil)`;
              rival.lastActionDay = this.totalDays;
            }
          } else if (ps.trend === "falling" && ps.changePercent < -3) {
            const held = company.inventory.get(ps.productId) ?? 0;
            if (held > 0) {
              company.sellToMarket(ps.productId, held, ps.currentPrice);
              market.sellProduct(ps.productId, held, 0);
              rival.lastAction = `Venta oportunista en ${ps.productId}`;
              rival.lastActionDay = this.totalDays;
            }
          }
        }
        rival.cashReserves = company.cash;
        break;
      }

      case "diversified": {
        // Spread investments across multiple markets
        if (this.totalDays % 7 === 0) {
          const allMarkets = Array.from(this.markets.values());
          const targetMarket = allMarkets[Math.floor(Math.random() * allMarkets.length)];
          const targetProducts = targetMarket.getAllProductStates();
          if (targetProducts.length > 0 && company.cash > 5000) {
            const pick = targetProducts[Math.floor(Math.random() * targetProducts.length)];
            const qty = Math.floor(1000 / pick.currentPrice);
            if (qty > 0) {
              company.buyFromMarket(pick.productId, qty, pick.currentPrice);
              targetMarket.buyProduct(pick.productId, qty, 0);
              rival.lastAction = `Diversificación: compra en ${targetMarket.name}`;
              rival.lastActionDay = this.totalDays;
            }
          }
        }
        rival.cashReserves = company.cash;
        break;
      }
    }

    // Update market share
    const totalMarketVolume = products.reduce((s, p) => s + p.volume24h, 0);
    let rivalVolume = 0;
    for (const ps of products) {
      rivalVolume += company.inventory.get(ps.productId) ?? 0;
    }
    rival.marketShare[rival.sector] = totalMarketVolume > 0 ? Math.min(1, rivalVolume / (totalMarketVolume * 10)) : 0;
  }

  // ─── Random Events ──────────────────────────────────────────

  generateRandomEvent(): void {
    const eventTypes = [
      "market_shock",
      "competitor_scandal",
      "policy_change",
      "natural_disaster",
      "tech_breakthrough",
      "trade_agreement",
      "labor_strike",
    ];
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const allMarketsList = Array.from(this.markets.values());
    const targetMarket = allMarketsList[Math.floor(Math.random() * allMarketsList.length)];

    switch (type) {
      case "market_shock": {
        const shockDir = Math.random() > 0.5 ? 1.15 + Math.random() * 0.1 : 0.82 + Math.random() * 0.08;
        const result = targetMarket.generateMarketEvent();
        if (result) {
          this.addNews(
            `Shock de mercado: ${targetMarket.name}`,
            targetMarket.category,
            shockDir > 1 ? NewsSeverity.Alert : NewsSeverity.Warning,
            result.description
          );
          this.indicators.lastShockDay = this.totalDays;
          this.indicators.shockDescription = result.title;
        }
        break;
      }

      case "competitor_scandal": {
        const rival = this.rivals[Math.floor(Math.random() * this.rivals.length)];
        rival.reputation = Math.max(0, rival.reputation - 15 - Math.floor(Math.random() * 20));
        const company = this.rivalCompanies.get(rival.id);
        if (company) {
          company.reputation[rival.sector] = Math.max(0, company.reputation[rival.sector] - 20);
        }
        this.addNews(
          `Escándalo corporativo: ${rival.companyName}`,
          "general",
          NewsSeverity.Alert,
          `${rival.companyName} se ve envuelta en un escándalo. Su reputación cae drásticamente y los mercados reaccionan con nerviosismo.`
        );
        this.indicators.consumerConfidence = Math.max(10, this.indicators.consumerConfidence - 3);
        break;
      }

      case "policy_change": {
        this._generatePolicyEvent();
        break;
      }

      case "natural_disaster": {
        const categories = [ProductCategory.Alimentacion, ProductCategory.MateriasPrimas, ProductCategory.Energia];
        const affectedCat = categories[Math.floor(Math.random() * categories.length)];
        const affectedMarket = this.markets.get(affectedCat.toLowerCase()) ?? targetMarket;
        const products = affectedMarket.getAllProductStates();
        for (const p of products) {
          affectedMarket.applyExternalShock(p.productId, 1.20 + Math.random() * 0.15);
        }
        this.addNews(
          "Catástrofe natural afecta el suministro",
          affectedCat,
          NewsSeverity.Critical,
          `Una catástrofe natural impacta la producción en el sector de ${affectedCat}. Los precios suben bruscamente ante la escasez de suministro.`
        );
        this.indicators.consumerConfidence = Math.max(10, this.indicators.consumerConfidence - 5);
        break;
      }

      case "tech_breakthrough": {
        const techMarket = this.markets.get("tecnologia") ?? targetMarket;
        const techProducts = techMarket.getAllProductStates();
        for (const p of techProducts) {
          techMarket.applyExternalShock(p.productId, 0.88 + Math.random() * 0.05);
        }
        this.addNews(
          "Avance tecnológico reduce costes de producción",
          ProductCategory.Tecnologia,
          NewsSeverity.Info,
          "Un importante avance tecnológico promete reducir los costes de producción en el sector tech. Los precios caen temporalmente."
        );
        this.indicators.businessConfidence = Math.min(95, this.indicators.businessConfidence + 5);
        break;
      }

      case "trade_agreement": {
        this.indicators.exchangeRate = Math.max(0.8, Math.min(1.5, this.indicators.exchangeRate * (0.97 + Math.random() * 0.06)));
        this.indicators.businessConfidence = Math.min(95, this.indicators.businessConfidence + 4);
        this.addNews(
          "Nuevo acuerdo comercial internacional",
          "political",
          NewsSeverity.Info,
          "Nueva Vista firma un acuerdo de libre comercio. Los mercados de exportación se amplían y la confianza empresarial mejora."
        );
        break;
      }

      case "labor_strike": {
        for (const rival of this.rivals) {
          const company = this.rivalCompanies.get(rival.id);
          if (!company) continue;
          for (const worker of company.workers) {
            worker.morale = Math.max(20, worker.morale - 15);
          }
        }
        // Also affect player
        if (this.playerCompany) {
          for (const worker of this.playerCompany.workers) {
            worker.morale = Math.max(20, worker.morale - 10);
          }
        }
        this.addNews(
          "Huelga general en el sector industrial",
          "social",
          NewsSeverity.Warning,
          "Los trabajadores del sector industrial de Nueva Vista inician una huelga. La productividad cae y la moral laboral está en mínimos."
        );
        break;
      }
    }
  }

  private _generatePolicyEvent(): void {
    const policies = [
      {
        title: "Nuevas subvenciones a las energías renovables",
        category: ProductCategory.Energia,
        body: "El gobierno anuncia subvenciones masivas al sector energético renovable. Las empresas del sector verán reducidos sus costes operativos.",
        severity: NewsSeverity.Info,
        indicator: "businessConfidence" as keyof EconomicIndicators,
        delta: 5,
      },
      {
        title: "Aumento del salario mínimo",
        category: "political" as const,
        body: "El ejecutivo aprueba un aumento del 8% en el salario mínimo. Los costes laborales subirán para todas las empresas.",
        severity: NewsSeverity.Warning,
        indicator: "consumerConfidence" as keyof EconomicIndicators,
        delta: 4,
      },
      {
        title: "Nuevos aranceles a la importación",
        category: "political" as const,
        body: "Se establecen nuevos aranceles que encarecen las importaciones. Las materias primas extranjeras subirán de precio.",
        severity: NewsSeverity.Warning,
        indicator: "businessConfidence" as keyof EconomicIndicators,
        delta: -6,
      },
      {
        title: "Plan de digitalización empresarial",
        category: ProductCategory.Tecnologia,
        body: "El gobierno lanza un ambicioso plan de digitalización. Las empresas tecnológicas recibirán contratos y ayudas.",
        severity: NewsSeverity.Info,
        indicator: "businessConfidence" as keyof EconomicIndicators,
        delta: 7,
      },
    ];

    const policy = policies[Math.floor(Math.random() * policies.length)];
    (this.indicators[policy.indicator] as number) = Math.max(
      10, Math.min(95,
        (this.indicators[policy.indicator] as number) + policy.delta
      )
    );
    this.addNews(policy.title, policy.category, policy.severity, policy.body);
  }

  // ─── Win/Lose Conditions ────────────────────────────────────

  private _checkWinLoseConditions(): void {
    if (!this.playerCompany) return;

    const netWorth = this.playerCompany.calculateNetWorth();

    // Bankruptcy
    if (this.playerCompany.cash < -50000) {
      for (const cb of this.winLoseCallbacks) {
        cb({ type: "lose", reason: "Tu empresa ha entrado en bancarrota. El crédito se agotó.", netWorth, day: this.totalDays });
      }
      return;
    }

    // Cash crisis
    if (this.playerCompany.cash < 0 && this.playerCompany.getTotalMonthlyExpenses() > 0) {
      this.addNews(
        "ALERTA: Liquidez crítica en tu empresa",
        "general",
        NewsSeverity.Critical,
        "Tu empresa tiene caja negativa. Debes generar ingresos urgentemente o vender activos para evitar la bancarrota."
      );
    }

    // Win conditions
    if (netWorth >= 10_000_000) {
      for (const cb of this.winLoseCallbacks) {
        cb({ type: "win", reason: "¡Has alcanzado los 10 millones de patrimonio neto! Eres el magnate de Nueva Vista.", netWorth, day: this.totalDays });
      }
    }
  }

  // ─── Leaderboard ────────────────────────────────────────────

  getLeaderboard(): EngineLeaderboardEntry[] {
    const entries: EngineLeaderboardEntry[] = [];

    if (this.playerCompany) {
      entries.push({
        id: "player",
        name: "Tú",
        companyName: this.playerCompany.name,
        netWorth: this.playerCompany.calculateNetWorth(),
        sector: this.playerCompany.sector,
        rank: 0,
        isPlayer: true,
      });
    }

    for (const rival of this.rivals) {
      const company = this.rivalCompanies.get(rival.id);
      entries.push({
        id: rival.id,
        name: rival.name,
        companyName: rival.companyName,
        netWorth: company ? company.calculateNetWorth() : rival.cashReserves,
        sector: rival.sector,
        rank: 0,
        isPlayer: false,
      });
    }

    entries.sort((a, b) => b.netWorth - a.netWorth);
    entries.forEach((e, i) => (e.rank = i + 1));
    return entries;
  }

  getPlayerRank(): number {
    const leaderboard = this.getLeaderboard();
    const playerEntry = leaderboard.find(e => e.isPlayer);
    return playerEntry?.rank ?? leaderboard.length + 1;
  }

  // ─── Economic Phase ─────────────────────────────────────────

  getEconomicPhase(): EconomicPhase {
    const { gdpGrowth, consumerConfidence, unemployment, inflation } = this.indicators;

    if (gdpGrowth >= 4 && consumerConfidence >= 70 && unemployment <= 5) return EconomicPhase.Boom;
    if (gdpGrowth >= 2.5 && consumerConfidence >= 55) return EconomicPhase.Growth;
    if (gdpGrowth >= 1 && consumerConfidence >= 40 && inflation <= 6) return EconomicPhase.Stable;
    if (gdpGrowth >= 0 && consumerConfidence >= 30) return EconomicPhase.Slowdown;
    if (gdpGrowth < 0 && unemployment >= 12) return EconomicPhase.Recession;
    return EconomicPhase.Crisis;
  }

  // ─── News ────────────────────────────────────────────────────

  addNews(
    title: string,
    category: NewsItem["category"],
    severity: NewsSeverity,
    body: string,
    affectedProductIds: string[] = []
  ): NewsItem {
    const item: NewsItem = {
      id: `news_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      title,
      body,
      source: this._randomNewsSource(),
      severity,
      category,
      publishedOn: this.totalDays,
      expiresOn: this.totalDays + 14,
      affectedProductIds,
      priceHint: this._derivePriceHint(severity, body),
      isRead: false,
      isPlayerTriggered: false,
    };

    this.news.unshift(item);
    if (this.news.length > 50) this.news = this.news.slice(0, 50);
    return item;
  }

  private _randomNewsSource(): string {
    const sources = [
      "NVX Business Daily",
      "La Gaceta Financiera",
      "El Mercado Libre",
      "Nueva Vista Tribune",
      "Capital Network",
      "InfoEconomics NV",
    ];
    return sources[Math.floor(Math.random() * sources.length)];
  }

  private _derivePriceHint(severity: NewsSeverity, body: string): "up" | "down" | "volatile" | undefined {
    const lower = body.toLowerCase();
    if (lower.includes("sube") || lower.includes("alza") || lower.includes("aumento")) return "up";
    if (lower.includes("baja") || lower.includes("cae") || lower.includes("reduce")) return "down";
    if (severity === NewsSeverity.Critical || lower.includes("volatil")) return "volatile";
    return undefined;
  }

  private _generateDailyNews(): void {
    // 20% chance of spontaneous market news per day
    if (Math.random() > 0.20) return;

    const allProducts = Object.values(PRODUCTS);
    const product = allProducts[Math.floor(Math.random() * allProducts.length)];
    const market = this.markets.get(product.category.toLowerCase());
    if (!market) return;

    const state = market.getProductState(product.id);
    if (!state) return;

    if (Math.abs(state.changePercent) > 3) {
      const direction = state.changePercent > 0 ? "sube" : "cae";
      const magnitude = Math.abs(state.changePercent).toFixed(1);
      this.addNews(
        `${product.name} ${direction} un ${magnitude}% en jornada`,
        product.category,
        Math.abs(state.changePercent) > 7 ? NewsSeverity.Alert : NewsSeverity.Info,
        `El mercado de ${product.name} registra un movimiento del ${magnitude}% hoy. Los analistas atribuyen el movimiento a ${state.changePercent > 0 ? "fuerte demanda y optimismo inversor" : "presión vendedora y recogida de beneficios"}.`,
        [product.id]
      );
    }
  }

  // ─── Achievements ────────────────────────────────────────────

  checkAchievements(): void {
    if (!this.playerCompany) return;
    const company = this.playerCompany;
    const netWorth = company.calculateNetWorth();
    const summary = company.getFinancialSummary();

    const conditions: Array<{ id: string; title: string; check: () => boolean; icon: string }> = [
      { id: "first_hire", title: "Primer empleado", check: () => company.workers.length >= 1, icon: "👤" },
      { id: "ten_workers", title: "Equipo consolidado", check: () => company.workers.length >= 10, icon: "👥" },
      { id: "first_facility", title: "Primeras instalaciones", check: () => company.facilities.length >= 1, icon: "🏢" },
      { id: "five_facilities", title: "Expansión física", check: () => company.facilities.length >= 5, icon: "🏙️" },
      { id: "net_worth_100k", title: "Pequeño capitalista", check: () => netWorth >= 100_000, icon: "💰" },
      { id: "net_worth_500k", title: "Hombre de negocios", check: () => netWorth >= 500_000, icon: "💎" },
      { id: "net_worth_1m", title: "Millonario", check: () => netWorth >= 1_000_000, icon: "🏆" },
      { id: "net_worth_5m", title: "Gran Magnate", check: () => netWorth >= 5_000_000, icon: "👑" },
      { id: "profitable_month", title: "Mes rentable", check: () => summary.profit30d > 0, icon: "📈" },
      { id: "contracts_5", title: "Negociador", check: () => company.activeContracts.length >= 5, icon: "📋" },
      { id: "level_5", title: "Empresa consolidada", check: () => company.level >= 5, icon: "⭐" },
      { id: "survived_100_days", title: "Resistencia", check: () => this.totalDays >= 100, icon: "🗓️" },
      { id: "rank_1", title: "Rey del mercado", check: () => this.getPlayerRank() === 1, icon: "🥇" },
    ];

    for (const { id, title, check, icon } of conditions) {
      if (!this.unlockedAchievementIds.has(id) && check()) {
        this.unlockedAchievementIds.add(id);
        this.addNews(
          `Logro desbloqueado: ${icon} ${title}`,
          "general",
          NewsSeverity.Info,
          `Has conseguido el logro "${title}". ¡Sigue construyendo tu imperio!`
        );
      }
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────

  private _generateWeeklyReport(): string {
    const phase = this.getEconomicPhase();
    const phaseDesc: Record<EconomicPhase, string> = {
      [EconomicPhase.Boom]: "expansión extraordinaria",
      [EconomicPhase.Growth]: "crecimiento sólido",
      [EconomicPhase.Stable]: "estabilidad moderada",
      [EconomicPhase.Slowdown]: "desaceleración",
      [EconomicPhase.Recession]: "recesión técnica",
      [EconomicPhase.Crisis]: "crisis económica grave",
    };
    return `La economía de Nueva Vista se encuentra en fase de ${phaseDesc[phase]}. PIB: ${this.indicators.gdpGrowth.toFixed(1)}% | Inflación: ${this.indicators.inflation.toFixed(1)}% | Paro: ${this.indicators.unemployment.toFixed(1)}% | Confianza: ${Math.round(this.indicators.consumerConfidence)}/100`;
  }

  private _monthName(month: number): string {
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return months[(month - 1) % 12];
  }

  // ─── Getters ─────────────────────────────────────────────────

  get dateString(): string {
    return `${this.day} ${this._monthName(this.month)} ${this.year}`;
  }

  get season(): "spring" | "summer" | "autumn" | "winter" {
    if (this.month >= 3 && this.month <= 5) return "spring";
    if (this.month >= 6 && this.month <= 8) return "summer";
    if (this.month >= 9 && this.month <= 11) return "autumn";
    return "winter";
  }

  get currentDay(): number {
    return this.totalDays;
  }

  getMarketPrices(): Record<string, number> {
    const prices: Record<string, number> = {};
    for (const market of this.markets.values()) {
      for (const [productId, state] of market.products) {
        prices[productId] = state.currentPrice;
      }
    }
    return prices;
  }

  // ─── Serialization ──────────────────────────────────────────

  serialize(): object {
    return {
      version: "1.0.0",
      day: this.day,
      month: this.month,
      year: this.year,
      totalDays: this.totalDays,
      indicators: this.indicators,
      rivals: this.rivals,
      news: this.news,
      activeEvents: this.activeEvents,
      unlockedAchievementIds: Array.from(this.unlockedAchievementIds),
      playerCompany: this.playerCompany ? this.playerCompany.toJSON() : null,
      markets: Array.from(this.markets.entries()).map(([id, m]) => [id, m.toJSON()]),
      rivalCompanies: Array.from(this.rivalCompanies.entries()).map(([id, c]) => [id, c.toJSON()]),
    };
  }

  static deserialize(data: Record<string, any>): EconomyEngine {
    const engine = new EconomyEngine();
    engine.day = data.day ?? 1;
    engine.month = data.month ?? 1;
    engine.year = data.year ?? 2025;
    engine.totalDays = data.totalDays ?? 1;
    engine.indicators = { ...engine._initialIndicators(), ...data.indicators };
    engine.rivals = data.rivals ?? engine.rivals;
    engine.news = data.news ?? [];
    engine.activeEvents = data.activeEvents ?? [];
    engine.unlockedAchievementIds = new Set(data.unlockedAchievementIds ?? []);

    if (data.playerCompany) {
      engine.playerCompany = Company.fromJSON(data.playerCompany);
    }

    if (data.markets) {
      engine.markets = new Map();
      for (const [id, mData] of data.markets) {
        engine.markets.set(id, Market.fromJSON(mData as any));
      }
    }

    if (data.rivalCompanies) {
      engine.rivalCompanies = new Map();
      for (const [id, cData] of data.rivalCompanies) {
        engine.rivalCompanies.set(id, Company.fromJSON(cData as Record<string, any>));
      }
    }

    return engine;
  }

  // Private accessor needed for static deserialize
}
