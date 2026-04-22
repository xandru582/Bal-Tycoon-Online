import { db, withTransaction } from "../config/database.js";

class MissionService {
  // Asigna misiones diarias/semanales si no hay activas
  async ensureMissions(userId: string): Promise<void> {
    const now = new Date();

    // Daily: 3 misiones diarias
    const daily = await db.query(
      `SELECT COUNT(*) as cnt FROM player_missions pm
       JOIN mission_definitions md ON md.id = pm.mission_id
       WHERE pm.user_id = $1 AND pm.expires_at > NOW() AND md.mission_type = 'daily'`,
      [userId]
    );
    if (parseInt(daily.rows[0].cnt) < 3) {
      const definitions = await db.query(
        `SELECT id FROM mission_definitions WHERE mission_type = 'daily'
         AND id NOT IN (
           SELECT mission_id FROM player_missions WHERE user_id = $1 AND expires_at > NOW()
         )
         ORDER BY RANDOM() LIMIT $2`,
        [userId, 3 - parseInt(daily.rows[0].cnt)]
      );

      const dailyExpiry = new Date(now);
      dailyExpiry.setUTCHours(23, 59, 59, 999);

      for (const def of definitions.rows) {
        await db.query(
          `INSERT INTO player_missions (user_id, mission_id, expires_at) VALUES ($1,$2,$3)
           ON CONFLICT DO NOTHING`,
          [userId, def.id, dailyExpiry]
        );
      }
    }

    // Weekly: 2 misiones semanales
    const weekly = await db.query(
      `SELECT COUNT(*) as cnt FROM player_missions pm
       JOIN mission_definitions md ON md.id = pm.mission_id
       WHERE pm.user_id = $1 AND pm.expires_at > NOW() AND md.mission_type = 'weekly'`,
      [userId]
    );
    if (parseInt(weekly.rows[0].cnt) < 2) {
      const wdefs = await db.query(
        `SELECT id FROM mission_definitions WHERE mission_type = 'weekly'
         AND id NOT IN (
           SELECT mission_id FROM player_missions WHERE user_id = $1 AND expires_at > NOW()
         )
         ORDER BY RANDOM() LIMIT $2`,
        [userId, 2 - parseInt(weekly.rows[0].cnt)]
      );

      // Expire next Monday
      const weeklyExpiry = new Date(now);
      const daysUntilMonday = weeklyExpiry.getUTCDay() === 0 ? 1 : 8 - weeklyExpiry.getUTCDay();
      weeklyExpiry.setUTCDate(weeklyExpiry.getUTCDate() + daysUntilMonday);
      weeklyExpiry.setUTCHours(0, 0, 0, 0);

      for (const def of wdefs.rows) {
        await db.query(
          `INSERT INTO player_missions (user_id, mission_id, expires_at) VALUES ($1,$2,$3)
           ON CONFLICT DO NOTHING`,
          [userId, def.id, weeklyExpiry]
        );
      }
    }
  }

  async getMissions(userId: string) {
    await this.ensureMissions(userId);

    const result = await db.query(
      `SELECT pm.id, md.title, md.description, md.mission_type, md.objective_type,
              md.objective_value, md.reward_credits, md.reward_influence, md.icon,
              pm.progress, pm.is_completed, pm.reward_claimed, pm.expires_at
       FROM player_missions pm
       JOIN mission_definitions md ON md.id = pm.mission_id
       WHERE pm.user_id = $1 AND pm.expires_at > NOW()
       ORDER BY md.mission_type, pm.assigned_at`,
      [userId]
    );
    return result.rows;
  }

  async claimReward(missionInstanceId: string, userId: string): Promise<{ credits: number; influence: number }> {
    // Single transaction: (1) lock the mission row, (2) verify it's
    // completed and unclaimed, (3) mark it claimed, (4) credit the reward.
    // If any step fails everything rolls back, so the mission is never
    // "claimed but not paid".
    return withTransaction(async (client) => {
      const result = await client.query(
        `SELECT pm.id, pm.is_completed, pm.reward_claimed,
                md.reward_credits, md.reward_influence
         FROM player_missions pm
         JOIN mission_definitions md ON md.id = pm.mission_id
         WHERE pm.id = $1 AND pm.user_id = $2
         FOR UPDATE OF pm`,
        [missionInstanceId, userId],
      );
      const mission = result.rows[0];
      if (!mission) throw new Error("Mission not found");
      if (!mission.is_completed) throw new Error("Mission not yet completed");
      if (mission.reward_claimed) throw new Error("Reward already claimed");

      // Atomic flip to claimed. If another concurrent claim somehow slipped
      // through we'd still get 0 rows here and throw.
      const flip = await client.query(
        `UPDATE player_missions
         SET reward_claimed = TRUE
         WHERE id = $1 AND reward_claimed = FALSE
         RETURNING id`,
        [missionInstanceId],
      );
      if (!flip.rows[0]) throw new Error("Reward already claimed");

      await client.query(
        `UPDATE game_states SET
           credits = credits + $1,
           total_earned = total_earned + $1,
           influence = influence + $2
         WHERE user_id = $3`,
        [mission.reward_credits, mission.reward_influence, userId],
      );

      return {
        credits: parseFloat(mission.reward_credits),
        influence: mission.reward_influence,
      };
    });
  }

  // Update progress for a mission type (called after game actions)
  async updateProgress(userId: string, objectiveType: string, amount: number): Promise<void> {
    await db.query(
      `UPDATE player_missions pm SET
         progress = LEAST(pm.progress + $3, md.objective_value),
         is_completed = (pm.progress + $3 >= md.objective_value)
       FROM mission_definitions md
       WHERE pm.mission_id = md.id
         AND pm.user_id = $1
         AND md.objective_type = $2
         AND pm.expires_at > NOW()
         AND NOT pm.is_completed`,
      [userId, objectiveType, amount]
    );
  }
}

export const missionService = new MissionService();
