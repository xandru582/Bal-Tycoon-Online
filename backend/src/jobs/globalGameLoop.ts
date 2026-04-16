import { Server as SocketIOServer } from "socket.io";
import { gameService } from "../services/GameService.js";
import { globalStockService } from "../services/GlobalStockService.js";
import { clanService } from "../services/ClanService.js";
import { db } from "../config/database.js";

const TICK_INTERVAL_MS = 1000;           // tick cada segundo
const LEADERBOARD_INTERVAL_MS = 5 * 60 * 1000; // leaderboard cada 5 min
const CLAN_SYNC_INTERVAL_MS = 10 * 60 * 1000;  // sync clanes cada 10 min
const STOCK_DAY_INTERVAL_MS = 60_000;    // 1 día de mercado = 1 minuto real

export function startGlobalGameLoop(io: SocketIOServer): void {
  // Inicializar servicio de stocks
  globalStockService.init().catch(console.error);

  let lastLeaderboardUpdate = 0;
  let lastClanSync = 0;
  let lastTick = Date.now();
  let lastStockDay = Date.now();
  let stockGameDay = 1;

  // ── Tick principal ─────────────────────────────────────────────
  setInterval(async () => {
    const now = Date.now();
    const delta = (now - lastTick) / 1000; // segundos reales transcurridos
    lastTick = now;

    // Tick a todas las sesiones activas
    const sessions = (gameService as any).sessions as Map<string, any>;
    for (const [, session] of sessions) {
      try {
        gameService.tick(session, delta);

        // Enviar estado del tick al socket del jugador
        io.to(`user:${session.userId}`).emit("game:tick", {
          credits:          session.credits,
          creditsPerSecond: session.creditsPerSecond,
          currentDay:       session.currentDay,
          influence:        session.influence,
          engineDay:        session.engine.day,
          engineMonth:      session.engine.month,
          engineYear:       session.engine.year,
          notifications:    session.notifications.splice(0),
        });
      } catch (err) {
        console.error(`Tick error for user ${session.userId}:`, err);
      }
    }

    // ── Leaderboard snapshot cada 5 min ────────────────────────
    if (now - lastLeaderboardUpdate > LEADERBOARD_INTERVAL_MS) {
      lastLeaderboardUpdate = now;
      updateLeaderboard().catch(console.error);
    }

    // ── Sync wealth de clanes cada 10 min ────────────────────────
    if (now - lastClanSync > CLAN_SYNC_INTERVAL_MS) {
      lastClanSync = now;
      clanService.syncWealths().catch(console.error);
    }
  }, TICK_INTERVAL_MS);

  // ── Avance del mercado de valores + broadcast ──────────────────
  // Cada 60 s reales = 1 día de mercado. Se avanza primero y luego
  // se hace broadcast para que los clientes reciban los precios nuevos.
  setInterval(() => {
    const now = Date.now();

    // Avanzar 1 día de mercado si ha pasado el intervalo
    if (now - lastStockDay >= STOCK_DAY_INTERVAL_MS) {
      lastStockDay = now;
      stockGameDay++;
      globalStockService.advanceDay(stockGameDay);
      console.log(`📈 Stock market day ${stockGameDay} — prices updated`);
    }

    const prices = globalStockService.getPriceMap();
    if (Object.keys(prices).length > 0) {
      io.emit("stock:price_update", prices);
    }
  }, 5000);

  console.log("🔄 Global game loop started");
}

async function updateLeaderboard(): Promise<void> {
  try {
    // Wealth leaderboard
    await db.query(`
      DELETE FROM leaderboard_snapshots WHERE snapshot_type IN ('wealth','influence','clan_wealth')
    `);

    await db.query(`
      INSERT INTO leaderboard_snapshots (snapshot_type, rank, entity_id, entity_name, value, clan_tag)
      SELECT 'wealth', ROW_NUMBER() OVER (ORDER BY gs.net_worth DESC),
             u.id, u.username, gs.net_worth,
             (SELECT c.tag FROM clan_members cm JOIN clans c ON c.id = cm.clan_id WHERE cm.user_id = u.id LIMIT 1)
      FROM game_states gs JOIN users u ON u.id = gs.user_id
      ORDER BY gs.net_worth DESC LIMIT 100
    `);

    await db.query(`
      INSERT INTO leaderboard_snapshots (snapshot_type, rank, entity_id, entity_name, value, clan_tag)
      SELECT 'influence', ROW_NUMBER() OVER (ORDER BY gs.influence DESC),
             u.id, u.username, gs.influence,
             (SELECT c.tag FROM clan_members cm JOIN clans c ON c.id = cm.clan_id WHERE cm.user_id = u.id LIMIT 1)
      FROM game_states gs JOIN users u ON u.id = gs.user_id
      ORDER BY gs.influence DESC LIMIT 100
    `);

    await db.query(`
      INSERT INTO leaderboard_snapshots (snapshot_type, rank, entity_id, entity_name, value, clan_tag)
      SELECT 'clan_wealth', ROW_NUMBER() OVER (ORDER BY c.total_wealth DESC),
             c.id, c.name, c.total_wealth, c.tag
      FROM clans c ORDER BY c.total_wealth DESC LIMIT 100
    `);
  } catch (err) {
    console.error("Leaderboard update error:", err);
  }
}
