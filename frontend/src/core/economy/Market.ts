// ============================================================
// NEXUS: Imperio del Mercado — Market Simulation
// ============================================================

import type {
  Product,
  PricePoint,
  MarketOrder,
  EconomicIndicators,
  MarketEvent,
} from "@/types/index";
import { OrderType, ProductCategory, NewsSeverity } from "@/types/index";
import { PRODUCTS } from "@/data/products";

// ─── Internal State Types ─────────────────────────────────────

export interface MarketProductState {
  productId: string;
  currentPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  supply: number;        // 0–2, 1 = balanced
  demand: number;        // 0–2, 1 = balanced
  trend: "rising" | "falling" | "stable";
  lastUpdate: number;    // game day
  volume24h: number;
  volatilityIndex: number; // 0–1
  ma7: number;
  ma30: number;
  rsi: number;           // 0–100
  macdLine: number;
  signalLine: number;
  bollingerUpper: number;
  bollingerLower: number;
  bollingerMiddle: number;
  changePercent: number;
}

export interface TechnicalAnalysis {
  rsi: number;
  macd: number;
  signal: number;
  histogram: number;
  bollingerUpper: number;
  bollingerLower: number;
  bollingerMiddle: number;
  ma7: number;
  ma30: number;
  trendSignal: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
}

export interface ArbitrageOpportunity {
  productId: string;
  buyMarketId: string;
  sellMarketId: string;
  buyPrice: number;
  sellPrice: number;
  spreadPercent: number;
  estimatedProfit: number;
}

export interface MarketEventResult {
  title: string;
  description: string;
  affectedProducts: string[];
  priceMultiplier: number;
  severity: NewsSeverity;
}

// ─── Season Configuration ─────────────────────────────────────

type Season = "spring" | "summer" | "autumn" | "winter";

const SEASON_MULTIPLIERS: Record<Season, Partial<Record<ProductCategory, number>>> = {
  spring: {
    [ProductCategory.Moda]: 1.15,
    [ProductCategory.Alimentacion]: 1.05,
    [ProductCategory.Entretenimiento]: 1.10,
    [ProductCategory.Energia]: 0.90,
  },
  summer: {
    [ProductCategory.Moda]: 1.20,
    [ProductCategory.Alimentacion]: 1.15,
    [ProductCategory.Entretenimiento]: 1.25,
    [ProductCategory.Energia]: 1.10,
    [ProductCategory.Tecnologia]: 0.95,
  },
  autumn: {
    [ProductCategory.Moda]: 1.10,
    [ProductCategory.Alimentacion]: 1.10,
    [ProductCategory.MateriasPrimas]: 1.15,
    [ProductCategory.Energia]: 1.15,
  },
  winter: {
    [ProductCategory.Moda]: 1.30,
    [ProductCategory.Alimentacion]: 1.20,
    [ProductCategory.Energia]: 1.35,
    [ProductCategory.Entretenimiento]: 1.15,
    [ProductCategory.Tecnologia]: 1.10,
  },
};

// ─── Circular Price Buffer ────────────────────────────────────

const MAX_HISTORY = 365;

function pushHistory(history: PricePoint[], point: PricePoint): PricePoint[] {
  const next = [...history, point];
  if (next.length > MAX_HISTORY) return next.slice(next.length - MAX_HISTORY);
  return next;
}

// ─── Market Class ─────────────────────────────────────────────

export class Market {
  id: string;
  name: string;
  category: ProductCategory;
  products: Map<string, MarketProductState>;
  orderBook: MarketOrder[];
  priceHistory: Map<string, PricePoint[]>;
  activeEvents: MarketEventResult[];
  currentDay: number;

  constructor(id: string, name: string, category: ProductCategory) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.products = new Map();
    this.orderBook = [];
    this.priceHistory = new Map();
    this.activeEvents = [];
    this.currentDay = 1;

