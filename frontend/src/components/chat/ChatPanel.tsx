import { useEffect, useRef, useState, useCallback } from "react";
import { useChatStore } from "../../stores/chatStore";
import { useAuthStore } from "../../stores/authStore";
import api from "../../lib/api";

interface PlayerResult {
  id: string;
  username: string;
  net_worth: string;
  clan_tag?: string;
}

// Hardcoded colors — do NOT use CSS variables here; they may be unset in production
const C = {
  textPrimary: "#e2e8f0",
  textMuted:   "#64748b",
  cyan:        "#00d4ff",
  borderFaint: "rgba(255,255,255,0.06)",
  borderCyan:  "rgba(0,212,255,0.25)",
  borderMuted: "rgba(255,255,255,0.1)",
  bg03:        "rgba(255,255,255,0.03)",
  bg04:        "rgba(255,255,255,0.04)",
  bgCyanSub:   "rgba(0,212,255,0.1)",
  font:        '"IBM Plex Mono", "Courier New", monospace',
};

function MessageList({ roomId, userId }: { roomId: string; userId: string }) {
  const messages = useChatStore(s => s.messages[roomId] ?? []);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
      {messages.length === 0 && (
        <div style={{ textAlign: "center", color: C.textMuted, fontSize: 11, paddingTop: 24, fontStyle: "italic" }}>
          Sin mensajes aún
        </div>
      )}
      {messages.map(msg => {
        const isMe = msg.senderId === userId;
        return (
          <div key={msg.id} style={{ display: "flex", gap: 7, alignItems: "flex-start", flexDirection: isMe ? "row-reverse" : "row" }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6, flexShrink: 0,
              background: isMe ? C.bgCyanSub : "rgba(255,255,255,0.06)",
              border: `1px solid ${isMe ? C.borderCyan : C.borderFaint}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, color: isMe ? C.cyan : C.textMuted, fontWeight: 800,
            }}>
              {(msg.senderName ?? "?")[0]?.toUpperCase()}
            </div>
            <div style={{ maxWidth: "78%" }}>
              <div style={{ fontSize: 9, color: C.textMuted, marginBottom: 2, textAlign: isMe ? "right" : "left" }}>
                {isMe ? "tú" : msg.senderName} · {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div style={{
                padding: "6px 10px",
                borderRadius: isMe ? "10px 3px 10px 10px" : "3px 10px 10px 10px",
                background: isMe ? "rgba(0,212,255,0.1)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${isMe ? "rgba(0,212,255,0.18)" : "rgba(255,255,255,0.06)"}`,
                fontSize: 12, color: C.textPrimary, wordBreak: "break-word",
                lineHeight: 1.45,
              }}>
                {msg.content}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

export default function ChatPanel() {
  const { user } = useAuthStore();
  const { activeRoom, activeRoomType, setActiveRoom, loadHistory, sendMessage } = useChatStore();
  const [input, setInput] = useState("");

  const [tab, setTab] = useState<"global" | "clan" | "dm">("global");

  const [dmSearch, setDmSearch] = useState("");
  const [dmResults, setDmResults] = useState<PlayerResult[]>([]);
  const [dmPartner, setDmPartner] = useState<PlayerResult | null>(null);
  const [dmSearching, setDmSearching] = useState(false);

  const hasClan = !!(user?.clan_id);

  // Note: the chat:message socket subscription is handled globally in useGameSync
  // so messages are received even when this panel is closed (unread counter works).

  useEffect(() => {
    if (tab === "global") {
      setActiveRoom("global", "global");
      loadHistory("global", "global");
    } else if (tab === "clan" && user?.clan_id) {
      setActiveRoom(user.clan_id, "clan");
      loadHistory(user.clan_id, "clan");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleDmSearch = useCallback(async (q: string) => {
    setDmSearch(q);
    if (q.length < 2) { setDmResults([]); return; }
    setDmSearching(true);
    try {
      const res = await api.get(`/leaderboard/search?q=${encodeURIComponent(q)}`);
      setDmResults(res.data.filter((p: PlayerResult) => p.id !== user?.id).slice(0, 8));
    } catch {
      setDmResults([]);
    } finally {
      setDmSearching(false);
    }
  }, [user?.id]);

  const openDm = (partner: PlayerResult) => {
    setDmPartner(partner);
    const dmRoomId = [user!.id, partner.id].sort().join(":");
    setActiveRoom(dmRoomId, "dm");
    loadHistory(dmRoomId, "dm", partner.id);
    setDmSearch("");
    setDmResults([]);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    if (tab === "dm" && dmPartner) {
      sendMessage(text, dmPartner.id);
    } else {
      sendMessage(text);
    }
    setInput("");
  };

  const tabActive  = { background: "rgba(0,212,255,0.12)", color: C.cyan };
  const tabInactive = { background: "transparent", color: C.textMuted };
  const tabBase: React.CSSProperties = {
    flex: 1, padding: "7px 4px", borderRadius: 7, cursor: "pointer",
    border: "none", fontFamily: C.font, fontWeight: 700,
    fontSize: 10, letterSpacing: 0.5, transition: "all 0.15s",
  };

  const currentRoomId = tab === "global" ? "global"
    : tab === "clan" ? (user?.clan_id ?? "")
    : dmPartner ? [user!.id, dmPartner.id].sort().join(":") : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", color: C.textPrimary, background: "#0b0f1e" }}>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 3, padding: "8px 8px 4px",
        borderBottom: `1px solid ${C.borderFaint}`,
        background: "rgba(255,255,255,0.015)",
        flexShrink: 0,
      }}>
        <button style={{ ...tabBase, ...(tab === "global" ? tabActive : tabInactive) }} onClick={() => setTab("global")}>🌐 Global</button>
        {hasClan && (
          <button style={{ ...tabBase, ...(tab === "clan" ? tabActive : tabInactive) }} onClick={() => setTab("clan")}>
            🏴 {user?.clan_tag ?? "Clan"}
          </button>
        )}
        <button style={{ ...tabBase, ...(tab === "dm" ? tabActive : tabInactive) }} onClick={() => setTab("dm")}>
          💬 DMs
        </button>
      </div>

      {/* DM: player search */}
      {tab === "dm" && (
        <div style={{ flexShrink: 0, padding: "8px 10px", borderBottom: `1px solid ${C.borderFaint}` }}>
          {dmPartner && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6, marginBottom: 6,
              padding: "5px 8px", borderRadius: 8,
              background: "rgba(0,212,255,0.07)", border: `1px solid ${C.borderCyan}`,
            }}>
              <div style={{ flex: 1, fontSize: 11, fontWeight: 700, color: C.cyan }}>
                💬 {dmPartner.username}
                {dmPartner.clan_tag && <span style={{ color: C.textMuted, marginLeft: 4, fontWeight: 400 }}>[{dmPartner.clan_tag}]</span>}
              </div>
              <button
                onClick={() => setDmPartner(null)}
                style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 14 }}
              >✕</button>
            </div>
          )}
          <div style={{ position: "relative" }}>
            <input
              value={dmSearch}
              onChange={e => handleDmSearch(e.target.value)}
              placeholder="🔍 Buscar jugador para DM..."
              style={{
                width: "100%", padding: "7px 10px", borderRadius: 8, boxSizing: "border-box",
                background: C.bg04, border: `1px solid ${C.borderFaint}`,
                color: C.textPrimary, fontSize: 11, fontFamily: C.font, outline: "none",
              }}
            />
            {dmSearching && (
              <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: C.textMuted }}>...</div>
            )}
          </div>
          {dmResults.length > 0 && (
            <div style={{ marginTop: 4, background: "rgba(9,12,24,0.97)", border: `1px solid ${C.borderMuted}`, borderRadius: 8, overflow: "hidden" }}>
              {dmResults.map(p => (
                <button
                  key={p.id}
                  onClick={() => openDm(p)}
                  style={{
                    width: "100%", padding: "7px 10px", display: "flex", alignItems: "center", gap: 8,
                    background: "transparent", border: "none", borderBottom: `1px solid ${C.borderFaint}`,
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: 5,
                    background: C.bgCyanSub, border: `1px solid ${C.borderCyan}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, color: C.cyan, fontWeight: 800, flexShrink: 0,
                  }}>
                    {p.username[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.textPrimary }}>{p.username}</span>
                    {p.clan_tag && <span style={{ fontSize: 9, color: C.textMuted, marginLeft: 5 }}>[{p.clan_tag}]</span>}
                  </div>
                  <div style={{ fontSize: 9, color: C.textMuted }}>→ DM</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      {currentRoomId ? (
        <MessageList roomId={currentRoomId} userId={user?.id ?? ""} />
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: 11, fontStyle: "italic" }}>
          {tab === "dm" ? "Busca un jugador para iniciar un DM" : "Cargando..."}
        </div>
      )}

      {/* Input */}
      {(tab !== "dm" || dmPartner) && (
        <form onSubmit={handleSend} style={{
          display: "flex", gap: 6, padding: "8px 10px",
          borderTop: `1px solid ${C.borderFaint}`, flexShrink: 0,
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={tab === "dm" && dmPartner ? `Mensaje a ${dmPartner.username}...` : "Mensaje..."}
            maxLength={500}
            style={{
              flex: 1, padding: "8px 12px", borderRadius: 8,
              background: C.bg04, border: `1px solid ${C.borderFaint}`,
              color: C.textPrimary, fontSize: 12, fontFamily: C.font, outline: "none",
            }}
          />
          <button type="submit" style={{
            padding: "8px 13px", borderRadius: 8, cursor: "pointer",
            background: C.bgCyanSub, border: `1px solid ${C.borderCyan}`,
            color: C.cyan, fontFamily: C.font, fontWeight: 700, fontSize: 13,
          }}>➤</button>
        </form>
      )}
    </div>
  );
}
