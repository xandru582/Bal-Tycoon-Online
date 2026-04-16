// ============================================================
// NEXUS: Imperio del Mercado — Stock Market Simulation
// ============================================================

import type { EconomicPhase } from "@/types/index";
import { SECTOR_COLORS } from "@/utils/constants";

// ─── Types ────────────────────────────────────────────────────

export interface StockListing {
  ticker: string;
  companyName: string;
  sector: string;
  price: number;
  previousClose: number;
  high52w: number;
  low52w: number;
  marketCap: number;
  peRatio: number;
  dividendYield: number;   // annual %
  beta: number;            // volatility vs market (1=average)
  basePrice: number;       // fundamental value for mean reversion
  priceHistory: { day: number; price: number }[];
  description: string;
}

export interface PlayerPosition {
  ticker: string;
  shares: number;
  avgCost: number;         // average cost per share
  boughtOn: number[];      // day numbers when bought
}

export interface StockOrder {
  id: string;
  ticker: string;
  type: "buy" | "sell";
  shares: number;
  price: number;
  total: number;
  day: number;
  timestamp: number;
}

export interface MarketIndex {
  id: string;
  name: string;
  value: number;
  change: number;           // % daily change
  constituents: string[];   // tickers
}

// ─── Constants ────────────────────────────────────────────────

const TRADE_FEE = 0.001;          // 0.1% broker fee on buys
const HISTORY_SEED_DAYS = 90;     // pre-generated history length
const MA_SHORT = 7;               // 7-day moving average
const MA_LONG = 30;               // 30-day moving average
const RSI_PERIOD = 14;            // RSI window

// Economic phase market-wide drift (daily %)
const PHASE_DRIFT: Record<string, number> = {
  boom:      0.006,
  growth:    0.003,
  stable:    0.001,
  slowdown: -0.001,
  recession:-0.003,
  crisis:   -0.006,
};

// Mean reversion strength: pulls price toward base price (0 = none, 1 = instant)
const MEAN_REVERSION = 0.015;

// ─── Seed Data ────────────────────────────────────────────────

interface StockSeed {
  ticker: string;
  companyName: string;
  sector: string;
  basePrice: number;
  beta: number;
  peRatio: number;
  dividendYield: number;
  sharesOutstanding: number;   // millions
  description: string;
}

