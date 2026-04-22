import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { connectDB } from "./config/database.js";
import { connectRedis } from "./config/redis.js";
import { setupSocketServer } from "./websocket/socketServer.js";
import { startGlobalGameLoop } from "./jobs/globalGameLoop.js";
import { startAuctionCron } from "./jobs/auctionCron.js";
import { setIO } from "./ioInstance.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import gameRoutes from "./routes/game.routes.js";
import marketRoutes from "./routes/market.routes.js";
import clanRoutes from "./routes/clan.routes.js";
import buildingRoutes from "./routes/building.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import missionRoutes from "./routes/mission.routes.js";
import leaderboardRoutes from "./routes/leaderboard.routes.js";
import underworldRoutes from "./routes/underworld.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
// Trust the first proxy (nginx) so req.ip reflects the real client.
// Without this, rate limiting buckets everyone under the proxy's IP.
app.set("trust proxy", 1);
const httpServer = createServer(app);

// ── Socket.io ──────────────────────────────────────────────────────
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.NODE_ENV === "production" ? false : ["http://localhost:5173"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// ── Middlewares ────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: env.NODE_ENV === "production" ? false : "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));

// ── Health check ───────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ── API Routes ─────────────────────────────────────────────────────
app.use("/api/v1/auth",        authRoutes);
app.use("/api/v1/game",        gameRoutes);
app.use("/api/v1/market",      marketRoutes);
app.use("/api/v1/clans",       clanRoutes);
app.use("/api/v1/buildings",   buildingRoutes);
app.use("/api/v1/chat",        chatRoutes);
app.use("/api/v1/missions",    missionRoutes);
app.use("/api/v1/leaderboard", leaderboardRoutes);
app.use("/api/v1/underworld", underworldRoutes);

// ── 404 fallback ───────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// ── Central error handler (must be last so all thrown errors funnel here) ──
app.use(errorHandler);

// ── Startup ────────────────────────────────────────────────────────
async function migrate() {
  const { db } = await import("./config/database.js");
  // Add buildings columns if missing
  await db.query(`
    ALTER TABLE buildings ADD COLUMN IF NOT EXISTS level SMALLINT NOT NULL DEFAULT 1;
    ALTER TABLE buildings ADD COLUMN IF NOT EXISTS cps_base NUMERIC(16,4) NOT NULL DEFAULT 0;
    ALTER TABLE buildings ADD COLUMN IF NOT EXISTS for_sale BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE buildings ADD COLUMN IF NOT EXISTS sale_price NUMERIC(20,4);
  `);
  // Underworld module (Torn-style crimes / gym / inventory) — server-authoritative
  await db.query(`
    CREATE TABLE IF NOT EXISTS underworld_states (
      user_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      nerve             SMALLINT NOT NULL DEFAULT 100,
      nerve_updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      energy            SMALLINT NOT NULL DEFAULT 100,
      energy_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      xp                INTEGER NOT NULL DEFAULT 0,
      stats             JSONB NOT NULL DEFAULT '{"strength":1,"defense":1,"speed":1,"dexterity":1}',
      temp_buffs        JSONB NOT NULL DEFAULT '[]',
      jail_until        TIMESTAMPTZ,
      inventory         JSONB NOT NULL DEFAULT '{}',
      crimes_committed  INTEGER NOT NULL DEFAULT 0,
      crimes_failed     INTEGER NOT NULL DEFAULT 0,
      total_loot        NUMERIC(24,4) NOT NULL DEFAULT 0,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_underworld_jail ON underworld_states(jail_until) WHERE jail_until IS NOT NULL;
  `);
  // Seed cps_base values for all buildings (only if still 0)
  const updates: [string, number, number][] = [
    ['Parque Tecnológico',   1000,       1],
    ['Hotel Nexion',         2000,       2],
    ['Centro Médico',        3500,       3.5],
    ['Fábrica Alpha',        5000,       5],
    ['Fábrica Beta',         8000,       8],
    ['Plaza Comercial',      15000,      15],
    ['Destilería de Datos',  30000,      30],
    ['Megaserver Alpha',     55000,      55],
    ['Centro de Datos',      90000,      90],
    ['Exchange Global',      120000,     120],
    ['Casino Digital',       200000,     200],
    ['Banco Central',        400000,     400],
    ['Laboratorio IA',       700000,     700],
    ['Torre Vigilancia',     1200000,    1200],
    ['Aeropuerto',           2000000,    2000],
    ['Puerto Cibernético',   3500000,    3500],
    ['Arena de Guerras',     6000000,    6000],
    ['Estadio Virtual',      10000000,   10000],
    ['Museo Cuántico',       18000000,   18000],
    ['Rascacielos Sigma',    30000000,   30000],
    ['Rascacielos Omega',    50000000,   50000],
    ['Bóveda Cripto',        80000000,   80000],
    ['Torre NEXUS',          150000000,  150000],
    ['Cuartel General',      300000000,  300000],
    ['Bunker Secreto',       500000000,  500000],
  ];
  for (const [name, price, cps] of updates) {
    await db.query(
      `UPDATE buildings SET base_price = $1, cps_base = $2, owner_id = NULL, level = 1
       WHERE name = $3 AND cps_base = 0`,
      [price, cps, name]
    );
  }
  console.log("✅ DB migration complete");
}

async function bootstrap() {
  try {
    await connectDB();
    await connectRedis();
    await migrate();

    setIO(io);
    setupSocketServer(io);
    startGlobalGameLoop(io);
    startAuctionCron(io);

    httpServer.listen(env.PORT, () => {
      console.log(`🚀 NEXUS backend listening on :${env.PORT}`);
    });
  } catch (err) {
    console.error("❌ Startup failed:", err);
    process.exit(1);
  }
}

bootstrap();
