import { Router, Request, Response } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { db } from "../config/database.js";

const router = Router();

// GET /api/v1/leaderboard/wealth
router.get("/wealth", async (_req: Request, res: Response) => {
  const result = await db.query(
    `SELECT ls.rank, ls.entity_id as user_id, ls.entity_name as username,
            ls.value as net_worth, ls.clan_tag
     FROM leaderboard_snapshots ls
     WHERE ls.snapshot_type = 'wealth'
     ORDER BY ls.rank LIMIT 100`
  );
  res.json(result.rows);
});

// GET /api/v1/leaderboard/influence
router.get("/influence", async (_req: Request, res: Response) => {
  const result = await db.query(
    `SELECT ls.rank, ls.entity_id as user_id, ls.entity_name as username,
            ls.value as influence, ls.clan_tag
     FROM leaderboard_snapshots ls
     WHERE ls.snapshot_type = 'influence'
     ORDER BY ls.rank LIMIT 100`
  );
  res.json(result.rows);
});

// GET /api/v1/leaderboard/clans
router.get("/clans", async (_req: Request, res: Response) => {
  const result = await db.query(
    `SELECT ls.rank, ls.entity_id as clan_id, ls.entity_name as clan_name,
            ls.value as total_wealth, ls.clan_tag
     FROM leaderboard_snapshots ls
     WHERE ls.snapshot_type = 'clan_wealth'
     ORDER BY ls.rank LIMIT 100`
  );
  res.json(result.rows);
});

// GET /api/v1/leaderboard/search?q=name  — búsqueda de jugadores
router.get("/search", async (req: Request, res: Response) => {
  const q = ((req.query.q as string) ?? "").trim();
  if (!q || q.length < 2) return res.status(400).json({ error: "query must be ≥2 chars" });
  try {
    const result = await db.query(
      `SELECT u.id, u.username, u.character_id,
              gs.net_worth, gs.influence, gs.prestige_level, gs.current_day,
              c.name AS clan_name, c.tag AS clan_tag, c.color AS clan_color
       FROM users u
       LEFT JOIN game_states gs ON gs.user_id = u.id
       LEFT JOIN clan_members cm ON cm.user_id = u.id
       LEFT JOIN clans c ON c.id = cm.clan_id
       WHERE u.username ILIKE $1 AND u.is_banned = FALSE
       ORDER BY gs.net_worth DESC NULLS LAST
       LIMIT 20`,
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/leaderboard/me  — posición del jugador actual
router.get("/me", requireAuth, optionalAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const [wealth, influence] = await Promise.all([
    db.query(
      `SELECT rank FROM leaderboard_snapshots WHERE snapshot_type = 'wealth' AND entity_id = $1`,
      [userId]
    ),
    db.query(
      `SELECT rank FROM leaderboard_snapshots WHERE snapshot_type = 'influence' AND entity_id = $1`,
      [userId]
    ),
  ]);
  res.json({
    wealthRank:    wealth.rows[0]?.rank ?? null,
    influenceRank: influence.rows[0]?.rank ?? null,
  });
});

export default router;
