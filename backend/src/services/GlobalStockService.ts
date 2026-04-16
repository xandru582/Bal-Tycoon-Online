import { db } from "../config/database.js";
import { redis } from "../config/redis.js";
import { StockMarket } from "../core/economy/Stocks.js";

const TRADE_FEE = 0.005; // 0.5% comisión

export interface TradeResult {
  success: boolean;
  price?: number;
  cost?: number;
  proceeds?: number;
  error?: string;
}

class GlobalStockService {
  // Instancia ÚNICA del mercado compartida entre todos los jugadores
  private globalMarket: StockMarket = new StockMarket();
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    // Intentar restaurar precios del día más reciente guardado
    try {
      const result = await db.query(
        `SELECT ticker, price FROM global_stock_prices
         WHERE game_day = (SELECT MAX(game_day) FROM global_stock_prices)
         ORDER BY ticker`
      );
      if (result.rows.length > 0) {
        for (const row of result.rows) {
          this.globalMarket.setPrice?.(row.ticker, parseFloat(row.price));
        }
      }
    } catch {
      // Primera vez — market arranca con precios por defecto
    }
    console.log("📈 GlobalStockService initialized");
  }

  getMarket(): StockMarket {
    return this.globalMarket;
  }

  getListings() {
    return this.globalMarket.getListings?.() ?? [];
  }

  getPriceMap(): Record<string, number> {
    const listings = this.getListings();
    const map: Record<string, number> = {};
    for (const l of listings) map[l.ticker] = l.price;
    return map;
  }

  async executeTrade(
    userId: string,
    username: string,
    action: "buy" | "sell",
    ticker: string,
    shares: number,
    gameDay: number,
    io?: any
  ): Promise<TradeResult> {
    const listing = this.globalMarket.getListing?.(ticker);
    if (!listing) return { success: false, error: "Ticker not found" };
    if (shares <= 0) return { success: false, error: "Invalid share count" };

    const price = listing.price;
    const tradeValue = shares * price;
    const marketCap = listing.marketCap ?? price * 1_000_000;

    // Impacto en precio: 0.1% por cada 1% del market cap negociado
    const impactFraction = (tradeValue / marketCap) * 0.001;

    if (action === "buy") {
      listing.price = price * (1 + impactFraction);
    } else {
      listing.price = price * (1 - impactFraction);
    }

    // Precio no puede caer a 0
    listing.price = Math.max(listing.price, 0.01);

    const isPublic = tradeValue > marketCap * 0.01; // trades > 1% market cap son públicos

    // Persistir historial
    try {
      await db.query(
        `INSERT INTO stock_transactions_log
           (user_id, username, ticker, action, shares, price_per_share, total_value, market_impact, is_public, game_day)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [userId, username, ticker, action, shares, price, tradeValue, impactFraction, isPublic, gameDay]
      );

      // Actualizar precio en tabla global
      await db.query(
        `INSERT INTO global_stock_prices (ticker, game_day, price, player_buy_volume, player_sell_volume)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (ticker, game_day) DO UPDATE SET
           price = EXCLUDED.price,
           player_buy_volume = global_stock_prices.player_buy_volume + $4,
           player_sell_volume = global_stock_prices.player_sell_volume + $5`,
        [
          ticker, gameDay, listing.price,
          action === "buy" ? tradeValue : 0,
          action === "sell" ? tradeValue : 0,
        ]
      );
    } catch (err) {
      console.error("Stock DB error:", err);
    }

    // Cache de precio en Redis para leaderboard/stats rápidas
    await redis.hset("stock:prices", { [ticker]: listing.price.toFixed(4) });

    // Broadcast a todos los clientes conectados
    if (io) {
      io.emit("stock:price_update", { [ticker]: listing.price });
      if (isPublic) {
        io.emit("stock:big_trade", {
          username,
          ticker,
          action,
          shares,
          total: tradeValue,
        });
      }
    }

    if (action === "buy") {
      const cost = tradeValue * (1 + TRADE_FEE);
      return { success: true, price, cost };
    } else {
      const proceeds = tradeValue * (1 - TRADE_FEE);
      return { success: true, price, proceeds };
    }
  }

  // Avanza el mercado un día de juego (llamado desde globalGameLoop)
  advanceDay(gameDay: number): void {
    this.globalMarket.update?.(gameDay, undefined as any);
  }
}

export const globalStockService = new GlobalStockService();