    this._initProducts();
  }

  // ─── Initialization ────────────────────────────────────────

  private _initProducts(): void {
    const categoryProducts = Object.values(PRODUCTS).filter(p => p.category === this.category);
    for (const product of categoryProducts) {
      const jitter = 0.9 + Math.random() * 0.2;
      const price = product.basePrice * jitter;
      const state: MarketProductState = {
        productId: product.id,
        currentPrice: price,
        openPrice: price,
        highPrice: price * 1.01,
        lowPrice: price * 0.99,
        supply: 0.8 + Math.random() * 0.4,
        demand: 0.8 + Math.random() * 0.4,
        trend: "stable",
        lastUpdate: 1,
        volume24h: Math.floor(Math.random() * 500) + 50,
        volatilityIndex: product.volatility,
        ma7: price,
        ma30: price,
        rsi: 45 + Math.random() * 10,
        macdLine: 0,
        signalLine: 0,
        bollingerUpper: price * 1.05,
        bollingerLower: price * 0.95,
        bollingerMiddle: price,
        changePercent: 0,
      };
      this.products.set(product.id, state);
      this.priceHistory.set(product.id, [{ day: 1, price, volume: state.volume24h }]);
    }
  }

  // ─── Season Helper ─────────────────────────────────────────

  private _getSeason(day: number): Season {
    const dayOfYear = ((day - 1) % 365) + 1;
    if (dayOfYear <= 90) return "winter";
    if (dayOfYear <= 181) return "spring";
    if (dayOfYear <= 273) return "summer";
    if (dayOfYear <= 334) return "autumn";
    return "winter";
  }

  // ─── Technical Indicators ──────────────────────────────────

  private _calcMA(history: PricePoint[], period: number): number {
    if (history.length === 0) return 0;
    const slice = history.slice(-period);
    return slice.reduce((s, p) => s + p.price, 0) / slice.length;
  }

  private _calcRSI(history: PricePoint[], period = 14): number {
    if (history.length < period + 1) return 50;
    const slice = history.slice(-(period + 1));
    let gains = 0;
    let losses = 0;
    for (let i = 1; i < slice.length; i++) {
      const diff = slice[i].price - slice[i - 1].price;
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  private _calcEMA(history: PricePoint[], period: number): number {
    if (history.length === 0) return 0;
    const k = 2 / (period + 1);
    let ema = history[0].price;
    for (let i = 1; i < history.length; i++) {
      ema = history[i].price * k + ema * (1 - k);
    }
    return ema;
  }

  private _calcMACD(history: PricePoint[]): { macd: number; signal: number } {
    if (history.length < 26) return { macd: 0, signal: 0 };
    const ema12 = this._calcEMA(history.slice(-12), 12);
    const ema26 = this._calcEMA(history.slice(-26), 26);
    const macd = ema12 - ema26;
    // signal: 9-period EMA of MACD — approximate with recent
    const signal = macd * 0.8;
    return { macd, signal };
  }

  private _calcBollinger(history: PricePoint[], period = 20): {
    upper: number;
    lower: number;
    middle: number;
  } {
    if (history.length < period) {
      const p = history[history.length - 1]?.price ?? 100;
      return { upper: p * 1.05, lower: p * 0.95, middle: p };
    }
    const slice = history.slice(-period);
    const mean = slice.reduce((s, p) => s + p.price, 0) / period;
    const variance = slice.reduce((s, p) => s + Math.pow(p.price - mean, 2), 0) / period;
    const std = Math.sqrt(variance);
    return { upper: mean + 2 * std, lower: mean - 2 * std, middle: mean };
  }

  private _updateIndicators(state: MarketProductState, history: PricePoint[]): void {
    state.ma7 = this._calcMA(history, 7);
    state.ma30 = this._calcMA(history, 30);
    state.rsi = this._calcRSI(history);
    const { macd, signal } = this._calcMACD(history);
    state.macdLine = macd;
    state.signalLine = signal;
    const bb = this._calcBollinger(history);
    state.bollingerUpper = bb.upper;
    state.bollingerLower = bb.lower;
    state.bollingerMiddle = bb.middle;
  }

  // ─── Update ────────────────────────────────────────────────

  update(dt: number, indicators: EconomicIndicators): void {
    this.currentDay += dt;
    const day = Math.floor(this.currentDay);
    const season = this._getSeason(day);
    const seasonMultipliers = SEASON_MULTIPLIERS[season];

    // Expire old events
    this.activeEvents = [];

    for (const [productId, state] of this.products) {
      const product = PRODUCTS[productId];
      if (!product) continue;

      const history = this.priceHistory.get(productId) ?? [];
      const oldPrice = state.currentPrice;

      // --- Supply/demand imbalance ---
      const imbalance = state.demand - state.supply;
      const imbalanceFactor = imbalance * 0.03;

      // --- Random walk ---
      const dailyVol = state.volatilityIndex * 0.04;
      const randomMove = (Math.random() - 0.5) * 2 * dailyVol;

      // --- Mean reversion ---
      const meanReversionSpeed = 0.02;
      const reversion = (product.basePrice - state.currentPrice) / product.basePrice * meanReversionSpeed;

      // --- Seasonal multiplier ---
      const seasonMult = seasonMultipliers[product.category] ?? 1.0;
      const seasonDrift = (seasonMult - 1) * 0.005;

      // --- Economic indicators ---
      const gdpFactor = (indicators.gdpGrowth - 2.5) * 0.002;
      const inflationFactor = indicators.inflation * 0.0005;
      const confidenceFactor = (indicators.consumerConfidence - 50) * 0.001;

      // --- Compose price change ---
      const totalChange = imbalanceFactor + randomMove + reversion + seasonDrift + gdpFactor + inflationFactor + confidenceFactor;
      let newPrice = oldPrice * (1 + totalChange);

      // --- Clamp to product limits ---
      newPrice = Math.max(product.minPrice, Math.min(product.maxPrice, newPrice));

      // --- Update supply/demand slowly ---
      state.supply = Math.max(0.1, Math.min(2, state.supply + (Math.random() - 0.5) * 0.05));
      state.demand = Math.max(0.1, Math.min(2, state.demand + (Math.random() - 0.5) * 0.05));

      // --- Volume ---
      const baseVolume = 100 + Math.random() * 400;
      state.volume24h = Math.floor(baseVolume * (state.demand / state.supply));

      // --- High/low ---
      state.highPrice = Math.max(state.highPrice, newPrice);
      state.lowPrice = Math.min(state.lowPrice, newPrice);

      // --- Trend ---
      state.changePercent = (newPrice - state.openPrice) / state.openPrice * 100;
      if (state.changePercent > 1) state.trend = "rising";
      else if (state.changePercent < -1) state.trend = "falling";
      else state.trend = "stable";

      state.currentPrice = parseFloat(newPrice.toFixed(2));
      state.lastUpdate = day;

      // --- Update price history (once per game day) ---
      const lastHistoryDay = history[history.length - 1]?.day ?? 0;
      if (day > lastHistoryDay) {
        const newHistory = pushHistory(history, {
          day,
          price: state.currentPrice,
          volume: state.volume24h,
        });
        this.priceHistory.set(productId, newHistory);
        this._updateIndicators(state, newHistory);

        // Reset open price for new day
        state.openPrice = state.currentPrice;
        state.highPrice = state.currentPrice;
        state.lowPrice = state.currentPrice;
      } else {
        this._updateIndicators(state, history);
      }

      // --- Volatility update ---
      const priceRange = (state.highPrice - state.lowPrice) / state.currentPrice;
      state.volatilityIndex = Math.max(0.01, Math.min(1, product.volatility * 0.7 + priceRange * 0.3));
    }

    // --- Process order book ---
    this._processOrders();
  }

  // ─── Order Book ────────────────────────────────────────────

  private _processOrders(): void {
    const now = Math.floor(this.currentDay);
    const remaining: MarketOrder[] = [];

    for (const order of this.orderBook) {
      if (order.expiresAt !== undefined && order.expiresAt < now) continue;
      const state = this.products.get(order.productId);
      if (!state) continue;

      const canFill =
        (order.type === OrderType.Buy && (order.price === 0 || order.price >= state.currentPrice)) ||
        (order.type === OrderType.Sell && (order.price === 0 || order.price <= state.currentPrice)) ||
        order.type === OrderType.Limit;

      if (canFill) {
        const fillQty = order.quantity - order.filled;
        order.filled += fillQty;
        if (order.type === OrderType.Buy) {
          state.demand = Math.min(2, state.demand + fillQty * 0.001);
          state.supply = Math.max(0.1, state.supply - fillQty * 0.0005);
        } else {
          state.supply = Math.min(2, state.supply + fillQty * 0.001);
          state.demand = Math.max(0.1, state.demand - fillQty * 0.0005);
        }
      } else {
        remaining.push(order);
      }
    }

    this.orderBook = remaining;
  }

  // ─── Buy / Sell ────────────────────────────────────────────

  buyProduct(productId: string, quantity: number, price: number): {
    success: boolean;
    executedPrice: number;
    totalCost: number;
    message: string;
  } {
    const state = this.products.get(productId);
    if (!state) return { success: false, executedPrice: 0, totalCost: 0, message: "Producto no encontrado" };

    const slippage = 1 + (quantity / 1000) * 0.005;
    const executedPrice = parseFloat((state.currentPrice * slippage).toFixed(2));

    if (price > 0 && executedPrice > price) {
      return { success: false, executedPrice, totalCost: 0, message: "Precio de mercado supera el límite" };
    }

    const totalCost = executedPrice * quantity;
    state.demand = Math.min(2, state.demand + quantity * 0.002);
    state.supply = Math.max(0.1, state.supply - quantity * 0.001);
    state.volume24h += quantity;

    const newPrice = state.currentPrice * (1 + (quantity / 5000) * 0.01);
    state.currentPrice = parseFloat(Math.min(state.currentPrice * 1.05, newPrice).toFixed(2));

    const order: MarketOrder = {
      id: `ord_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      companyId: "player",
      productId,
      type: OrderType.Buy,
      quantity,
      price: executedPrice,
      filled: quantity,
      createdAt: Math.floor(this.currentDay),
      isAI: false,
    };
    this.orderBook.push(order);

    return { success: true, executedPrice, totalCost, message: "Compra ejecutada" };
  }

  sellProduct(productId: string, quantity: number, price: number): {
    success: boolean;
    executedPrice: number;
    totalRevenue: number;
    message: string;
  } {
    const state = this.products.get(productId);
    if (!state) return { success: false, executedPrice: 0, totalRevenue: 0, message: "Producto no encontrado" };

    const slippage = 1 - (quantity / 1000) * 0.005;
    const executedPrice = parseFloat((state.currentPrice * slippage).toFixed(2));

    if (price > 0 && executedPrice < price) {
      return { success: false, executedPrice, totalRevenue: 0, message: "Precio de mercado por debajo del límite" };
    }

    const totalRevenue = executedPrice * quantity;
    state.supply = Math.min(2, state.supply + quantity * 0.002);
    state.demand = Math.max(0.1, state.demand - quantity * 0.001);
    state.volume24h += quantity;

    const newPrice = state.currentPrice * (1 - (quantity / 5000) * 0.01);
    state.currentPrice = parseFloat(Math.max(state.currentPrice * 0.95, newPrice).toFixed(2));

    const order: MarketOrder = {
      id: `ord_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      companyId: "player",
      productId,
      type: OrderType.Sell,
      quantity,
      price: executedPrice,
      filled: quantity,
      createdAt: Math.floor(this.currentDay),
      isAI: false,
    };
    this.orderBook.push(order);

    return { success: true, executedPrice, totalRevenue, message: "Venta ejecutada" };
  }

  // ─── Arbitrage ─────────────────────────────────────────────

  getArbitrageOpportunities(otherMarkets: Market[]): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    for (const [productId, myState] of this.products) {
      for (const otherMarket of otherMarkets) {
        const otherState = otherMarket.products.get(productId);
        if (!otherState) continue;

        const spreadPercent = Math.abs(myState.currentPrice - otherState.currentPrice) / Math.min(myState.currentPrice, otherState.currentPrice) * 100;
        if (spreadPercent > 15) {
          const buyMarket = myState.currentPrice < otherState.currentPrice ? this : otherMarket;
          const sellMarket = myState.currentPrice < otherState.currentPrice ? otherMarket : this;
          const buyPrice = Math.min(myState.currentPrice, otherState.currentPrice);
          const sellPrice = Math.max(myState.currentPrice, otherState.currentPrice);
          const estimatedProfit = (sellPrice - buyPrice) * 100;

          opportunities.push({
            productId,
            buyMarketId: buyMarket.id,
            sellMarketId: sellMarket.id,
            buyPrice,
            sellPrice,
            spreadPercent,
            estimatedProfit,
          });
        }
      }
    }

    return opportunities.sort((a, b) => b.spreadPercent - a.spreadPercent);
  }

  // ─── Technical Analysis ────────────────────────────────────

  getTechnicalAnalysis(productId: string): TechnicalAnalysis | null {
    const state = this.products.get(productId);
    if (!state) return null;

    let trendSignal: TechnicalAnalysis["trendSignal"] = "hold";
    let score = 0;

    if (state.rsi < 30) score += 2;
    else if (state.rsi < 40) score += 1;
    else if (state.rsi > 70) score -= 2;
    else if (state.rsi > 60) score -= 1;

    if (state.macdLine > state.signalLine) score += 1;
    else score -= 1;

    if (state.currentPrice > state.ma7 && state.ma7 > state.ma30) score += 2;
    else if (state.currentPrice < state.ma7 && state.ma7 < state.ma30) score -= 2;

    if (state.currentPrice < state.bollingerLower) score += 1;
    else if (state.currentPrice > state.bollingerUpper) score -= 1;

    if (score >= 4) trendSignal = "strong_buy";
    else if (score >= 2) trendSignal = "buy";
    else if (score <= -4) trendSignal = "strong_sell";
    else if (score <= -2) trendSignal = "sell";
    else trendSignal = "hold";

    return {
      rsi: parseFloat(state.rsi.toFixed(2)),
      macd: parseFloat(state.macdLine.toFixed(4)),
      signal: parseFloat(state.signalLine.toFixed(4)),
      histogram: parseFloat((state.macdLine - state.signalLine).toFixed(4)),
      bollingerUpper: parseFloat(state.bollingerUpper.toFixed(2)),
      bollingerLower: parseFloat(state.bollingerLower.toFixed(2)),
      bollingerMiddle: parseFloat(state.bollingerMiddle.toFixed(2)),
      ma7: parseFloat(state.ma7.toFixed(2)),
      ma30: parseFloat(state.ma30.toFixed(2)),
      trendSignal,
    };
  }

  // ─── Market Events ─────────────────────────────────────────

  generateMarketEvent(): MarketEventResult | null {
    const highVolProducts = Array.from(this.products.values()).filter(s => s.volatilityIndex > 0.5);
    const baseChance = 0.05 + highVolProducts.length * 0.01;
    if (Math.random() > baseChance) return null;

    const events: Array<Omit<MarketEventResult, "affectedProducts">> = [
      {
        title: "Escasez de suministro",
        description: `Crisis de suministro detectada en el mercado de ${this.name}. Los precios suben bruscamente.`,
        priceMultiplier: 1.15 + Math.random() * 0.1,
        severity: NewsSeverity.Warning,
      },
      {
        title: "Superávit de mercado",
        description: `Exceso de producción en ${this.name}. Los precios caen significativamente.`,
        priceMultiplier: 0.82 + Math.random() * 0.08,
        severity: NewsSeverity.Warning,
      },
      {
        title: "Shock de demanda positivo",
        description: `Aumento inesperado de demanda en ${this.name}. Los compradores se agolpan.`,
        priceMultiplier: 1.18 + Math.random() * 0.07,
        severity: NewsSeverity.Alert,
      },
      {
        title: "Crisis regulatoria",
        description: `Nuevas regulaciones afectan a ${this.name}. Incertidumbre en los precios.`,
        priceMultiplier: 0.80 + Math.random() * 0.1,
        severity: NewsSeverity.Critical,
      },
      {
        title: "Inversión institucional",
        description: `Grandes fondos invierten masivamente en ${this.name}. Precios al alza.`,
        priceMultiplier: 1.20 + Math.random() * 0.05,
        severity: NewsSeverity.Alert,
      },
      {
        title: "Escándalo de sector",
        description: `Escándalo afecta la confianza en ${this.name}. Los inversores huyen.`,
        priceMultiplier: 0.78 + Math.random() * 0.08,
        severity: NewsSeverity.Critical,
      },
    ];

    const chosen = events[Math.floor(Math.random() * events.length)];
    const productIds = Array.from(this.products.keys());
    const numAffected = 1 + Math.floor(Math.random() * Math.min(3, productIds.length));
    const shuffled = productIds.sort(() => Math.random() - 0.5).slice(0, numAffected);

    // Apply shock
    for (const pid of shuffled) {
      const state = this.products.get(pid);
      if (!state) continue;
      const product = PRODUCTS[pid];
      if (!product) continue;
      const newPrice = Math.max(product.minPrice, Math.min(product.maxPrice, state.currentPrice * chosen.priceMultiplier));
      state.currentPrice = parseFloat(newPrice.toFixed(2));
      state.volatilityIndex = Math.min(1, state.volatilityIndex + 0.15);
    }

    const result: MarketEventResult = { ...chosen, affectedProducts: shuffled };
    this.activeEvents.push(result);
    return result;
  }

  applyExternalShock(productId: string, multiplier: number): void {
    const state = this.products.get(productId);
    if (!state) return;
    const product = PRODUCTS[productId];
    if (!product) return;
    const newPrice = Math.max(product.minPrice, Math.min(product.maxPrice, state.currentPrice * multiplier));
    state.currentPrice = parseFloat(newPrice.toFixed(2));
    state.volatilityIndex = Math.min(1, state.volatilityIndex + 0.2);
  }

  // ─── Price History ─────────────────────────────────────────

  getPriceHistory(productId: string, days: number): PricePoint[] {
    const history = this.priceHistory.get(productId) ?? [];
    return history.slice(-days);
  }

  // ─── Top Movers ────────────────────────────────────────────

  getTopMovers(n = 5): Array<{ productId: string; changePercent: number; currentPrice: number; trend: string }> {
    const movers = Array.from(this.products.values())
      .map(s => ({
        productId: s.productId,
        changePercent: s.changePercent,
        currentPrice: s.currentPrice,
        trend: s.trend,
      }))
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
    return movers.slice(0, n);
  }

  // ─── Getters ───────────────────────────────────────────────

  getProductState(productId: string): MarketProductState | undefined {
    return this.products.get(productId);
  }

  getAllProductStates(): MarketProductState[] {
    return Array.from(this.products.values());
  }

  getAverageVolatility(): number {
    const states = Array.from(this.products.values());
    if (states.length === 0) return 0;
    return states.reduce((s, p) => s + p.volatilityIndex, 0) / states.length;
  }

  // ─── Serialization ─────────────────────────────────────────

  toJSON(): object {
    return {
      id: this.id,
      name: this.name,
      category: this.category,
      currentDay: this.currentDay,
      products: Array.from(this.products.entries()),
      orderBook: this.orderBook,
      priceHistory: Array.from(this.priceHistory.entries()),
      activeEvents: this.activeEvents,
    };
  }

  static fromJSON(data: ReturnType<Market["toJSON"]> & Record<string, any>): Market {
    const market = new Market(data.id, data.name, data.category);
    market.currentDay = data.currentDay ?? 1;
    market.products = new Map(data.products ?? []);
    market.orderBook = data.orderBook ?? [];
    market.priceHistory = new Map(data.priceHistory ?? []);
    market.activeEvents = data.activeEvents ?? [];
    return market;
  }
}

// ─── Market Registry ──────────────────────────────────────────

export const MARKET_DEFINITIONS: Array<{ id: string; name: string; category: ProductCategory }> = [
  { id: "moda", name: "Mercado de Moda", category: ProductCategory.Moda },
  { id: "tecnologia", name: "Mercado Tecnológico", category: ProductCategory.Tecnologia },
  { id: "alimentacion", name: "Mercado Alimentario", category: ProductCategory.Alimentacion },
  { id: "finanzas", name: "Mercado Financiero", category: ProductCategory.Finanzas },
  { id: "energia", name: "Mercado Energético", category: ProductCategory.Energia },
  { id: "inmobiliario", name: "Mercado Inmobiliario", category: ProductCategory.Inmobiliario },
  { id: "entretenimiento", name: "Mercado de Entretenimiento", category: ProductCategory.Entretenimiento },
  { id: "materias_primas", name: "Mercado de Materias Primas", category: ProductCategory.MateriasPrimas },
];

export function createAllMarkets(): Map<string, Market> {
  const markets = new Map<string, Market>();
  for (const def of MARKET_DEFINITIONS) {
    markets.set(def.id, new Market(def.id, def.name, def.category));
  }
  return markets;
}
