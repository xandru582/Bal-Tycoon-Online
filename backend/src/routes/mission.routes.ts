import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { missionService } from "../services/MissionService.js";
import { loginStreakService } from "../services/LoginStreakService.js";

const router = Router();

// GET /api/v1/missions
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    res.json(await missionService.getMissions(req.user!.userId));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/missions/:id/claim
router.post("/:id/claim", requireAuth, async (req: Request, res: Response) => {
  try {
    const reward = await missionService.claimReward(req.params["id"] as string, req.user!.userId);
    res.json(reward);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/v1/missions/streak  (login streak)
router.get("/streak", requireAuth, async (req: Request, res: Response) => {
  try {
    res.json(await loginStreakService.getStreak(req.user!.userId));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/missions/streak/claim
router.post("/streak/claim", requireAuth, async (req: Request, res: Response) => {
  try {
    const reward = await loginStreakService.claimStreak(req.user!.userId);
    res.json(reward);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
