import { useEffect, useRef } from "react";
import { useGameStore } from "../stores/gameStore";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";
import { getSocket } from "../lib/socket";
import api from "../lib/api";

export function useGameSync() {
  const { isAuthenticated } = useAuthStore();
  const loadedRef = useRef(false);

  // ── Carga inicial del estado desde el servidor ────────────────
  useEffect(() => {
    if (!isAuthenticated || loadedRef.current) return;
    loadedRef.current = true;

    api.get("/game/state")
      .then(res => useGameStore.getState().setServerState(res.data))
      .catch(err => console.error("Failed to load game state:", err));
  }, [isAuthenticated]);

  // ── Guardar antes de cerrar la pestaña ───────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleBeforeUnload = () => {
      const token = localStorage.getItem("nexus_access_token");
      if (token) {
        navigator.sendBeacon(
          `${import.meta.env.VITE_API_URL ?? "/api/v1"}/game/save`,
          new Blob([JSON.stringify({ token })], { type: "application/json" })
        );
      }
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

  // ── Suscripción WebSocket ─────────────────────────────────────
  // Se usa getState() para acceder a los métodos del store en lugar de
  // suscribirlos como deps del efecto — evita que el efecto se re-ejecute
  // en cada tick del juego (React 19 + Zustand 5 pueden tratar las funciones
  // del store como inestables, acumulando suscripciones y causando error #185)
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
      useGameStore.getState().setServerState({
        credits: data.credits,
        creditsPerSecond: data.creditsPerSecond,
        currentDay: data.currentDay,
        influence: data.influence,
      });
      if (data.notifications?.length) {
        data.notifications.forEach(n => useGameStore.getState().addNotification?.(n));
      }
    });

    socket.on("game:achievement", (achievement: any) => {
      useGameStore.getState().addNotification?.({
        type: "achievement",
        title: achievement.title,
        message: achievement.description,
        icon: achievement.icon ?? "🏆",
      });
    });

    socket.on("stock:price_update", (prices: Record<string, number>) => {
      useGameStore.getState().updateStockPrices(prices);
    });

    // Chat: suscripción centralizada para recibir mensajes aunque el
    // ChatPanel no esté montado (el contador de no-leídos funciona siempre)
    const unsubChat = useChatStore.getState().subscribeSocket();

    return () => {
      socket.off("game:tick");
      socket.off("game:achievement");
      socket.off("stock:price_update");
      unsubChat();
    };
  }, [isAuthenticated]); // Solo se re-ejecuta cuando cambia la autenticación
}
