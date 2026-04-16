import { useState, useEffect, useCallback } from "react";
import api from "../lib/api";
import { formatNumber } from "../stores/gameStore";
import { useAuthStore } from "../stores/authStore";

// ── Types ─────────────────────────────────────────────────────────
interface WealthEntry {
  rank: number;
  user_id: string;
  username: string;
  net_worth: string;
  clan_tag?: string;
}
interface InfluenceEntry {
  rank: number;
  user_id: string;
  username: string;
  influence: string;
  clan_tag?: string;
}
interface ClanEntry {
  rank: number;
  clan_id: string;
  clan_name: string;
  total_wealth: string;
  clan_tag?: string;
}
interface PlayerSearchResult {
  id: string;
  username: string;
  character_id?: string;
  net_worth?: string;
  influence?: string;
  prestige_level?: number;
  current_day?: number;
  clan_name?: string;
  clan_tag?: string;
  clan_color?: string;
}

// ── Shared medal helper ───────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span style={{ fontSize: 15 }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize: 15 }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize: 15 }}>🥉</span>;
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, color: "var(--text-muted)",
      minWidth: 22, textAlign: "center", display: "inline-block",
    }}>
      #{rank}
    </span>
  );
}

// ── Row styles ───────────────────────────────────────────────────
function rowStyle(highlight: boolean): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 14px", borderRadius: 9,
    background: highlight ? "rgba(0,212,255,0.06)" : "rgba(255,255,255,0.02)",
    border: `1px solid ${highlight ? "rgba(0,212,255,0.15)" : "rgba(255,255,255,0.04)"}`,
    marginBottom: 5, transition: "all 0.1s",
  };
}

