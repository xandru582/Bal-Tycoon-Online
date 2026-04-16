import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db } from "../config/database.js";
import { env } from "../config/env.js";
import type { AuthPayload } from "../middleware/auth.js";

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  character_id?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export class AuthService {
  private signAccess(payload: AuthPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES as any });
  }

  private signRefresh(userId: string): string {
    return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES as any });
  }

  async register(input: RegisterInput): Promise<AuthTokens & { user: any }> {
    // Validaciones
    if (input.username.length < 3 || input.username.length > 32) {
      throw new Error("Username must be 3-32 characters");
    }
    if (!/^[a-zA-Z0-9_]+$/.test(input.username)) {
      throw new Error("Username can only contain letters, numbers, and underscores");
    }
    if (input.password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    const hash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

    let user: any;
    try {
      const result = await db.query(
        `INSERT INTO users (username, email, password_hash, character_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, username, email, character_id, created_at`,
        [input.username.trim(), input.email.toLowerCase().trim(), hash, input.character_id ?? null]
      );
      user = result.rows[0];
    } catch (err: any) {
      if (err.constraint === "users_username_key") throw new Error("Username already taken");
      if (err.constraint === "users_email_key") throw new Error("Email already registered");
      throw err;
    }

    // Crear estado de juego inicial
    await db.query(
      `INSERT INTO game_states (user_id, state_data, credits, total_earned, net_worth, company_name)
       VALUES ($1, $2, 500, 500, 500, $3)`,
      [user.id, JSON.stringify({}), `${user.username} Corp`]
    );

    const tokens = await this.createTokens(user);
    return { ...tokens, user };
  }

  async login(input: LoginInput): Promise<AuthTokens & { user: any }> {
    const result = await db.query(
      `SELECT id, username, email, password_hash, character_id, is_banned
       FROM users WHERE email = $1`,
      [input.email.toLowerCase().trim()]
    );

    const user = result.rows[0];
    if (!user) throw new Error("Invalid email or password");
    if (user.is_banned) throw new Error("Account suspended");

    const valid = await bcrypt.compare(input.password, user.password_hash);
    if (!valid) throw new Error("Invalid email or password");

    await db.query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [user.id]);
    delete user.password_hash;

    const tokens = await this.createTokens(user);
    return { ...tokens, user };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    let payload: any;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      throw new Error("Invalid refresh token");
    }

    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const result = await db.query(
      `SELECT rt.*, u.username FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1 AND rt.expires_at > NOW() AND rt.user_id = $2`,
      [tokenHash, payload.userId]
    );

    if (!result.rows[0]) throw new Error("Refresh token not found or expired");

    // Rotate: delete old, create new
    await db.query("DELETE FROM refresh_tokens WHERE token_hash = $1", [tokenHash]);

    const user = result.rows[0];
    return this.createTokens({ id: user.user_id, username: user.username });
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    await db.query("DELETE FROM refresh_tokens WHERE token_hash = $1", [tokenHash]);
  }

  async getMe(userId: string): Promise<any> {
    const result = await db.query(
      `SELECT u.id, u.username, u.email, u.character_id, u.created_at,
              gs.credits, gs.net_worth, gs.current_day, gs.prestige_level,
              cm.clan_id,
              c.name as clan_name, c.tag as clan_tag, c.color as clan_color
       FROM users u
       LEFT JOIN game_states gs ON gs.user_id = u.id
       LEFT JOIN clan_members cm ON cm.user_id = u.id
       LEFT JOIN clans c ON c.id = cm.clan_id
       WHERE u.id = $1`,
      [userId]
    );
    return result.rows[0] ?? null;
  }

  private async createTokens(user: { id: string; username: string }): Promise<AuthTokens> {
    const access_token = this.signAccess({ userId: user.id, username: user.username });
    const refresh_token = this.signRefresh(user.id);
    const tokenHash = crypto.createHash("sha256").update(refresh_token).digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000); // 30d

    await db.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    return { access_token, refresh_token };
  }
}

export const authService = new AuthService();
