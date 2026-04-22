import { db, withTransaction } from "../config/database.js";

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

    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Bid must be positive");
    // Cap to the precision of NUMERIC(20,4) ≈ 10^16 so overflow can't wedge the DB.
    if (amount > 1e16) throw new Error("Bid too large");

    // All the check/refund/charge logic runs in a single transaction with row
    // locks so two concurrent bids can't both deduct from the same player or
    // both "win" the building.
    const outbidUserId = await withTransaction(async (client) => {
      // Lock the building row (prevents concurrent bids from racing).
      const building = await client.query(
        "SELECT * FROM buildings WHERE id = $1 FOR UPDATE",
        [buildingId],
      );
      if (!building.rows[0]) throw new Error("Building not found");

      const currentWin = await client.query(
        `SELECT * FROM building_bids
         WHERE building_id = $1 AND auction_id = $2 AND is_winning = TRUE
         FOR UPDATE`,
        [buildingId, auctionId],
      );
      const current = currentWin.rows[0];

      const minBid = current
        ? parseFloat(current.bid_amount) * 1.05
        : parseFloat(building.rows[0].base_price);
      if (amount < minBid) throw new Error(`Minimum bid is ${minBid.toFixed(2)} Đ`);

      // Atomically deduct from the new bidder. WHERE guards against
      // insufficient funds so a race can't take credits negative.
      const deducted = await client.query(
        `UPDATE game_states
         SET credits = credits - $1
         WHERE user_id = $2 AND credits >= $1
         RETURNING credits`,
        [amount, bidderId],
      );
      if (!deducted.rows[0]) throw new Error("Insufficient credits");

      // Refund previous winner if any (and it's not the same user bidding
      // against themselves).
      let refundedBidderId: string | null = null;
      if (current && current.bidder_id !== bidderId) {
        await client.query(
          "UPDATE game_states SET credits = credits + $1 WHERE user_id = $2",
          [current.bid_amount, current.bidder_id],
        );
        refundedBidderId = current.bidder_id;
      } else if (current && current.bidder_id === bidderId) {
        // Same bidder topping their own bid — refund the prior reservation.
        await client.query(
          "UPDATE game_states SET credits = credits + $1 WHERE user_id = $2",
          [current.bid_amount, current.bidder_id],
        );
      }

      await client.query(
        "UPDATE building_bids SET is_winning = FALSE WHERE building_id = $1 AND auction_id = $2",
        [buildingId, auctionId],
      );
      await client.query(
        `INSERT INTO building_bids (building_id, auction_id, bidder_id, bid_amount, is_winning, auction_ends_at)
         VALUES ($1,$2,$3,$4,TRUE,$5)`,
        [buildingId, auctionId, bidderId, amount, auctionEndsAt],
      );
      return refundedBidderId;
    });

    // Side-effects (notifications) happen only AFTER commit, so a rollback
    // never leaves the chat/UI lying about what's on chain.
    const building = await db.query("SELECT name FROM buildings WHERE id = $1", [buildingId]);
    const buildingName = building.rows[0]?.name;
    if (io && outbidUserId) {
      io.to(`user:${outbidUserId}`).emit("auction:outbid", {
        buildingId,
        newAmount: amount,
        buildingName,
      });
    }
    if (io) {
      io.emit("auction:new_bid", { buildingId, buildingName, amount, bidderId, bidderName });
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
