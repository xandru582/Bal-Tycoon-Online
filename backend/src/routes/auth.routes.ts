import { Router, Request, Response } from "express";
import { authService } from "../services/AuthService.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// POST /api/v1/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, email, password, character_id } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "username, email, and password are required" });
    }
    const result = await authService.register({ username, email, password, character_id });
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/v1/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }
    const result = await authService.login({ email, password });
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

// POST /api/v1/auth/refresh
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ error: "refresh_token required" });
    const tokens = await authService.refreshTokens(refresh_token);
    res.json(tokens);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

// POST /api/v1/auth/logout
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;
    if (refresh_token) await authService.logout(refresh_token);
    res.json({ ok: true });
  } catch {
    res.json({ ok: true }); // siempre 200 en logout
  }
});

// GET /api/v1/auth/me
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await authService.getMe(req.user!.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
