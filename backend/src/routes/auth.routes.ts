import { Router, Request, Response, NextFunction } from "express";
import { authService } from "../services/AuthService.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { HttpError } from "../middleware/errorHandler.js";

const router = Router();

// Rate limits — keyed per IP per endpoint. Conservative by design: auth
// endpoints are the #1 target for credential stuffing / enumeration.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1h
  max: 10,
  message: "Too many registration attempts. Try again in an hour.",
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15m
  max: 20,
  message: "Too many login attempts. Try again in 15 minutes.",
});
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
});

// POST /api/v1/auth/register
router.post("/register", registerLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password, character_id } = req.body ?? {};
    if (!username || !email || !password) {
      throw new HttpError(400, "username, email, and password are required");
    }
    const result = await authService.register({ username, email, password, character_id });
    res.status(201).json(result);
  } catch (err: any) {
    // Validation-style errors thrown by AuthService (duplicate email, weak
    // password, etc.) are user-facing. Everything else becomes a generic 400.
    const msg = typeof err?.message === "string" ? err.message : "Registration failed";
    next(new HttpError(400, msg, true));
  }
});

// POST /api/v1/auth/login
router.post("/login", loginLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      throw new HttpError(400, "email and password are required");
    }
    const result = await authService.login({ email, password });
    res.json(result);
  } catch (err: any) {
    // NEVER leak whether the email exists — always return the same generic
    // message for invalid credentials.
    const msg = /credentials|password|email/i.test(err?.message ?? "")
      ? "Invalid email or password"
      : "Login failed";
    next(new HttpError(401, msg, true));
  }
});

// POST /api/v1/auth/refresh
router.post("/refresh", refreshLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refresh_token } = req.body ?? {};
    if (!refresh_token) throw new HttpError(400, "refresh_token required");
    const tokens = await authService.refreshTokens(refresh_token);
    res.json(tokens);
  } catch (err: any) {
    next(new HttpError(401, "Invalid or expired refresh token", true));
  }
});

// POST /api/v1/auth/logout
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body ?? {};
    if (refresh_token) await authService.logout(refresh_token);
  } catch {
    // always 200 on logout — don't leak whether token was valid
  }
  res.json({ ok: true });
});

// GET /api/v1/auth/me
router.get("/me", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getMe(req.user!.userId);
    if (!user) throw new HttpError(404, "User not found");
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
