import { db } from "../config/database.js";

export interface BuildingRow {
  id: string;
  name: string;
  building_type: string;
  position_x: number;
  position_y: number;
  position_z: number;
  scale_y: number;
  base_price: number;
  cps_base: number;
  level: number;
  owner_id: string | null;
  owner_name: string | null;
  owner_clan_color: string | null;
  owner_clan_tag: string | null;
  display_text: string | null;
  display_image_url: string | null;
  owned_since: string | null;
  for_sale: boolean;
  sale_price: number | null;
}

class BuildingService {
  // Current upgrade cost for a building at its current level
  upgradeCost(basePrice: number, currentLevel: number): number {
    return Math.ceil(basePrice * 1.8 * currentLevel);
  }

  // CPS at a given level
  cpsAtLevel(cpsBase: number, level: number): number {
    return cpsBase * level;
  }

  async getBuildings(): Promise<BuildingRow[]> {
    const { rows } = await db.query(
      `SELECT b.*,
              u.username AS owner_name,
              c.color    AS owner_clan_color,
              c.tag      AS owner_clan_tag
       FROM buildings b
       LEFT JOIN users u ON u.id = b.owner_id
       LEFT JOIN clan_members cm ON cm.user_id = b.owner_id
       LEFT JOIN clans c ON c.id = cm.clan_id
       ORDER BY b.base_price ASC`
    );
    return rows;
  }

  async getBuildingById(id: string): Promise<BuildingRow | null> {
    const { rows } = await db.query(
      `SELECT b.*, u.username AS owner_name
       FROM buildings b
       LEFT JOIN users u ON u.id = b.owner_id
       WHERE b.id = $1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async getMyBuildings(userId: string): Promise<BuildingRow[]> {
    const { rows } = await db.query(
      `SELECT * FROM buildings WHERE owner_id = $1 ORDER BY base_price ASC`,
      [userId]
    );
    return rows;
  }

  async getTotalCps(userId: string): Promise<number> {
    const { rows } = await db.query(
      `SELECT COALESCE(SUM(cps_base * level), 0) AS total FROM buildings WHERE owner_id = $1`,
      [userId]
    );
    return parseFloat(rows[0].total) || 0;
  }

  async buyBuilding(
    buildingId: string,
    userId: string,
    username: string,
    currentCredits: number
  ): Promise<{ success: boolean; error?: string; cost?: number; cpsGained?: number }> {
    const b = await this.getBuildingById(buildingId);
    if (!b) return { success: false, error: "Edificio no encontrado" };
    if (b.owner_id === userId) return { success: false, error: "Ya eres propietario" };
    if (b.owner_id) return { success: false, error: "Este edificio ya tiene dueño. Espera a que lo venda." };

    const cost = b.base_price;
    if (currentCredits < cost) return { success: false, error: `Necesitas Đ ${cost.toLocaleString()}` };

    await db.query(
      `UPDATE buildings SET owner_id = $1, level = 1, owned_since = NOW() WHERE id = $2`,
      [userId, buildingId]
    );

    return { success: true, cost, cpsGained: this.cpsAtLevel(b.cps_base, 1) };
  }

  async upgradeBuilding(
    buildingId: string,
    userId: string,
    currentCredits: number
  ): Promise<{ success: boolean; error?: string; cost?: number; newLevel?: number; cpsGained?: number }> {
    const b = await this.getBuildingById(buildingId);
    if (!b) return { success: false, error: "Edificio no encontrado" };
    if (b.owner_id !== userId) return { success: false, error: "No eres el propietario" };
    if (b.level >= 10) return { success: false, error: "Nivel máximo alcanzado (10)" };

    const cost = this.upgradeCost(b.base_price, b.level);
    if (currentCredits < cost) return { success: false, error: `Necesitas Đ ${cost.toLocaleString()}` };

    const newLevel = b.level + 1;
    await db.query(
      `UPDATE buildings SET level = $1 WHERE id = $2`,
      [newLevel, buildingId]
    );

    const cpsGained = this.cpsAtLevel(b.cps_base, newLevel) - this.cpsAtLevel(b.cps_base, b.level);
    return { success: true, cost, newLevel, cpsGained };
  }

  async customizeBuilding(
    buildingId: string,
    userId: string,
    displayText: string,
    displayImageUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    const b = await this.getBuildingById(buildingId);
    if (!b) return { success: false, error: "Edificio no encontrado" };
    if (b.owner_id !== userId) return { success: false, error: "No eres el propietario" };

    await db.query(
      `UPDATE buildings SET display_text = $1, display_image_url = $2 WHERE id = $3`,
      [displayText?.slice(0, 200) || null, displayImageUrl?.slice(0, 500) || null, buildingId]
    );
    return { success: true };
  }

  async listForSale(
    buildingId: string,
    userId: string,
    price: number
  ): Promise<{ success: boolean; error?: string }> {
    const b = await this.getBuildingById(buildingId);
    if (!b) return { success: false, error: "Edificio no encontrado" };
    if (b.owner_id !== userId) return { success: false, error: "No eres el propietario" };
    if (price <= 0) return { success: false, error: "Precio inválido" };

    await db.query(
      `UPDATE buildings SET for_sale = TRUE, sale_price = $1 WHERE id = $2`,
      [price, buildingId]
    );
    return { success: true };
  }

  async delist(
    buildingId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const b = await this.getBuildingById(buildingId);
    if (!b) return { success: false, error: "Edificio no encontrado" };
    if (b.owner_id !== userId) return { success: false, error: "No eres el propietario" };

    await db.query(
      `UPDATE buildings SET for_sale = FALSE, sale_price = NULL WHERE id = $1`,
      [buildingId]
    );
    return { success: true };
  }

  async buyFromPlayer(
    buildingId: string,
    buyerId: string,
    buyerCredits: number
  ): Promise<{ success: boolean; error?: string; cost?: number; cpsGained?: number; sellerId?: string; sellerPayout?: number }> {
    const b = await this.getBuildingById(buildingId);
    if (!b) return { success: false, error: "Edificio no encontrado" };
    if (!b.for_sale || !b.sale_price) return { success: false, error: "Este edificio no está en venta" };
    if (b.owner_id === buyerId) return { success: false, error: "Ya eres el propietario" };

    const cost = b.sale_price;
    if (buyerCredits < cost) return { success: false, error: `Necesitas Đ ${cost.toLocaleString()}` };

    const sellerId = b.owner_id!;

    await db.query(
      `UPDATE buildings
       SET owner_id = $1, for_sale = FALSE, sale_price = NULL, level = $2, owned_since = NOW()
       WHERE id = $3`,
      [buyerId, b.level, buildingId]
    );

    return {
      success: true,
      cost,
      cpsGained: this.cpsAtLevel(b.cps_base, b.level),
      sellerId,
      sellerPayout: cost,
    };
  }
}

export const buildingService = new BuildingService();
