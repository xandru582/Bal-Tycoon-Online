import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { clanService } from "../services/ClanService.js";

const router = Router();

// GET /api/v1/clans
router.get("/", async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  res.json(await clanService.list(page));
});

// GET /api/v1/clans/ranking
router.get("/ranking", async (_req: Request, res: Response) => {
  res.json(await clanService.getRanking());
});

// GET /api/v1/clans/my
router.get("/my", requireAuth, async (req: Request, res: Response) => {
  const clan = await clanService.getUserClan(req.user!.userId);
  res.json(clan ?? null);
});

// POST /api/v1/clans
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, tag, description, color, emblem_url } = req.body;
    if (!name || !tag) return res.status(400).json({ error: "name and tag required" });
    const clan = await clanService.create({
      name, tag, description, color, emblem_url,
      leaderId: req.user!.userId,
    });
    res.status(201).json(clan);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/v1/clans/:id
router.get("/:id", async (req: Request, res: Response) => {
  const clan = await clanService.get(req.params["id"] as string);
  if (!clan) return res.status(404).json({ error: "Clan not found" });
  res.json(clan);
});

// POST /api/v1/clans/:id/join
router.post("/:id/join", requireAuth, async (req: Request, res: Response) => {
  try {
    await clanService.join(req.params["id"] as string, req.user!.userId);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/v1/clans/:id/leave
router.post("/:id/leave", requireAuth, async (req: Request, res: Response) => {
  try {
    await clanService.leave(req.params["id"] as string, req.user!.userId);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/v1/clans/:id/contribute
router.post("/:id/contribute", requireAuth, async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: "amount required" });
    const result = await clanService.contribute(req.params["id"] as string, req.user!.userId, parseFloat(amount));
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/v1/clans/:id/kick
router.post("/:id/kick", requireAuth, async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: "user_id required" });
    await clanService.kick(req.params["id"] as string, req.user!.userId, user_id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

export default router;
