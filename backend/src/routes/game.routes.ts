import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { gameService } from "../services/GameService.js";

const router = Router();

// GET /api/v1/game/state
router.get("/state", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, username } = req.user!;
    const session = await gameService.loadSession(userId, username);
    res.json(gameService.getClientState(session));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/game/action
router.post("/action", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, username } = req.user!;
    const { type, payload } = req.body;
    if (!type) return res.status(400).json({ error: "type is required" });

    const session = await gameService.loadSession(userId, username);
    const result = await gameService.processAction(session, type, payload ?? {});
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/game/prestige
router.post("/prestige", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, username } = req.user!;
    const { confirm } = req.body;
    if (!confirm) return res.status(400).json({ error: "confirm: true is required" });

    const session = await gameService.loadSession(userId, username);
    const result = await gameService.prestige(session);

    if (!result.success) return res.status(400).json(result);
    res.json({ ...result, state: gameService.getClientState(session) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/game/save  (manual save trigger)
router.post("/save", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!;
    const session = gameService.getSession(userId);
    if (!session) return res.status(404).json({ error: "No active session" });
    await gameService.saveSession(session);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
