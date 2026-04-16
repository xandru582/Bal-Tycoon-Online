import { useEffect, useRef } from "react";
import { useGameStore } from "../stores/gameStore";
import { useAuthStore } from "../stores/authStore";
import { getSocket } from "../lib/socket";
import api from "../lib/api";

export function useGameSync() {
  const { isAuthenticated } = useAuthStore();
  const { setServerState, addNotification } = useGameStore();
  const loadedRef = useRef(false);

  // ── Carga inicial del estado desde el servidor ────────────────
  useEffect(() => {
    if (!isAuthenticated || loadedRef.current) return;
    loadedRef.current = true;

    api.get("/game/state")
      .then(res => setServerState(res.data))
      .catch(err => console.error("Failed to load game state:", err));
  }, [isAuthenticated, setServerState]);

  // ── Guardar antes de cerrar la pestaña ───────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleBeforeUnload = () => {
      // Usar sendBeacon para garantizar que la request llega aunque se cierre el tab
      const token = localStorage.getItem("nexus_access_token");
      if (token) {
        navigator.sendBeacon(
          `${import.meta.env.VITE_API_URL ?? "/api/v1"}/game/save`,
          new Blob([JSON.stringify({ token })], { type: "application/json" })
        );
      }
      // También llamar al endpoint REST normalmentte (cubre la mayoría de casos)
      api.post("/game/save").catch(() => {});
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isAuthenticated]);

  // ── Autosave cada 60 segundos ────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      api.post("/game/save").catch(() => {});
    }, 60_000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // ── Suscripción WebSocket ────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();

    socket.on("game:tick", (data: {
      credits: number;
      creditsPerSecond: number;
      currentDay: number;
      influence: number;
      notifications: any[];
    }) => {
      // Server is authoritative for credits — it accumulates server-side and
      // includes any clicks that were sent via /game/action.
      setServerState({
        credits: data.credits,
        creditsPerSecond: data.creditsPerSecond,
        currentDay: data.currentDay,
        influence: data.influence,
      });
      if (data.notifications?.length) {
        data.notifications.forEach(n => addNotification?.(n));
      }
    });

    socket.on("game:achievement", (achievement: any) => {
      addNotification?.({
        type: "achievement",
        title: achievement.title,
        message: achievement.description,
        icon: achievement.icon ?? "🏆",
      });
    });

    return () => {
      socket.off("game:tick");
      socket.off("game:achievement");
    };
  }, [isAuthenticated, setServerState, addNotification]);
}
