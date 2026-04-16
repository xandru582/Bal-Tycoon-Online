import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { buildingService } from "../services/BuildingService.js";
import { gameService } from "../services/GameService.js";

const router = Router();

// GET /api/v1/buildings — all buildings (public)
router.get("/", async (_req: Request, res: Response) => {
  try {
    res.json(await buildingService.getBuildings());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/buildings/my — owned buildings
router.get("/my", requireAuth, async (req: Request, res: Response) => {
  try {
    res.json(await buildingService.getMyBuildings(req.user!.userId));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/buildings/:id/buy — buy a free (system-owned) building
router.post("/:id/buy", requireAuth, async (req: Request, res: Response) => {
  try {
    const session = gameService.getSession(req.user!.userId);
    if (!session) return res.status(400).json({ error: "Sesión no encontrada. Recarga la página." });

    const result = await buildingService.buyBuilding(
      req.params['id'] as string,
      req.user!.userId,
      session.username,
      session.credits
    );
    if (!result.success) return res.status(400).json({ error: result.error });

    session.credits -= result.cost!;
    await gameService.recalculateSessionCps(session);
    await gameService.saveSession(session);

    res.json({ success: true, credits: session.credits, creditsPerSecond: session.creditsPerSecond, cost: result.cost, cpsGained: result.cpsGained });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/buildings/:id/buy-from-player — buy a player-listed building
router.post("/:id/buy-from-player", requireAuth, async (req: Request, res: Response) => {
  try {
    const buyerSession = gameService.getSession(req.user!.userId);
    if (!buyerSession) return res.status(400).json({ error: "Sesión no encontrada. Recarga la página." });

    const result = await buildingService.buyFromPlayer(
      req.params['id'] as string,
      req.user!.userId,
      buyerSession.credits
    );
    if (!result.success) return res.status(400).json({ error: result.error });

    // Deduct from buyer
    buyerSession.credits -= result.cost!;
    await gameService.recalculateSessionCps(buyerSession);
    await gameService.saveSession(buyerSession);

    // Credit the seller's session if they're online, otherwise update DB directly
    const sellerSession = gameService.getSession(result.sellerId!);
    if (sellerSession) {
      sellerSession.credits += result.sellerPayout!;
      sellerSession.totalCreditsEarned += result.sellerPayout!;
      await gameService.recalculateSessionCps(sellerSession);
      await gameService.saveSession(sellerSession);
    } else {
      // Seller is offline — update their DB record directly
      const { db } = await import("../config/database.js");
      await db.query(
        `UPDATE game_states SET credits = credits + $1, total_earned = total_earned + $1 WHERE user_id = $2`,
        [result.sellerPayout!, result.sellerId!]
      );
    }

    res.json({ success: true, credits: buyerSession.credits, creditsPerSecond: buyerSession.creditsPerSecond, cost: result.cost, cpsGained: result.cpsGained });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/buildings/:id/upgrade
router.post("/:id/upgrade", requireAuth, async (req: Request, res: Response) => {
  try {
    const session = gameService.getSession(req.user!.userId);
    if (!session) return res.status(400).json({ error: "Sesión no encontrada. Recarga la página." });

    const result = await buildingService.upgradeBuilding(req.params['id'] as string, req.user!.userId, session.credits);
    if (!result.success) return res.status(400).json({ error: result.error });

    session.credits -= result.cost!;
    await gameService.recalculateSessionCps(session);
    await gameService.saveSession(session);

    res.json({ success: true, credits: session.credits, creditsPerSecond: session.creditsPerSecond, cost: result.cost, newLevel: result.newLevel, cpsGained: result.cpsGained });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/buildings/:id/list-for-sale — put building on player market
router.post("/:id/list-for-sale", requireAuth, async (req: Request, res: Response) => {
  try {
    const { price } = req.body;
    if (!price || isNaN(Number(price))) return res.status(400).json({ error: "Precio inválido" });

    const result = await buildingService.listForSale(req.params['id'] as string, req.user!.userId, Number(price));
    if (!result.success) return res.status(400).json({ error: result.error });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/buildings/:id/delist — remove from player market
router.post("/:id/delist", requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await buildingService.delist(req.params['id'] as string, req.user!.userId);
    if (!result.success) return res.status(400).json({ error: result.error });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/v1/buildings/:id/customize
router.put("/:id/customize", requireAuth, async (req: Request, res: Response) => {
  try {
    const { display_text, display_image_url } = req.body;
    const result = await buildingService.customizeBuilding(req.params['id'] as string, req.user!.userId, display_text, display_image_url);
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
