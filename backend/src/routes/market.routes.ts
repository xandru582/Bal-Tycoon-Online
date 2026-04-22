import { Router, Request, Response, NextFunction } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { globalStockService } from "../services/GlobalStockService.js";
import { gameService } from "../services/GameService.js";
import { db } from "../config/database.js";
import { getIO } from "../ioInstance.js";
import { HttpError } from "../middleware/errorHandler.js";

const router = Router();

/** Validate a trade ticker (4-char alphanumeric-ish). */
function validTicker(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim().toUpperCase();
  return /^[A-Z0-9]{1,6}$/.test(t) ? t : null;
}

/** Accept only finite, positive integer shares ≤ 1e9. Rejects NaN, negatives,
 *  decimals and absurd values that would overflow NUMERIC columns. */
function parseShares(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  if (!Number.isInteger(n)) return null;
  if (n <= 0 || n > 1_000_000_000) return null;
  return n;
}

// GET /api/v1/market/stocks
router.get("/stocks", optionalAuth, (_req: Request, res: Response) => {
  const listings = globalStockService.getListings();
  res.json(listings);
});

// POST /api/v1/market/stocks/buy
router.post("/stocks/buy", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, username } = req.user!;
    const ticker = validTicker(req.body?.ticker);
    const shares = parseShares(req.body?.shares);
    if (!ticker) throw new HttpError(400, "Invalid ticker");
    if (shares === null) throw new HttpError(400, "shares must be a positive integer");

    const session = await gameService.loadSession(userId, username);
    const result = await globalStockService.executeTrade(
      userId, username, "buy", ticker, shares, session.currentDay, getIO()
    );

    if (!result.success) return res.status(400).json(result);

    // Deduct credits from session
    if (session.credits < (result.cost ?? 0)) {
      throw new HttpError(400, "Insufficient credits");
    }

    session.credits -= result.cost!;
    // Compras no cuentan como ganancia
    session.totalCreditsEarned -= result.cost!;
    session.stockMarket.addToPortfolio?.(ticker, shares, result.price!);

    res.json({ ...result, credits: session.credits });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/market/stocks/sell
router.post("/stocks/sell", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, username } = req.user!;
    const ticker = validTicker(req.body?.ticker);
    const shares = parseShares(req.body?.shares);
    if (!ticker) throw new HttpError(400, "Invalid ticker");
    if (shares === null) throw new HttpError(400, "shares must be a positive integer");

    const session = await gameService.loadSession(userId, username);

    const playerShares = session.stockMarket.getPortfolioShares?.(ticker) ?? 0;
    if (playerShares < shares) throw new HttpError(400, "Not enough shares");

    const result = await globalStockService.executeTrade(
      userId, username, "sell", ticker, shares, session.currentDay, getIO()
    );
    if (!result.success) return res.status(400).json(result);

    session.credits += result.proceeds! * session.prestigeBonus;
    session.totalCreditsEarned += result.proceeds!;
    session.stockMarket.removeFromPortfolio?.(ticker, shares);

    res.json({ ...result, credits: session.credits });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/market/stocks/:ticker/trades  — grandes transacciones públicas
router.get("/stocks/:ticker/trades", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticker = validTicker(req.params["ticker"]);
    if (!ticker) throw new HttpError(400, "Invalid ticker");

    const result = await db.query(
      `SELECT username, action, shares, price_per_share, total_value, created_at
       FROM stock_transactions_log
       WHERE ticker = $1 AND is_public = TRUE
       ORDER BY created_at DESC LIMIT 50`,
      [ticker]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

export default router;
