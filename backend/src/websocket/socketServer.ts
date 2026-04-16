import { Server as SocketIOServer } from "socket.io";
import type { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { gameService } from "../services/GameService.js";
import { globalStockService } from "../services/GlobalStockService.js";
import { chatService } from "../services/ChatService.js";
import { clanService } from "../services/ClanService.js";
import { auctionService } from "../services/AuctionService.js";

type AuthenticatedSocket = Socket & {
  userId: string;
  username: string;
  clanId?: string;
};

export function setupSocketServer(io: SocketIOServer): void {
  // ── Auth middleware ─────────────────────────────────────────────
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) return next(new Error("Authentication required"));

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string; username: string };
      (socket as AuthenticatedSocket).userId = payload.userId;
      (socket as AuthenticatedSocket).username = payload.username;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (rawSocket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const { userId, username } = socket;

    // Join personal room for targeted notifications
    socket.join(`user:${userId}`);

    // Load game session
    try {
      await gameService.loadSession(userId, username);
    } catch (err) {
      console.error(`Session load failed for ${username}:`, err);
    }

    // Join clan room if applicable
    try {
      const clan = await clanService.getUserClan(userId);
      if (clan) {
        socket.clanId = clan.id;
        socket.join(`clan:${clan.id}`);
      }
    } catch {}

    console.log(`✅ ${username} connected (${socket.id})`);

    // ── game:action ─────────────────────────────────────────────
    socket.on("game:action", async (data: { type: string; payload: any }) => {
      const session = gameService.getSession(userId);
      if (!session) return;
      const result = await gameService.processAction(session, data.type, data.payload ?? {});
      socket.emit("game:action_result", result);
    });

    // ── stock:buy / stock:sell ───────────────────────────────────
    socket.on("stock:buy", async (data: { ticker: string; shares: number }) => {
      const session = gameService.getSession(userId);
      if (!session) return socket.emit("stock:error", { error: "No session" });

      const result = await globalStockService.executeTrade(
        userId, username, "buy", data.ticker, data.shares, session.currentDay, io
      );
      if (!result.success) return socket.emit("stock:error", result);
      if (session.credits < (result.cost ?? 0)) return socket.emit("stock:error", { error: "Insufficient credits" });

      session.credits -= result.cost!;
      session.stockMarket.addToPortfolio?.(data.ticker, data.shares, result.price!);
      socket.emit("stock:trade_result", { ...result, credits: session.credits });
    });

    socket.on("stock:sell", async (data: { ticker: string; shares: number }) => {
      const session = gameService.getSession(userId);
      if (!session) return socket.emit("stock:error", { error: "No session" });

      const playerShares = session.stockMarket.getPortfolioShares?.(data.ticker) ?? 0;
      if (playerShares < data.shares) return socket.emit("stock:error", { error: "Not enough shares" });

      const result = await globalStockService.executeTrade(
        userId, username, "sell", data.ticker, data.shares, session.currentDay, io
      );
      if (!result.success) return socket.emit("stock:error", result);

      session.credits += result.proceeds! * session.prestigeBonus;
      session.totalCreditsEarned += result.proceeds!;
      session.stockMarket.removeFromPortfolio?.(data.ticker, data.shares);
      socket.emit("stock:trade_result", { ...result, credits: session.credits });
    });

    // ── chat:join_room ───────────────────────────────────────────
    socket.on("chat:join_room", (data: { room: string }) => {
      socket.join(`chat:${data.room}`);
    });

    // ── chat:message ─────────────────────────────────────────────
    socket.on("chat:message", async (data: { room: string; roomType?: string; content: string; targetUserId?: string }) => {
      try {
        let roomType: any = data.roomType ?? "global";
        let roomId = data.room;

        if (roomType === "dm" && data.targetUserId) {
          roomId = chatService.dmRoomId(userId, data.targetUserId);
        }

        const msg = await chatService.saveMessage(roomType, roomId, userId, username, data.content);

        const outMsg = {
          id: msg.id,
          room: roomId,
          roomType,
          senderId: userId,
          senderName: username,
          content: msg.content,
          timestamp: msg.createdAt,
        };

        if (roomType === "global") {
          io.emit("chat:message", outMsg);
        } else if (roomType === "clan" && socket.clanId) {
          io.to(`clan:${socket.clanId}`).emit("chat:message", outMsg);
        } else if (roomType === "dm" && data.targetUserId) {
          io.to(`user:${userId}`).emit("chat:message", outMsg);
          io.to(`user:${data.targetUserId}`).emit("chat:message", outMsg);
        }
      } catch (err: any) {
        socket.emit("chat:error", { error: err.message });
      }
    });

    // ── auction:bid ──────────────────────────────────────────────
    socket.on("auction:bid", async (data: { building_id: string; amount: number }) => {
      try {
        const result = await auctionService.placeBid(data.building_id, userId, username, data.amount, io);
        // Also update session credits
        const session = gameService.getSession(userId);
        if (session) session.credits -= data.amount;
        socket.emit("auction:bid_result", result);
      } catch (err: any) {
        socket.emit("auction:bid_error", { error: err.message });
      }
    });

    // ── auction:watch ────────────────────────────────────────────
    socket.on("auction:watch", (data: { building_id: string }) => {
      socket.join(`auction:${data.building_id}`);
    });

    // ── disconnect ───────────────────────────────────────────────
    socket.on("disconnect", async () => {
      const session = gameService.getSession(userId);
      if (session) {
        try { await gameService.saveSession(session); } catch {}
      }
      console.log(`❌ ${username} disconnected`);
    });
  });
}
