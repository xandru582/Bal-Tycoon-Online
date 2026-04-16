import { Router, Request, Response } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { globalStockService } from "../services/GlobalStockService.js";
import { gameService } from "../services/GameService.js";
import { db } from "../config/database.js";
import { getIO } from "../ioInstance.js";

const router = Router();

// GET /api/v1/market/stocks
router.get("/stocks", optionalAuth, (_req: Request, res: Response) => {
  const listings = globalStockService.getListings();
  res.json(listings);
});

// POST /api/v1/market/stocks/buy
router.post("/stocks/buy", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, username } = req.user!;
    const { ticker, shares } = req.body;
    if (!ticker || !shares || shares <= 0)
      return res.status(400).json({ error: "ticker and shares > 0 required" });

    const session = await gameService.loadSession(userId, username);
    const result = await globalStockService.executeTrade(
      userId, username, "buy", ticker, parseInt(shares), session.currentDay, getIO()
    );

    if (!result.success) return res.status(400).json(result);

    // Deduct credits from session
    if (session.credits < (result.cost ?? 0))
      return res.status(400).json({ error: "Insufficient credits" });

    session.credits -= result.cost!;
    session.totalCreditsEarned -= result.cost!; // no contamos compras como ganancias

    // Track in player portfolio (stored in stock market of their engine)
    session.stockMarket.addToPortfolio?.(ticker, parseInt(shares), result.price!);

    return res.json({ ...result, credits: session.credits });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/market/stocks/sell
router.post("/stocks/sell", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, username } = req.user!;
    const { ticker, shares } = req.body;
    if (!ticker || !shares || shares <= 0)
      return res.status(400).json({ error: "ticker and shares > 0 required" });

    const session = await gameService.loadSession(userId, username);

    // Check player has shares
    const playerShares = session.stockMarket.getPortfolioShares?.(ticker) ?? 0;
    if (playerShares < parseInt(shares))
      return res.status(400).json({ error: "Not enough shares" });

    const result = await globalStockService.executeTrade(
      userId, username, "sell", ticker, parseInt(shares), session.currentDay, getIO()
    );

    if (!result.success) return res.status(400).json(result);

    session.credits += result.proceeds! * session.prestigeBonus;
    session.totalCreditsEarned += result.proceeds!;
    session.stockMarket.removeFromPortfolio?.(ticker, parseInt(shares));

    return res.json({ ...result, credits: session.credits });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/market/stocks/:ticker/trades  — grandes transacciones públicas
router.get("/stocks/:ticker/trades", async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT username, action, shares, price_per_share, total_value, created_at
       FROM stock_transactions_log
       WHERE ticker = $1 AND is_public = TRUE
       ORDER BY created_at DESC LIMIT 50`,
      [req.params["ticker"] as string]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
