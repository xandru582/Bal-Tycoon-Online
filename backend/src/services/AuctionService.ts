import { db } from "../config/database.js";

function nextMondayUTC(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0 Sun … 6 Sat
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilMonday));
  return next;
}

function currentAuctionId(): string {
  const next = nextMondayUTC();
  return `auction-${next.toISOString().slice(0, 10)}`;
}

class AuctionService {
  async getBuildings() {
    const auctionId = currentAuctionId();
    const auctionEndsAt = nextMondayUTC().toISOString();

    const result = await db.query(
      `SELECT b.*,
              u.username as owner_name,
              c.name as owner_clan_name,
              c.color as owner_clan_color,
              c.tag as owner_clan_tag,
              bb.bid_amount as current_bid,
              bb.bidder_id as current_bidder_id,
              bu.username as current_bidder_name
       FROM buildings b
       LEFT JOIN users u ON u.id = b.owner_id
       LEFT JOIN clans c ON c.id = b.owner_clan_id
       LEFT JOIN building_bids bb ON bb.building_id = b.id
         AND bb.auction_id = $1 AND bb.is_winning = TRUE
       LEFT JOIN users bu ON bu.id = bb.bidder_id
       ORDER BY b.name`,
      [auctionId]
    );

    return result.rows.map(r => ({
      ...r,
      auction_id: auctionId,
      auction_ends_at: auctionEndsAt,
    }));
  }

  async getMyBuildings(userId: string) {
    const result = await db.query(
      `SELECT * FROM buildings WHERE owner_id = $1 ORDER BY name`,
      [userId]
    );
    return result.rows;
  }

  async placeBid(buildingId: string, bidderId: string, bidderName: string, amount: number, io?: any) {
    const auctionId = currentAuctionId();
    const auctionEndsAt = nextMondayUTC();

    if (amount <= 0) throw new Error("Bid must be positive");

    // Get current winning bid
    const currentWin = await db.query(
      `SELECT bb.*, u.username as bidder_name
       FROM building_bids bb LEFT JOIN users u ON u.id = bb.bidder_id
       WHERE bb.building_id = $1 AND bb.auction_id = $2 AND bb.is_winning = TRUE`,
      [buildingId, auctionId]
    );

    const current = currentWin.rows[0];
    const building = await db.query("SELECT * FROM buildings WHERE id = $1", [buildingId]);
    if (!building.rows[0]) throw new Error("Building not found");

    const minBid = current
      ? parseFloat(current.bid_amount) * 1.05 // +5% over current
      : parseFloat(building.rows[0].base_price);

    if (amount < minBid) throw new Error(`Minimum bid is ${minBid.toFixed(2)} Đ`);

    // Check bidder has enough credits (reserve bid amount)
    const funds = await db.query(
      "SELECT credits FROM game_states WHERE user_id = $1",
      [bidderId]
    );
    if (!funds.rows[0] || parseFloat(funds.rows[0].credits) < amount) {
      throw new Error("Insufficient credits");
    }

    // Refund previous winner if exists
    if (current && current.bidder_id !== bidderId) {
      await db.query(
        "UPDATE game_states SET credits = credits + $1 WHERE user_id = $2",
        [current.bid_amount, current.bidder_id]
      );
      // Notify them they were outbid
      if (io) {
        io.to(`user:${current.bidder_id}`).emit("auction:outbid", {
          buildingId,
          newAmount: amount,
          buildingName: building.rows[0].name,
        });
      }
    }

    // Deduct credits from new bidder
    await db.query(
      "UPDATE game_states SET credits = credits - $1 WHERE user_id = $2",
      [amount, bidderId]
    );

    // Mark previous bids as not winning
    await db.query(
      "UPDATE building_bids SET is_winning = FALSE WHERE building_id = $1 AND auction_id = $2",
      [buildingId, auctionId]
    );

    // Insert new winning bid
    await db.query(
      `INSERT INTO building_bids (building_id, auction_id, bidder_id, bid_amount, is_winning, auction_ends_at)
       VALUES ($1,$2,$3,$4,TRUE,$5)`,
      [buildingId, auctionId, bidderId, amount, auctionEndsAt]
    );

    // Broadcast new bid to all
    if (io) {
      io.emit("auction:new_bid", {
        buildingId,
        buildingName: building.rows[0].name,
        amount,
        bidderId,
        bidderName,
      });
    }

    return { success: true, amount };
  }

  async updateDisplay(buildingId: string, ownerId: string, imageUrl: string | null, displayText: string | null) {
    const result = await db.query(
      `UPDATE buildings SET display_image_url = $1, display_text = $2
       WHERE id = $3 AND owner_id = $4
       RETURNING id`,
      [imageUrl, displayText, buildingId, ownerId]
    );
    if (!result.rows[0]) throw new Error("Building not found or not owner");
    return { success: true };
  }

  // Called by auctionCron every Monday 00:00 UTC
  async closeAuctions(io?: any): Promise<void> {
    const auctionId = currentAuctionId();

    // Get all winning bids for current auction
    const winners = await db.query(
      `SELECT bb.*, b.name as building_name, b.passive_bonus_type, b.passive_bonus_value
       FROM building_bids bb
       JOIN buildings b ON b.id = bb.building_id
       WHERE bb.auction_id = $1 AND bb.is_winning = TRUE`,
      [auctionId]
    );

    for (const winner of winners.rows) {
      // Transfer building ownership
      await db.query(
        `UPDATE buildings SET
           owner_id = $1,
           last_sold_price = $2,
           owned_since = NOW()
         WHERE id = $3`,
        [winner.bidder_id, winner.bid_amount, winner.building_id]
      );

      // Notify winner
      if (io) {
        io.to(`user:${winner.bidder_id}`).emit("auction:closed", {
          buildingId: winner.building_id,
          buildingName: winner.building_name,
          winner: winner.bidder_id,
          amount: winner.bid_amount,
          won: true,
        });
      }
    }

    console.log(`✅ Closed ${winners.rows.length} auction(s) for ${auctionId}`);
  }
}

export const auctionService = new AuctionService();
