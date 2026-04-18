// ============================================================
// /api/v1/underworld — REST endpoints for the Underworld module.
// All gameplay actions are server-authoritative.
// ============================================================

import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { underworldService } from "../services/UnderworldService.js";
import { CRIMES, ITEMS } from "../core/underworld/data.js";

const router = Router();

// GET /state — full client-safe state
router.get("/state", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!;
    const state = await underworldService.getClientState(userId);
    res.json(state);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /catalog — static data (crimes + items) so the client doesn't ship duplicates
router.get("/catalog", (_req: Request, res: Response) => {
  res.json({ crimes: CRIMES, items: ITEMS });
});

// POST /crime  { crimeId }
router.post("/crime", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!;
    const { crimeId } = req.body ?? {};
    if (typeof crimeId !== "string") {
      res.status(400).json({ error: "crimeId is required" });
      return;
    }
    const { state, result } = await underworldService.commitCrime(userId, crimeId);
    res.json({ state, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /train  { stat, energy }
router.post("/train", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!;
    const { stat, energy } = req.body ?? {};
    if (!["strength", "defense", "speed", "dexterity"].includes(stat)) {
      res.status(400).json({ error: "Invalid stat" });
      return;
    }
    const energyNum = Number(energy);
    if (!Number.isFinite(energyNum) || energyNum <= 0) {
      res.status(400).json({ error: "energy must be a positive number" });
      return;
    }
    const { state, result } = await underworldService.trainStat(userId, stat, energyNum);
    res.json({ state, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /item/use  { itemId }
router.post("/item/use", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!;
    const { itemId } = req.body ?? {};
    if (typeof itemId !== "string") {
      res.status(400).json({ error: "itemId is required" });
      return;
    }
    const { state, result } = await underworldService.useItem(userId, itemId);
    res.json({ state, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /item/sell  { itemId }
router.post("/item/sell", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!;
    const { itemId } = req.body ?? {};
    if (typeof itemId !== "string") {
      res.status(400).json({ error: "itemId is required" });
      return;
    }
    const { state, result } = await underworldService.sellItem(userId, itemId);
    res.json({ state, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
