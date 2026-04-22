import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { chatService } from "../services/ChatService.js";

const router = Router();

/** Parse a numeric query param, returning `undefined` on NaN/empty instead
 *  of silently sending NaN to the database. */
function parseIntParam(raw: unknown): number | undefined {
  if (typeof raw !== "string" || raw.length === 0) return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : undefined;
}

/** Clamp a "limit" query param to a reasonable range. */
function parseLimit(raw: unknown, fallback = 50, max = 100): number {
  const n = parseIntParam(raw);
  if (n === undefined || n <= 0) return fallback;
  return Math.min(n, max);
}

// GET /api/v1/chat/global
router.get("/global", requireAuth, async (req: Request, res: Response) => {
  const before = parseIntParam(req.query["before"]);
  const limit = parseLimit(req.query["limit"]);
  res.json(await chatService.getHistory("global", "global", before, limit));
});

// GET /api/v1/chat/clan/:clan_id
router.get("/clan/:clan_id", requireAuth, async (req: Request, res: Response) => {
  const before = parseIntParam(req.query["before"]);
  const limit = parseLimit(req.query["limit"]);
  res.json(await chatService.getHistory("clan", req.params["clan_id"] as string, before, limit));
});

// GET /api/v1/chat/dm/:user_id
router.get("/dm/:user_id", requireAuth, async (req: Request, res: Response) => {
  const roomId = chatService.dmRoomId(req.user!.userId, req.params["user_id"] as string);
  const before = parseIntParam(req.query["before"]);
  const limit = parseLimit(req.query["limit"]);
  res.json(await chatService.getHistory("dm", roomId, before, limit));
});

// DELETE /api/v1/chat/messages/:id  (soft delete own message)
router.delete("/messages/:id", requireAuth, async (req: Request, res: Response) => {
  const id = parseIntParam(req.params["id"]);
  if (id === undefined) return res.status(400).json({ error: "Invalid message id" });
  const ok = await chatService.deleteMessage(id, req.user!.userId);
  if (!ok) return res.status(404).json({ error: "Message not found" });
  res.json({ ok: true });
});

export default router;