function Avatar({ name, color }: { name: string; color?: string }) {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 7, flexShrink: 0,
      background: color ? `${color}22` : "rgba(0,212,255,0.1)",
      border: `1px solid ${color ?? "var(--border-cyan)"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, color: color ?? "var(--cyan)", fontWeight: 800,
    }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

// ── Wealth Leaderboard ────────────────────────────────────────────
function WealthTab({ myId }: { myId?: string }) {
  const [data, setData] = useState<WealthEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/leaderboard/wealth"),
      api.get("/leaderboard/me"),
    ]).then(([r1, r2]) => {
      setData(r1.data);
      setMyRank(r2.data.wealthRank ?? null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      {myRank != null && (
        <div style={{
          marginBottom: 12, padding: "8px 14px", borderRadius: 9,
          background: "rgba(0,212,255,0.07)", border: "1px solid var(--border-cyan)",
          fontSize: 11, color: "var(--cyan)", fontWeight: 700,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span>📊</span> Tu posición en riqueza: <strong>#{myRank}</strong>
        </div>
      )}
      {data.map(row => (
        <div key={row.user_id} style={rowStyle(row.user_id === myId)}>
          <RankBadge rank={row.rank} />
          <Avatar name={row.username} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: row.user_id === myId ? "var(--cyan)" : "var(--text-primary)" }}>
              {row.username}
              {row.user_id === myId && <span style={{ fontSize: 9, color: "var(--cyan)", marginLeft: 5 }}>TÚ</span>}
            </div>
            {row.clan_tag && (
              <div style={{ fontSize: 9, color: "var(--text-muted)" }}>[{row.clan_tag}]</div>
            )}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--gold)" }}>
              Đ {formatNumber(parseFloat(row.net_worth))}
            </div>
            <div style={{ fontSize: 9, color: "var(--text-muted)" }}>net worth</div>
          </div>
        </div>
      ))}
      {data.length === 0 && <EmptyState text="Sin datos de riqueza aún" />}
    </div>
  );
}

// ── Influence Leaderboard ─────────────────────────────────────────
function InfluenceTab({ myId }: { myId?: string }) {
  const [data, setData] = useState<InfluenceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/leaderboard/influence"),
      api.get("/leaderboard/me"),
    ]).then(([r1, r2]) => {
      setData(r1.data);
      setMyRank(r2.data.influenceRank ?? null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      {myRank != null && (
        <div style={{
          marginBottom: 12, padding: "8px 14px", borderRadius: 9,
          background: "rgba(180,79,255,0.07)", border: "1px solid rgba(180,79,255,0.25)",
          fontSize: 11, color: "var(--purple)", fontWeight: 700,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span>◆</span> Tu posición en influencia: <strong>#{myRank}</strong>
        </div>
      )}
      {data.map(row => (
        <div key={row.user_id} style={rowStyle(row.user_id === myId)}>
          <RankBadge rank={row.rank} />
          <Avatar name={row.username} color="var(--purple)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: row.user_id === myId ? "var(--cyan)" : "var(--text-primary)" }}>
              {row.username}
              {row.user_id === myId && <span style={{ fontSize: 9, color: "var(--cyan)", marginLeft: 5 }}>TÚ</span>}
            </div>
            {row.clan_tag && (
              <div style={{ fontSize: 9, color: "var(--text-muted)" }}>[{row.clan_tag}]</div>
            )}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--purple)" }}>
              ◆ {formatNumber(parseInt(row.influence))}
            </div>
            <div style={{ fontSize: 9, color: "var(--text-muted)" }}>influencia</div>
          </div>
        </div>
      ))}
      {data.length === 0 && <EmptyState text="Sin datos de influencia aún" />}
    </div>
  );
}

// ── Clans Leaderboard ─────────────────────────────────────────────
function ClansTab() {
  const [data, setData] = useState<ClanEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/leaderboard/clans")
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      {data.map(row => (
        <div key={row.clan_id} style={rowStyle(false)}>
          <RankBadge rank={row.rank} />
          <div style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14,
          }}>
            🏴
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
              {row.clan_name}
            </div>
            {row.clan_tag && (
              <div style={{ fontSize: 9, color: "var(--text-muted)" }}>[{row.clan_tag}]</div>
            )}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--green)" }}>
              Đ {formatNumber(parseFloat(row.total_wealth))}
            </div>
            <div style={{ fontSize: 9, color: "var(--text-muted)" }}>riqueza total</div>
          </div>
        </div>
      ))}
      {data.length === 0 && <EmptyState text="Sin clanes registrados aún" />}
    </div>
  );
}

// ── Player Search ─────────────────────────────────────────────────
function PlayerSearchTab({ myId }: { myId?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get(`/leaderboard/search?q=${encodeURIComponent(q)}`);
      setResults(res.data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const CHAR_ICONS: Record<string, string> = {
    hacker: "👤", trader: "💹", industrialist: "🏭", diplomat: "🤝",
  };

  return (
    <div>
      {/* Search input */}
      <div style={{ position: "relative", marginBottom: 14 }}>
        <input
          value={query}
          onChange={e => search(e.target.value)}
          placeholder="🔍 Buscar jugador por nombre..."
          style={{
            width: "100%", padding: "11px 14px", borderRadius: 10,
            boxSizing: "border-box",
            background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-muted)",
            color: "var(--text-primary)", fontSize: 13, fontFamily: "var(--font-main)", outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={e => (e.target.style.borderColor = "var(--border-cyan)")}
          onBlur={e => (e.target.style.borderColor = "var(--border-muted)")}
        />
        {loading && (
          <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--text-muted)" }}>
            ···
          </div>
        )}
      </div>

      {/* Results */}
      {results.map(p => (
        <div key={p.id} style={{
          ...rowStyle(p.id === myId),
          flexDirection: "column", alignItems: "stretch",
        }}>
          {/* Top row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar name={p.username} color={p.clan_color} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: p.id === myId ? "var(--cyan)" : "var(--text-primary)" }}>
                {CHAR_ICONS[p.character_id ?? ""] ?? "👤"} {p.username}
                {p.id === myId && <span style={{ fontSize: 9, color: "var(--cyan)", marginLeft: 5 }}>TÚ</span>}
              </div>
              {p.clan_name && (
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  🏴 {p.clan_name}
                  {p.clan_tag && <span style={{ marginLeft: 4 }}>[{p.clan_tag}]</span>}
                </div>
              )}
            </div>
            {(p.prestige_level ?? 0) > 0 && (
              <div style={{
                padding: "2px 7px", borderRadius: 5,
                background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)",
                fontSize: 9, color: "var(--gold)", fontWeight: 800,
              }}>
                ★ P{p.prestige_level}
              </div>
            )}
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 16, marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 2 }}>NET WORTH</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)" }}>
                Đ {p.net_worth ? formatNumber(parseFloat(p.net_worth)) : "—"}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 2 }}>INFLUENCIA</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--purple)" }}>
                ◆ {p.influence ? formatNumber(parseInt(p.influence)) : "—"}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 2 }}>DÍA EN JUEGO</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>
                {p.current_day ? `Día ${p.current_day}` : "—"}
              </div>
            </div>
          </div>
        </div>
      ))}

      {searched && !loading && results.length === 0 && query.length >= 2 && (
        <EmptyState text={`Sin resultados para "${query}"`} />
      )}
      {!searched && (
        <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12, paddingTop: 32, fontStyle: "italic" }}>
          Escribe al menos 2 caracteres para buscar
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 12 }}>
      Cargando...
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 12, fontStyle: "italic" }}>
      {text}
    </div>
  );
}

// ── Main View ─────────────────────────────────────────────────────
type Tab = "wealth" | "influence" | "clans" | "players";

export default function SearchView() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("wealth");

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: "wealth",    icon: "💰", label: "Riqueza" },
    { id: "influence", icon: "◆",  label: "Influencia" },
    { id: "clans",     icon: "🏴", label: "Clanes" },
    { id: "players",   icon: "🔍", label: "Jugadores" },
  ];

  const tabBtn = (id: Tab): React.CSSProperties => ({
    flex: 1, padding: "9px 6px", borderRadius: 8, cursor: "pointer",
    border: `1px solid ${tab === id ? "var(--border-cyan)" : "var(--border-faint)"}`,
    fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 11,
    letterSpacing: 0.4, transition: "all 0.15s",
    background: tab === id ? "rgba(0,212,255,0.08)" : "transparent",
    color: tab === id ? "var(--cyan)" : "var(--text-muted)",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
  });

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 17, fontWeight: 900, letterSpacing: 0.5, marginBottom: 4 }}>
          Clasificaciones & Búsqueda
        </h2>
        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Consulta los rankings globales y busca jugadores o clanes
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 5, marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t.id} style={tabBtn(t.id)} onClick={() => setTab(t.id)}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {tab === "wealth"    && <WealthTab myId={user?.id} />}
        {tab === "influence" && <InfluenceTab myId={user?.id} />}
        {tab === "clans"     && <ClansTab />}
        {tab === "players"   && <PlayerSearchTab myId={user?.id} />}
      </div>
    </div>
  );
}