const STOCK_SEEDS: StockSeed[] = [
  {
    ticker: "NXS",
    companyName: "Nexus Corporation",
    sector: "tecnologia",
    basePrice: 45,
    beta: 1.2,
    peRatio: 18,
    dividendYield: 2.1,
    sharesOutstanding: 420,
    description:
      "El conglomerado tecnológico más grande de Nueva Vista. Domina los sectores de hardware, computación en la nube y servicios digitales con presencia en más de 40 países.",
  },
  {
    ticker: "VTK",
    companyName: "Vista Tech Solutions",
    sector: "tecnologia",
    basePrice: 23,
    beta: 1.5,
    peRatio: 25,
    dividendYield: 0,
    sharesOutstanding: 310,
    description:
      "Soluciones de software empresarial y ciberseguridad. Proveedor preferido de gobiernos y grandes corporaciones para la protección de infraestructuras críticas.",
  },
  {
    ticker: "RFG",
    companyName: "Reyes Fashion Group",
    sector: "moda",
    basePrice: 34,
    beta: 0.9,
    peRatio: 22,
    dividendYield: 1.8,
    sharesOutstanding: 185,
    description:
      "Grupo de moda premium con presencia global. Sus marcas insignia se venden en más de 60 países, combinando tradición artesanal con diseño de vanguardia.",
  },
  {
    ticker: "GFD",
    companyName: "Global Foods Distribution",
    sector: "alimentacion",
    basePrice: 18,
    beta: 0.7,
    peRatio: 15,
    dividendYield: 3.2,
    sharesOutstanding: 550,
    description:
      "Red de distribución alimentaria y cadena de restaurantes. Opera más de 1 200 puntos de venta y suministra a supermercados en toda la región metropolitana de Nueva Vista.",
  },
  {
    ticker: "ESL",
    companyName: "EnerSol",
    sector: "energia",
    basePrice: 29,
    beta: 1.1,
    peRatio: 30,
    dividendYield: 1.2,
    sharesOutstanding: 290,
    description:
      "Energía solar y renovable para el sector residencial e industrial. Líder en instalación de parques solares con ambiciosos planes de expansión hacia la energía eólica marina.",
  },
  {
    ticker: "NVR",
    companyName: "Nueva Vista Realty",
    sector: "inmobiliario",
    basePrice: 52,
    beta: 0.6,
    peRatio: 12,
    dividendYield: 4.5,
    sharesOutstanding: 230,
    description:
      "La mayor gestora inmobiliaria de la ciudad. Su cartera incluye edificios de oficinas, complejos residenciales de lujo y centros comerciales en los distritos más valorados.",
  },
  {
    ticker: "ENT",
    companyName: "EntertainCo",
    sector: "entretenimiento",
    basePrice: 15,
    beta: 1.8,
    peRatio: 45,
    dividendYield: 0,
    sharesOutstanding: 620,
    description:
      "Plataforma de streaming y eventos en vivo. Con 8 millones de suscriptores activos, produce contenido original premiado y organiza los festivales más populares de Nueva Vista.",
  },
  {
    ticker: "PHX",
    companyName: "PharmaVista",
    sector: "salud",
    basePrice: 67,
    beta: 0.8,
    peRatio: 20,
    dividendYield: 2.8,
    sharesOutstanding: 160,
    description:
      "Investigación farmacéutica y distribución de medicamentos. Cuenta con tres moléculas en fase clínica avanzada y una red de distribución que abarca 120 hospitales públicos y privados.",
  },
  {
    ticker: "STL",
    companyName: "SteelCo",
    sector: "materias_primas",
    basePrice: 11,
    beta: 1.3,
    peRatio: 10,
    dividendYield: 3.5,
    sharesOutstanding: 800,
    description:
      "Siderurgia y materiales industriales. Principal proveedor de acero estructural para las obras de infraestructura de Nueva Vista, con contratos vigentes por más de €400 millones.",
  },
  {
    ticker: "WBK",
    companyName: "Webb Capital",
    sector: "finanzas",
    basePrice: 41,
    beta: 0.9,
    peRatio: 14,
    dividendYield: 2.4,
    sharesOutstanding: 350,
    description:
      "Banco de inversión y gestión de activos. Administra fondos por valor de €12 000 millones y lidera la financiación de los proyectos de energía renovable más ambiciosos del país.",
  },
];

// Market indices definitions
const INDEX_DEFINITIONS = [
  {
    id: "NEXUS-50",
    name: "NEXUS-50 Composite",
    constituents: ["NXS", "VTK", "RFG", "GFD", "ESL", "NVR", "ENT", "PHX", "STL", "WBK"],
    weighting: "marketCap" as const,
  },
  {
    id: "TECH-IDX",
    name: "Tech Index",
    constituents: ["VTK", "NXS", "ENT"],
    weighting: "equal" as const,
  },
  {
    id: "CONSUMER-IDX",
    name: "Consumer Index",
    constituents: ["GFD", "RFG", "ENT"],
    weighting: "equal" as const,
  },
];

// ─── Utility Functions ────────────────────────────────────────

/** Seeded pseudo-random walk for deterministic history generation */
function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

/** Gaussian-approximated random number via Box-Muller (uses Math.random) */
function gaussianRandom(mean: number, stddev: number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + stddev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/** Clamp a number within [min, max] */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Round to 2 decimal places */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Generate a UUID-like string */
function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Generate 90 days of seeded price history for a stock.
 * Starts from basePrice * 0.7 and random-walks toward basePrice.
 */
function generatePriceHistory(
  ticker: string,
  basePrice: number,
  beta: number
): { day: number; price: number }[] {
  const history: { day: number; price: number }[] = [];
  // Start at 70% of current (simulates prior bull run)
  let price = basePrice * 0.7;
  // Slight upward drift over 90 days to reach ~basePrice
  const dailyDrift = (basePrice - price) / HISTORY_SEED_DAYS;
  const tickerSeed = ticker.charCodeAt(0) * 100 + ticker.charCodeAt(1);

  for (let day = 1; day <= HISTORY_SEED_DAYS; day++) {
    const randomFactor = seededRandom(tickerSeed + day * 7.3) * 2 - 1; // [-1, 1]
    const dailyVolatility = 0.015 * beta;                               // base ±1.5% × beta
    const change = price * dailyVolatility * randomFactor + dailyDrift;
    price = Math.max(price + change, 0.5);
    history.push({ day, price: round2(price) });
  }

  return history;
}

// ─── Moving Average & RSI Helpers ─────────────────────────────

function movingAverage(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] ?? 0;
  const slice = prices.slice(-period);
  return slice.reduce((sum, p) => sum + p, 0) / period;
}

