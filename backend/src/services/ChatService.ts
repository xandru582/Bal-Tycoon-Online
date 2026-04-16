import { db } from "../config/database.js";

export type RoomType = "global" | "clan" | "dm" | "system";

export interface ChatMessage {
  id: number;
  roomType: RoomType;
  roomId: string;
  senderId: string | null;
  senderName: string;
  content: string;
  createdAt: Date;
}

const MAX_MSG_LENGTH = 500;
const BAD_WORDS = ["spam"]; // Extender con lista real

class ChatService {
  private moderate(content: string): string {
    let text = content.trim();
    if (text.length > MAX_MSG_LENGTH) text = text.slice(0, MAX_MSG_LENGTH);
    for (const word of BAD_WORDS) {
      text = text.replace(new RegExp(word, "gi"), "****");
    }
    return text;
  }

  async saveMessage(
    roomType: RoomType,
    roomId: string,
    senderId: string,
    senderName: string,
    rawContent: string
  ): Promise<ChatMessage> {
    const content = this.moderate(rawContent);
    if (!content) throw new Error("Empty message");

    const result = await db.query(
      `INSERT INTO messages (room_type, room_id, sender_id, sender_name, content)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [roomType, roomId, senderId, senderName, content]
    );
    const row = result.rows[0];
    return {
      id: row.id,
      roomType: row.room_type,
      roomId: row.room_id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      content: row.content,
      createdAt: row.created_at,
    };
  }

  async getHistory(
    roomType: RoomType,
    roomId: string,
    before?: number,
    limit = 50
  ): Promise<ChatMessage[]> {
    const params: any[] = [roomType, roomId, limit];
    let whereExtra = "";
    if (before) {
      whereExtra = ` AND m.id < $4`;
      params.push(before);
    }

    const result = await db.query(
      `SELECT m.id, m.room_type, m.room_id, m.sender_id, m.sender_name, m.content, m.created_at
       FROM messages m
       WHERE m.room_type = $1 AND m.room_id = $2 AND m.is_deleted = FALSE
       ${whereExtra}
       ORDER BY m.created_at DESC LIMIT $3`,
      params
    );
    return result.rows.reverse().map(row => ({
      id: row.id,
      roomType: row.room_type,
      roomId: row.room_id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      content: row.content,
      createdAt: row.created_at,
    }));
  }

  dmRoomId(userA: string, userB: string): string {
    const sorted = [userA, userB].sort();
    return `dm:${sorted[0]}:${sorted[1]}`;
  }

  async deleteMessage(messageId: number, userId: string): Promise<boolean> {
    const result = await db.query(
      "UPDATE messages SET is_deleted = TRUE WHERE id = $1 AND sender_id = $2 RETURNING id",
      [messageId, userId]
    );
    return result.rows.length > 0;
  }
}

export const chatService = new ChatService();
