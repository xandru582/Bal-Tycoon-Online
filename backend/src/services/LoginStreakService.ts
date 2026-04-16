import { db } from "../config/database.js";

const STREAK_REWARDS: Array<{ day: number; credits: number; influence: number }> = [
  { day: 1,  credits: 1_000,     influence: 0   },
  { day: 2,  credits: 2_000,     influence: 0   },
  { day: 3,  credits: 5_000,     influence: 50  },
  { day: 4,  credits: 5_000,     influence: 50  },
  { day: 5,  credits: 10_000,    influence: 100 },
  { day: 6,  credits: 10_000,    influence: 100 },
  { day: 7,  credits: 25_000,    influence: 200 },
  { day: 14, credits: 100_000,   influence: 500 },
  { day: 30, credits: 500_000,   influence: 1000 },
];

function rewardForDay(streak: number): { credits: number; influence: number } {
  let reward = { credits: 1_000, influence: 0 };
  for (const r of STREAK_REWARDS) {
    if (streak >= r.day) reward = { credits: r.credits, influence: r.influence };
  }
  return reward;
}

class LoginStreakService {
  async recordLogin(userId: string): Promise<{ streak: number; reward: { credits: number; influence: number }; isNew: boolean }> {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Already claimed today?
    const existing = await db.query(
      "SELECT * FROM daily_logins WHERE user_id = $1 AND login_date = $2",
      [userId, today]
    );
    if (existing.rows[0]) {
      return { streak: existing.rows[0].streak_day, reward: { credits: 0, influence: 0 }, isNew: false };
    }

    // Find yesterday's login
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yDate = yesterday.toISOString().slice(0, 10);

    const prev = await db.query(
      "SELECT streak_day FROM daily_logins WHERE user_id = $1 AND login_date = $2",
      [userId, yDate]
    );

    const streak = prev.rows[0] ? prev.rows[0].streak_day + 1 : 1;
    const reward = rewardForDay(streak);

    await db.query(
      `INSERT INTO daily_logins (user_id, login_date, streak_day, reward_credits, reward_influence, claimed)
       VALUES ($1,$2,$3,$4,$5,FALSE)`,
      [userId, today, streak, reward.credits, reward.influence]
    );

    return { streak, reward, isNew: true };
  }

  async getStreak(userId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const result = await db.query(
      `SELECT dl.*, (dl.claimed = FALSE AND dl.login_date = $2) as can_claim
       FROM daily_logins dl
       WHERE dl.user_id = $1
       ORDER BY dl.login_date DESC LIMIT 30`,
      [userId, today]
    );
    const current = result.rows[0];
    return {
      streak: current?.streak_day ?? 0,
      canClaim: current?.can_claim ?? false,
      reward: current ? rewardForDay(current.streak_day) : { credits: 0, influence: 0 },
      history: result.rows,
    };
  }

  async claimStreak(userId: string): Promise<{ credits: number; influence: number }> {
    const today = new Date().toISOString().slice(0, 10);
    const result = await db.query(
      `UPDATE daily_logins SET claimed = TRUE
       WHERE user_id = $1 AND login_date = $2 AND claimed = FALSE
       RETURNING reward_credits, reward_influence`,
      [userId, today]
    );
    if (!result.rows[0]) throw new Error("No reward to claim today");

    const { reward_credits, reward_influence } = result.rows[0];
    await db.query(
      `UPDATE game_states SET
         credits = credits + $1,
         total_earned = total_earned + $1,
         influence = influence + $2
       WHERE user_id = $3`,
      [reward_credits, reward_influence, userId]
    );

    return { credits: parseFloat(reward_credits), influence: reward_influence };
  }
}

export const loginStreakService = new LoginStreakService();
