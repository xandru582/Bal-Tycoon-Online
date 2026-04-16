import { create } from "zustand";
import api from "../lib/api";
import { getSocket } from "../lib/socket";

export interface ChatMessage {
  id: number;
  room: string;
  roomType: "global" | "clan" | "dm";
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

interface ChatState {
  messages: Record<string, ChatMessage[]>; // keyed by roomId
  activeRoom: string;
  activeRoomType: "global" | "clan" | "dm";
  unreadCount: number;

  setActiveRoom: (room: string, roomType: "global" | "clan" | "dm") => void;
  loadHistory: (room: string, roomType: "global" | "clan" | "dm", targetUserId?: string) => Promise<void>;
  sendMessage: (content: string, targetUserId?: string) => void;
  addMessage: (msg: ChatMessage) => void;
  subscribeSocket: () => () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: {},
  activeRoom: "global",
  activeRoomType: "global",
  unreadCount: 0,

  setActiveRoom: (room, roomType) => {
    set({ activeRoom: room, activeRoomType: roomType, unreadCount: 0 });
  },

  loadHistory: async (room, roomType, targetUserId) => {
    try {
      let url = "/chat/global";
      if (roomType === "clan") url = `/chat/clan/${room}`;
      if (roomType === "dm" && targetUserId) url = `/chat/dm/${targetUserId}`;

      const res = await api.get(url, { params: { limit: 50 } });
      // REST returns snake_case; normalize to camelCase
      const msgs: ChatMessage[] = res.data.reverse().map((m: any) => ({
        id: m.id,
        room: m.room_id ?? room,
        roomType,
        senderId: m.sender_id ?? m.senderId ?? "",
        senderName: m.sender_name ?? m.senderName ?? "?",
        content: m.content,
        timestamp: m.created_at ?? m.timestamp ?? new Date().toISOString(),
      }));

      set(state => ({
        messages: { ...state.messages, [room]: msgs }
      }));

      // Join the socket room
      const socket = getSocket();
      socket.emit("chat:join_room", { room });
    } catch (err) {
      console.error("Chat load error:", err);
    }
  },

  sendMessage: (content, targetUserId) => {
    const { activeRoom, activeRoomType } = get();
    const socket = getSocket();
    socket.emit("chat:message", {
      room: activeRoom,
      roomType: activeRoomType,
      content,
      targetUserId,
    });
  },

  addMessage: (msg) => {
    set(state => {
      const isActive = msg.room === state.activeRoom;
      return {
        messages: {
          ...state.messages,
          [msg.room]: [...(state.messages[msg.room] ?? []), msg].slice(-200),
        },
        unreadCount: isActive ? 0 : state.unreadCount + 1,
      };
    });
  },

  subscribeSocket: () => {
    const socket = getSocket();
    const handler = (msg: ChatMessage) => {
      get().addMessage(msg);
    };
    socket.on("chat:message", handler);
    return () => { socket.off("chat:message", handler); };
  },
}));
