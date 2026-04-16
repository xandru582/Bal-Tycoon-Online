import { db } from "../config/database.js";

export interface ClanCreateInput {
  name: string;
  tag: string;
  description?: string;
  color?: string;
  emblem_url?: string;
  leaderId: string;
}

class ClanService {
  async create(input: ClanCreateInput) {
    if (input.name.length < 3 || input.name.length > 50)
      throw new Error("Clan name must be 3-50 characters");
    if (!/^[A-Z0-9]{2,6}$/.test(input.tag))
      throw new Error("Tag must be 2-6 uppercase alphanumeric characters");

    // Check if user already in a clan
    const existing = await db.query(
      "SELECT clan_id FROM clan_members WHERE user_id = $1",
      [input.leaderId]
    );
    if (existing.rows.length > 0) throw new Error("Already in a clan");

    const result = await db.query(
      `INSERT INTO clans (name, tag, description, color, emblem_url, leader_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [input.name, input.tag, input.description ?? null, input.color ?? "#00d4ff", input.emblem_url ?? null, input.leaderId]
    );
    const clan = result.rows[0];

    await db.query(
      `INSERT INTO clan_members (clan_id, user_id, role) VALUES ($1,$2,'leader')`,
      [clan.id, input.leaderId]
    );

    return clan;
  }

  async list(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const result = await db.query(
      `SELECT c.*, u.username as leader_name
       FROM clans c JOIN users u ON u.id = c.leader_id
       ORDER BY c.total_wealth DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  async get(clanId: string) {
    const result = await db.query(
      `SELECT c.*, u.username as leader_name,
              (SELECT json_agg(json_build_object('userId', cm.user_id, 'username', u2.username, 'role', cm.role, 'contribution', cm.contribution, 'joinedAt', cm.joined_at))
               FROM clan_members cm JOIN users u2 ON u2.id = cm.user_id WHERE cm.clan_id = c.id) as members
       FROM clans c JOIN users u ON u.id = c.leader_id
       WHERE c.id = $1`,
      [clanId]
    );
    return result.rows[0] ?? null;
  }

  async join(clanId: string, userId: string) {
    const existing = await db.query(
      "SELECT clan_id FROM clan_members WHERE user_id = $1",
      [userId]
    );
    if (existing.rows.length > 0) throw new Error("Already in a clan");

    await db.query(
      `INSERT INTO clan_members (clan_id, user_id, role) VALUES ($1,$2,'member')`,
      [clanId, userId]
    );
    await db.query(
      `UPDATE clans SET member_count = member_count + 1 WHERE id = $1`,
      [clanId]
    );
  }

  async leave(clanId: string, userId: string) {
    const member = await db.query(
      "SELECT role FROM clan_members WHERE clan_id = $1 AND user_id = $2",
      [clanId, userId]
    );
    if (!member.rows[0]) throw new Error("Not a member");
    if (member.rows[0].role === "leader") throw new Error("Leader cannot leave — transfer leadership first");

    await db.query(
      "DELETE FROM clan_members WHERE clan_id = $1 AND user_id = $2",
      [clanId, userId]
    );
    await db.query(
      "UPDATE clans SET member_count = GREATEST(member_count - 1, 0) WHERE id = $1",
      [clanId]
    );
  }

  async contribute(clanId: string, userId: string, amount: number) {
    if (amount <= 0) throw new Error("Amount must be positive");

    // Deduct from player credits
    const upd = await db.query(
      `UPDATE game_states SET credits = credits - $1
       WHERE user_id = $2 AND credits >= $1
       RETURNING credits`,
      [amount, userId]
    );
    if (!upd.rows[0]) throw new Error("Insufficient credits");

    // Add to clan chest + contribution
    await db.query(
      `UPDATE clans SET chest_credits = chest_credits + $1, total_wealth = total_wealth + $1 WHERE id = $2`,
      [amount, clanId]
    );
    await db.query(
      `UPDATE clan_members SET contribution = contribution + $1 WHERE clan_id = $2 AND user_id = $3`,
      [amount, clanId, userId]
    );

    return { newCredits: parseFloat(upd.rows[0].credits) };
  }

  async kick(clanId: string, officerId: string, targetUserId: string) {
    const officer = await db.query(
      "SELECT role FROM clan_members WHERE clan_id = $1 AND user_id = $2",
      [clanId, officerId]
    );
    if (!officer.rows[0] || !["leader", "officer"].includes(officer.rows[0].role)) {
      throw new Error("Insufficient permissions");
    }
    const target = await db.query(
      "SELECT role FROM clan_members WHERE clan_id = $1 AND user_id = $2",
      [clanId, targetUserId]
    );
    if (!target.rows[0]) throw new Error("Target not in clan");
    if (target.rows[0].role === "leader") throw new Error("Cannot kick the leader");

    await db.query(
      "DELETE FROM clan_members WHERE clan_id = $1 AND user_id = $2",
      [clanId, targetUserId]
    );
    await db.query(
      "UPDATE clans SET member_count = GREATEST(member_count - 1, 0) WHERE id = $1",
      [clanId]
    );
  }

  async getRanking(limit = 50) {
    const result = await db.query(
      `SELECT c.id, c.name, c.tag, c.color, c.total_wealth, c.member_count, c.war_wins, u.username as leader_name
       FROM clans c JOIN users u ON u.id = c.leader_id
       ORDER BY c.total_wealth DESC LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async getUserClan(userId: string) {
    const result = await db.query(
      `SELECT c.*, cm.role, u.username as leader_name
       FROM clan_members cm
       JOIN clans c ON c.id = cm.clan_id
       JOIN users u ON u.id = c.leader_id
       WHERE cm.user_id = $1`,
      [userId]
    );
    return result.rows[0] ?? null;
  }

  // Sync total_wealth from members' net_worth
  async syncWealths(): Promise<void> {
    await db.query(`
      UPDATE clans c SET total_wealth = (
        SELECT COALESCE(SUM(gs.net_worth), 0)
        FROM clan_members cm
        JOIN game_states gs ON gs.user_id = cm.user_id
        WHERE cm.clan_id = c.id
      ) + c.chest_credits
    `);
  }
}

export const clanService = new ClanService();