function calculateRSI(prices: number[], period: number = RSI_PERIOD): number {
  if (prices.length < period + 1) return 50; // neutral default
  const recent = prices.slice(-(period + 1));
  let gains = 0;
  let losses = 0;
  for (let i = 1; i < recent.length; i++) {
    const diff = recent[i] - recent[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// ─── StockMarket Class ────────────────────────────────────────

export class StockMarket {
  private _listings: Map<string, StockListing>;
  private _positions: Map<string, PlayerPosition>;
  private _orderHistory: StockOrder[];
  private _indices: MarketIndex[];
  private _day: number;

  constructor() {
    this._listings = new Map();
    this._positions = new Map();
    this._orderHistory = [];
    this._indices = [];
    this._day = HISTORY_SEED_DAYS;

    this._initListings();
    this._initIndices();
  }

  // ── Initialization ─────────────────────────────────────────

  private _initListings(): void {
    for (const seed of STOCK_SEEDS) {
      const history = generatePriceHistory(seed.ticker, seed.basePrice, seed.beta);
      const currentPrice = history[history.length - 1]?.price ?? seed.basePrice;
      const prevPrice = history[history.length - 2]?.price ?? currentPrice;

      // Compute 52-week high/low from the generated history
      const allPrices = history.map((h) => h.price);
      const high52w = Math.max(...allPrices);
      const low52w = Math.min(...allPrices);

      const marketCap = round2(currentPrice * seed.sharesOutstanding); // millions

      const listing: StockListing = {
        ticker: seed.ticker,
        companyName: seed.companyName,
        sector: seed.sector,
        price: currentPrice,
        previousClose: prevPrice,
        high52w,
        low52w,
        marketCap,
        peRatio: seed.peRatio,
        dividendYield: seed.dividendYield,
        beta: seed.beta,
        basePrice: seed.basePrice,
        priceHistory: history,
        description: seed.description,
      };

      this._listings.set(seed.ticker, listing);
    }
  }

  private _initIndices(): void {
    this._indices = INDEX_DEFINITIONS.map((def) => {
      const value = this._computeIndexValue(def.constituents, def.weighting);
      return {
        id: def.id,
        name: def.name,
        value: round2(value),
        change: 0,
        constituents: def.constituents,
      };
    });
  }

  // ── Index Computation ──────────────────────────────────────

  private _computeIndexValue(
    constituents: string[],
    weighting: "marketCap" | "equal"
  ): number {
    const stocks = constituents
      .map((t) => this._listings.get(t))
      .filter(Boolean) as StockListing[];

    if (stocks.length === 0) return 0;

    if (weighting === "equal") {
      // Simple average of prices, scaled to base 1000 at init
      return stocks.reduce((sum, s) => sum + s.price, 0) / stocks.length;
    }

    // Market-cap weighted index
    const totalCap = stocks.reduce((sum, s) => sum + s.marketCap, 0);
    if (totalCap === 0) return 0;
    return stocks.reduce((sum, s) => sum + (s.price * s.marketCap) / totalCap, 0);
  }

  private _updateIndices(): void {
    for (const index of this._indices) {
      const prevValue = index.value;
      const def = INDEX_DEFINITIONS.find((d) => d.id === index.id);
      if (!def) continue;

      const newValue = this._computeIndexValue(def.constituents, def.weighting);
      index.change = prevValue > 0 ? round2(((newValue - prevValue) / prevValue) * 100) : 0;
      index.value = round2(newValue);
    }
  }

  // ── Market Update ──────────────────────────────────────────

  /**
   * Advance the market one tick (called once per game day).
   * Applies random walk with beta weighting and economic phase drift.
   */
  update(day: number, economicPhase: string): void {
    this._day = day;

    const phaseDrift = PHASE_DRIFT[economicPhase] ?? PHASE_DRIFT["stable"];

    // Market-wide factor adds correlation across all stocks
    // Tighter sigma so market shocks are meaningful but not destructive
    const marketFactor = gaussianRandom(phaseDrift, 0.008);

    for (const [ticker, listing] of this._listings) {
      const prevPrice = listing.price;
      listing.previousClose = prevPrice;

      // ── 1. Stock-specific noise: ±1.2% base × beta ──────────
      const stockDailyVol = 0.012 * listing.beta;
      const stockSpecific = gaussianRandom(0, stockDailyVol);

      // ── 2. Market correlation component ─────────────────────
      const marketComponent = marketFactor * listing.beta;

      // ── 3. Mean reversion toward fundamental (basePrice) ────
      // Prevents runaway crashes/bubbles. Pulls harder when far from base.
      const deviation = (listing.basePrice - prevPrice) / listing.basePrice;
      const reversionForce = deviation * MEAN_REVERSION;

      // ── 4. Fundamental drift: base price itself grows slowly ─
      // Simulates company growth over time (0.01% per day ≈ +3.7%/year)
      listing.basePrice = round2(listing.basePrice * 1.0001);

      // ── 5. Total return ──────────────────────────────────────
      const totalReturn = stockSpecific + marketComponent + reversionForce;

      // Clamp single-day move to ±15% (circuit breaker)
      const clampedReturn = clamp(totalReturn, -0.15, 0.15);
      let newPrice = prevPrice * (1 + clampedReturn);

      // Hard floor: price can't go below 10% of base price (not a fixed 0.10)
      const priceFloor = Math.max(0.1, listing.basePrice * 0.1);
      newPrice = Math.max(newPrice, priceFloor);
      listing.price = round2(newPrice);

      // Update 52-week high/low
      if (listing.price > listing.high52w) listing.high52w = listing.price;
      if (listing.price < listing.low52w) listing.low52w = listing.price;

      // Update market cap
      const seed = STOCK_SEEDS.find((s) => s.ticker === ticker);
      if (seed) {
        listing.marketCap = round2(listing.price * seed.sharesOutstanding);
      }

      // Append to price history
      listing.priceHistory.push({ day, price: listing.price });

      // Keep history bounded to 365 entries
      if (listing.priceHistory.length > 365) {
        listing.priceHistory.shift();
      }
    }

    this._updateIndices();
  }

  // ── Trading ────────────────────────────────────────────────

  /**
   * Buy shares of a stock.
   * Total cost = shares × price × (1 + TRADE_FEE).
   */
  buyShares(
    ticker: string,
    shares: number,
    cash: number
  ): { success: boolean; cost: number; message: string } {
    const listing = this._listings.get(ticker);

    if (!listing) {
      return { success: false, cost: 0, message: `Ticker "${ticker}" no encontrado en el mercado.` };
    }
    if (shares <= 0 || !Number.isInteger(shares)) {
      return { success: false, cost: 0, message: "El número de acciones debe ser un entero positivo." };
    }

    const cost = round2(shares * listing.price * (1 + TRADE_FEE));

    if (cash < cost) {
      return {
        success: false,
        cost,
        message: `Fondos insuficientes. Necesitas €${cost.toFixed(2)} y dispones de €${cash.toFixed(2)}.`,
      };
    }

    // Update or create position
    const existing = this._positions.get(ticker);
    if (existing) {
      const totalShares = existing.shares + shares;
      const totalCost = existing.avgCost * existing.shares + listing.price * shares;
      existing.avgCost = round2(totalCost / totalShares);
      existing.shares = totalShares;
      existing.boughtOn.push(this._day);
    } else {
      this._positions.set(ticker, {
        ticker,
        shares,
        avgCost: listing.price,
        boughtOn: [this._day],
      });
    }

    // Record order
    const order: StockOrder = {
      id: generateId(),
      ticker,
      type: "buy",
      shares,
      price: listing.price,
      total: cost,
      day: this._day,
      timestamp: Date.now(),
    };
    this._orderHistory.push(order);

    return {
      success: true,
      cost,
      message: `Compra ejecutada: ${shares} acc. de ${ticker} a €${listing.price.toFixed(2)}/acc. Coste total: €${cost.toFixed(2)}.`,
    };
  }

  /**
   * Sell shares of a stock.
   * Proceeds = shares × current price.
   * Profit = (sellPrice − avgCost) × shares.
   */
  sellShares(
    ticker: string,
    shares: number
  ): { success: boolean; proceeds: number; profit: number; message: string } {
    const listing = this._listings.get(ticker);
    const position = this._positions.get(ticker);

    if (!listing) {
      return { success: false, proceeds: 0, profit: 0, message: `Ticker "${ticker}" no encontrado.` };
    }
    if (!position || position.shares === 0) {
      return { success: false, proceeds: 0, profit: 0, message: `No tienes posición abierta en ${ticker}.` };
    }
    if (shares <= 0 || !Number.isInteger(shares)) {
      return { success: false, proceeds: 0, profit: 0, message: "El número de acciones debe ser un entero positivo." };
    }
    if (shares > position.shares) {
      return {
        success: false,
        proceeds: 0,
        profit: 0,
        message: `Sólo tienes ${position.shares} acciones de ${ticker}, no puedes vender ${shares}.`,
      };
    }

    const proceeds = round2(shares * listing.price);
    const profit = round2((listing.price - position.avgCost) * shares);
    const profitPct = round2(((listing.price - position.avgCost) / position.avgCost) * 100);

    // Update position
    position.shares -= shares;
    if (position.shares === 0) {
      this._positions.delete(ticker);
    }

    // Record order
    const order: StockOrder = {
      id: generateId(),
      ticker,
      type: "sell",
      shares,
      price: listing.price,
      total: proceeds,
      day: this._day,
      timestamp: Date.now(),
    };
    this._orderHistory.push(order);

    const profitLabel = profit >= 0 ? `ganancia de €${profit.toFixed(2)}` : `pérdida de €${Math.abs(profit).toFixed(2)}`;
    return {
      success: true,
      proceeds,
      profit,
      message: `Venta ejecutada: ${shares} acc. de ${ticker} a €${listing.price.toFixed(2)}/acc. Ingresos: €${proceeds.toFixed(2)} (${profitLabel}, ${profitPct > 0 ? "+" : ""}${profitPct.toFixed(2)}%).`,
    };
  }

  // ── Portfolio Analytics ────────────────────────────────────

  /** Total current market value of all held positions */
  getPortfolioValue(): number {
    let total = 0;
    for (const [ticker, position] of this._positions) {
      const listing = this._listings.get(ticker);
      if (listing) {
        total += position.shares * listing.price;
      }
    }
    return round2(total);
  }

  /** Overall portfolio return as a percentage */
  getPortfolioReturn(): number {
    let totalInvested = 0;
    let currentValue = 0;
    for (const [ticker, position] of this._positions) {
      const listing = this._listings.get(ticker);
      if (listing) {
        totalInvested += position.avgCost * position.shares;
        currentValue += listing.price * position.shares;
      }
    }
    if (totalInvested === 0) return 0;
    return round2(((currentValue - totalInvested) / totalInvested) * 100);
  }

  /** Detailed return for a single position */
  getPositionReturn(
    ticker: string
  ): { value: number; profit: number; returnPct: number } {
    const position = this._positions.get(ticker);
    const listing = this._listings.get(ticker);

    if (!position || !listing) {
      return { value: 0, profit: 0, returnPct: 0 };
    }

    const value = round2(position.shares * listing.price);
    const invested = position.avgCost * position.shares;
    const profit = round2(value - invested);
    const returnPct = invested > 0 ? round2((profit / invested) * 100) : 0;

    return { value, profit, returnPct };
  }

  /**
   * Calculate dividend income for the current month.
   * Dividends are paid monthly: (shares × price × annualYield%) / 12
   * Uses a last-paid tracker to avoid skipping at high game speed.
   */
  private _lastDividendMonth = 0;

  getDividendIncome(day: number): number {
    const currentMonth = Math.floor(day / 30);
    if (currentMonth <= this._lastDividendMonth) return 0;
    this._lastDividendMonth = currentMonth;

    let income = 0;
    for (const [ticker, position] of this._positions) {
      const listing = this._listings.get(ticker);
      if (listing && listing.dividendYield > 0) {
        const annualDividend = position.shares * listing.price * (listing.dividendYield / 100);
        income += annualDividend / 12;
      }
    }
    return round2(income);
  }

  // ── Market Screeners ───────────────────────────────────────

  /** Top N stocks by daily price change (gainers) */
  getTopGainers(n: number): StockListing[] {
    return [...this._listings.values()]
      .sort((a, b) => {
        const changeA = a.previousClose > 0 ? (a.price - a.previousClose) / a.previousClose : 0;
        const changeB = b.previousClose > 0 ? (b.price - b.previousClose) / b.previousClose : 0;
        return changeB - changeA;
      })
      .slice(0, n);
  }

  /** Top N stocks by daily price change (losers) */
  getTopLosers(n: number): StockListing[] {
    return [...this._listings.values()]
      .sort((a, b) => {
        const changeA = a.previousClose > 0 ? (a.price - a.previousClose) / a.previousClose : 0;
        const changeB = b.previousClose > 0 ? (b.price - b.previousClose) / b.previousClose : 0;
        return changeA - changeB;
      })
      .slice(0, n);
  }

  /** Average % daily change per sector */
  getSectorPerformance(): Record<string, number> {
    const sectorData: Record<string, { totalChange: number; count: number }> = {};

    for (const listing of this._listings.values()) {
      const sector = listing.sector;
      if (!sectorData[sector]) sectorData[sector] = { totalChange: 0, count: 0 };

      const dailyChange =
        listing.previousClose > 0
          ? ((listing.price - listing.previousClose) / listing.previousClose) * 100
          : 0;

      sectorData[sector].totalChange += dailyChange;
      sectorData[sector].count += 1;
    }

    const result: Record<string, number> = {};
    for (const [sector, data] of Object.entries(sectorData)) {
      result[sector] = data.count > 0 ? round2(data.totalChange / data.count) : 0;
    }
    return result;
  }

  // ── Technical Analysis ─────────────────────────────────────

  /**
   * Simple technical signal based on moving average crossover and RSI.
   * - "buy"  → MA7 > MA30 AND RSI < 70
   * - "sell" → MA7 < MA30 OR RSI > 75
   * - "hold" → otherwise
   */
  getTechnicalSignal(ticker: string): "buy" | "hold" | "sell" {
    const listing = this._listings.get(ticker);
    if (!listing || listing.priceHistory.length < MA_LONG + 1) return "hold";

    const prices = listing.priceHistory.map((h) => h.price);

    const ma7 = movingAverage(prices, MA_SHORT);
    const ma30 = movingAverage(prices, MA_LONG);
    const rsi = calculateRSI(prices, RSI_PERIOD);

    if (ma7 > ma30 && rsi < 70) return "buy";
    if (ma7 < ma30 || rsi > 75) return "sell";
    return "hold";
  }

  // ── Accessors ──────────────────────────────────────────────

  getListing(ticker: string): StockListing | undefined {
    return this._listings.get(ticker);
  }

  getAllListings(): StockListing[] {
    return [...this._listings.values()];
  }

  /** Alias used by GlobalStockService */
  getListings(): StockListing[] {
    return this.getAllListings();
  }

  /** Directly set a ticker's price (used to restore from DB) */
  setPrice(ticker: string, price: number): void {
    const listing = this._listings.get(ticker);
    if (listing) listing.price = price;
  }

  // ── Portfolio helpers for per-player tracking ───────────────

  addToPortfolio(ticker: string, shares: number, price: number): void {
    const existing = this._positions.get(ticker);
    if (existing) {
      const totalShares = existing.shares + shares;
      existing.avgCost = (existing.avgCost * existing.shares + price * shares) / totalShares;
      existing.shares = totalShares;
      existing.boughtOn.push(this._day);
    } else {
      this._positions.set(ticker, { ticker, shares, avgCost: price, boughtOn: [this._day] });
    }
  }

  removeFromPortfolio(ticker: string, shares: number): void {
    const existing = this._positions.get(ticker);
    if (!existing) return;
    existing.shares -= shares;
    if (existing.shares <= 0) this._positions.delete(ticker);
  }

  getPortfolioShares(ticker: string): number {
    return this._positions.get(ticker)?.shares ?? 0;
  }

  getPositions(): PlayerPosition[] {
    return [...this._positions.values()];
  }

  getOrderHistory(limit?: number): StockOrder[] {
    const history = [...this._orderHistory].reverse();
    return limit !== undefined ? history.slice(0, limit) : history;
  }

  getIndices(): MarketIndex[] {
    return [...this._indices];
  }

  getIndex(id: string): MarketIndex | undefined {
    return this._indices.find((i) => i.id === id);
  }

  getCurrentDay(): number {
    return this._day;
  }

  /** Return the SECTOR_COLORS map (for UI consumption) */
  getSectorColor(sector: string): string {
    return SECTOR_COLORS[sector] ?? "#7b8fa8";
  }

  // ── Serialization ──────────────────────────────────────────

  /** Instance method — restores state from a serialized snapshot */
  fromJSON(data: unknown): void {
    if (!data || typeof data !== "object") return;
    const d = data as Record<string, unknown>;
    if (typeof d["day"] === "number") this._day = d["day"];
    if (typeof d["lastDividendMonth"] === "number") this._lastDividendMonth = d["lastDividendMonth"];
    if (d["listings"] && typeof d["listings"] === "object") {
      this._listings.clear();
      for (const [ticker, listing] of Object.entries(d["listings"] as Record<string, StockListing>)) {
        if (listing && typeof listing === "object") {
          this._listings.set(ticker, { ...listing, priceHistory: listing.priceHistory ?? [] });
        }
      }
    }
    if (d["positions"] && typeof d["positions"] === "object") {
      this._positions.clear();
      for (const [ticker, pos] of Object.entries(d["positions"] as Record<string, PlayerPosition>)) {
        this._positions.set(ticker, pos);
      }
    }
    if (Array.isArray(d["orderHistory"])) this._orderHistory = d["orderHistory"] as StockOrder[];
    if (Array.isArray(d["indices"])) this._indices = d["indices"] as MarketIndex[];
  }

  toJSON(): Record<string, unknown> {
    return {
      day: this._day,
      lastDividendMonth: this._lastDividendMonth,
      listings: Object.fromEntries(this._listings),
      positions: Object.fromEntries(this._positions),
      orderHistory: this._orderHistory,
      indices: this._indices,
    };
  }

  static fromJSON(data: unknown): StockMarket {
    const market = new StockMarket();

    if (!data || typeof data !== "object") return market;

    const d = data as Record<string, unknown>;

    // Restore day
    if (typeof d["day"] === "number") {
      market._day = d["day"];
    }
    if (typeof d["lastDividendMonth"] === "number") {
      market._lastDividendMonth = d["lastDividendMonth"];
    }

    // Restore listings
    if (d["listings"] && typeof d["listings"] === "object") {
      market._listings.clear();
      for (const [ticker, listing] of Object.entries(
        d["listings"] as Record<string, StockListing>
      )) {
        // Backwards-compat: old saves won't have basePrice, use seed or current price
        if (!listing.basePrice || listing.basePrice <= 0) {
          const seed = STOCK_SEEDS.find(s => s.ticker === ticker);
          listing.basePrice = seed?.basePrice ?? listing.price;
        }
        market._listings.set(ticker, listing);
      }
    }

    // Restore positions
    if (d["positions"] && typeof d["positions"] === "object") {
      market._positions.clear();
      for (const [ticker, position] of Object.entries(
        d["positions"] as Record<string, PlayerPosition>
      )) {
        market._positions.set(ticker, position);
      }
    }

    // Restore order history
    if (Array.isArray(d["orderHistory"])) {
      market._orderHistory = d["orderHistory"] as StockOrder[];
    }

    // Restore indices
    if (Array.isArray(d["indices"])) {
      market._indices = d["indices"] as MarketIndex[];
    }

    return market;
  }
}

// ─── Convenience Exports ──────────────────────────────────────

/** Format a stock's daily change as a signed percentage string */
export function formatDailyChange(listing: StockListing): string {
  if (listing.previousClose === 0) return "0.00%";
  const pct = ((listing.price - listing.previousClose) / listing.previousClose) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

/** Return raw daily change percentage for a listing */
export function getDailyChangePct(listing: StockListing): number {
  if (listing.previousClose === 0) return 0;
  return round2(((listing.price - listing.previousClose) / listing.previousClose) * 100);
}

/** Calculate the intrinsic fair-value estimate using a simple Gordon Growth Model */
export function estimateFairValue(listing: StockListing, growthRate = 0.05, discountRate = 0.10): number {
  if (listing.dividendYield === 0) {
    // For non-dividend stocks, use rough P/E-based estimate
    const earningsPerShare = listing.price / listing.peRatio;
    return round2(earningsPerShare * (listing.peRatio * (1 + growthRate)));
  }
  const annualDividend = (listing.dividendYield / 100) * listing.price;
  if (discountRate <= growthRate) return listing.price; // model breaks
  return round2(annualDividend * (1 + growthRate) / (discountRate - growthRate));
}
