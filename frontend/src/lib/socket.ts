import { io, Socket } from "socket.io-client";

const WS_URL = import.meta.env.VITE_WS_URL ?? "/";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem("nexus_access_token") ?? "";
    socket = io(WS_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on("connect", () => console.log("🔌 Socket connected"));
    socket.on("disconnect", (reason) => console.log("🔌 Socket disconnected:", reason));
    socket.on("connect_error", (err) => console.warn("Socket error:", err.message));
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function reconnectSocket(): void {
  if (socket) {
    disconnectSocket();
  }
  getSocket();
}

export { socket };
