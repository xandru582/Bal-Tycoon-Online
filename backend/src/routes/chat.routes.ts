import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { chatService } from "../services/ChatService.js";

const router = Router();

// GET /api/v1/chat/global
router.get("/global", requireAuth, async (req: Request, res: Response) => {
  const before = req.query.before ? parseInt(req.query.before as string) : undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  res.json(await chatService.getHistory("global", "global", before, limit));
});

// GET /api/v1/chat/clan/:clan_id
router.get("/clan/:clan_id", requireAuth, async (req: Request, res: Response) => {
  const before = req.query.before ? parseInt(req.query.before as string) : undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  res.json(await chatService.getHistory("clan", req.params["clan_id"] as string, before, limit));
});

// GET /api/v1/chat/dm/:user_id
router.get("/dm/:user_id", requireAuth, async (req: Request, res: Response) => {
  const roomId = chatService.dmRoomId(req.user!.userId, req.params["user_id"] as string);
  const before = req.query.before ? parseInt(req.query.before as string) : undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  res.json(await chatService.getHistory("dm", roomId, before, limit));
});

// DELETE /api/v1/chat/messages/:id  (soft delete own message)
router.delete("/messages/:id", requireAuth, async (req: Request, res: Response) => {
  const ok = await chatService.deleteMessage(parseInt(req.params["id"] as string), req.user!.userId);
  if (!ok) return res.status(404).json({ error: "Message not found" });
  res.json({ ok: true });
});

export default router;
