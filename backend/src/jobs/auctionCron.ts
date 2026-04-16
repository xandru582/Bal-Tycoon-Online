import cron from "node-cron";
import { auctionService } from "../services/AuctionService.js";
import { Server as SocketIOServer } from "socket.io";

export function startAuctionCron(io: SocketIOServer): void {
  // Cierra subastas todos los lunes a las 00:00 UTC
  cron.schedule("0 0 * * 1", async () => {
    console.log("🏛️ Closing weekly auctions...");
    await auctionService.closeAuctions(io);
  }, { timezone: "UTC" });

  console.log("⏰ Auction cron scheduled (Mon 00:00 UTC)");
}
