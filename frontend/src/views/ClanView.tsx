import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "../stores/authStore";
import api from "../lib/api";
import { formatNumber } from "../stores/gameStore";

interface ClanMember {
  userId: string;
  username: string;
  role: string;
  contribution: number;
}

interface ClanData {
  id: string;
  name: string;
  tag: string;
  color: string;
  description: string;
  chest_credits: number;
  total_wealth: number;
  member_count: number;
  war_wins: number;
  leader_name: string;
  role?: string;
  members?: ClanMember[];
}

export default function ClanView() {
  const { user, fetchMe } = useAuthStore();
  const [clan, setClan] = useState<ClanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<ClanData[]>([]);
  const [tab, setTab] = useState<"my" | "ranking" | "create" | "browse">("my");

  // Create clan form
  const [createName, setCreateName] = useState("");
  const [createTag, setCreateTag] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createColor, setCreateColor] = useState("#00d4ff");
  const [createErr, setCreateErr] = useState("");

  // Contribute form
  const [contribAmount, setContribAmount] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [myRes, rankRes] = await Promise.all([
        api.get("/clans/my").catch(() => ({ data: null })),
        api.get("/clans/ranking"),
      ]);
      setClan(myRes.data);
      setRanking(rankRes.data);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateErr("");
    try {
      await api.post("/clans", {
        name: createName, tag: createTag.toUpperCase(),
        description: createDesc, color: createColor,
      });
      await loadData();
      await fetchMe();
      setTab("my");
    } catch (err: any) {
      setCreateErr(err.response?.data?.error ?? "Error al crear clan");
    }
  };

  const handleJoin = async (clanId: string) => {
    try {
      await api.post(`/clans/${clanId}/join`);
      await loadData();
      await fetchMe();
      setTab("my");
    } catch (err: any) {
      alert(err.response?.data?.error ?? "Error al unirse");
    }
  };

  const handleLeave = async () => {
    if (!clan || !confirm("¿Seguro que quieres abandonar el clan?")) return;
    try {
      await api.post(`/clans/${clan.id}/leave`);
      setClan(null);
      await fetchMe();
    } catch (err: any) {
      alert(err.response?.data?.error ?? "Error al salir");
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clan) return;
    try {
      await api.post(`/clans/${clan.id}/contribute`, { amount: parseFloat(contribAmount) });
      setContribAmount("");
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error ?? "Error al contribuir");
    }
  };

  const tabStyle = (t: string): React.CSSProperties => ({
    padding: "8px 16px", borderRadius: 8, cursor: "pointer", border: "none",
    fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 11, letterSpacing: 0.5,
    background: tab === t ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.03)",
    color: tab === t ? "var(--cyan)" : "var(--text-muted)",
    borderBottom: tab === t ? "2px solid var(--cyan)" : "2px solid transparent",
    transition: "all 0.15s",
  });

  if (loading) return <div style={{ color: "var(--text-muted)", textAlign: "center", paddingTop: 40 }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid var(--border-faint)", paddingBottom: 4 }}>
        <button style={tabStyle("my")} onClick={() => setTab("my")}>🏴 Mi Clan</button>
        <button style={tabStyle("ranking")} onClick={() => setTab("ranking")}>🏆 Ranking</button>
        {!clan && <button style={tabStyle("browse")} onClick={() => setTab("browse")}>🔍 Buscar</button>}
        {!clan && <button style={tabStyle("create")} onClick={() => setTab("create")}>➕ Crear</button>}
      </div>

      {/* My Clan */}
      {tab === "my" && (
        clan ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
            {/* Clan info */}
            <div>
              <div style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-faint)",
                borderRadius: 14, padding: 24, marginBottom: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                    background: clan.color, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 20, fontWeight: 900,
                    color: "#000", boxShadow: `0 0 20px ${clan.color}44`,
                  }}>
                    [{clan.tag}]
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: clan.color }}>{clan.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{clan.description}</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                  {[
                    { label: "PATRIMONIO", value: `Đ ${formatNumber(clan.total_wealth)}` },
                    { label: "COFRE", value: `Đ ${formatNumber(clan.chest_credits)}` },
                    { label: "MIEMBROS", value: `${clan.member_count}` },
                    { label: "GUERRAS", value: `${clan.war_wins}W` },
                  ].map(s => (
                    <div key={s.label} style={{
                      background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px",
                      border: "1px solid var(--border-faint)",
                    }}>
                      <div style={{ fontSize: 8, color: "var(--text-muted)", letterSpacing: 1.5, fontWeight: 700 }}>{s.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", marginTop: 2 }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Contribute */}
                <form onSubmit={handleContribute} style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <input
                    type="number" value={contribAmount} onChange={e => setContribAmount(e.target.value)}
                    placeholder="Contribuir al cofre (Đ)"
                    style={{
                      flex: 1, padding: "9px 12px", borderRadius: 8,
                      background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-faint)",
                      color: "var(--text-primary)", fontSize: 12, fontFamily: "var(--font-main)", outline: "none",
                    }}
                  />
                  <button type="submit" style={{
                    padding: "9px 16px", borderRadius: 8, cursor: "pointer",
                    background: "rgba(0,212,255,0.12)", border: "1px solid var(--border-cyan)",
                    color: "var(--cyan)", fontWeight: 700, fontFamily: "var(--font-main)", fontSize: 12,
                  }}>Contribuir</button>
                </form>
              </div>

              {/* Members */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-faint)", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: 1.5, fontWeight: 700, marginBottom: 12 }}>MIEMBROS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(clan.members ?? []).map(m => (
                    <div key={m.userId} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.02)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: 5, background: "rgba(0,212,255,0.1)",
                          border: "1px solid var(--border-cyan)", display: "flex", alignItems: "center",
                          justifyContent: "center", fontSize: 11, color: "var(--cyan)", fontWeight: 700,
                        }}>{m.username[0]?.toUpperCase()}</div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{m.username}</span>
                        {m.role !== "member" && (
                          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(0,212,255,0.12)", color: "var(--cyan)", fontWeight: 700 }}>
                            {m.role.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Đ {formatNumber(m.contribution)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-faint)", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: 1.5, fontWeight: 700, marginBottom: 8 }}>TU ROL</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--cyan)" }}>{(clan.role ?? "member").toUpperCase()}</div>
              </div>

              {clan.role !== "leader" && (
                <button onClick={handleLeave} style={{
                  padding: "10px", borderRadius: 8, cursor: "pointer",
                  background: "rgba(255,45,85,0.08)", border: "1px solid rgba(255,45,85,0.25)",
                  color: "var(--red)", fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 12,
                }}>
                  Abandonar Clan
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏴</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Sin clan</div>
            <div style={{ fontSize: 12 }}>Únete a un clan existente o crea el tuyo propio.</div>
          </div>
        )
      )}

      {/* Ranking */}
      {tab === "ranking" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ranking.map((c, i) => (
            <motion.div key={c.id}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "14px 18px", borderRadius: 12,
                background: i < 3 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${i < 3 ? "rgba(0,212,255,0.12)" : "var(--border-faint)"}`,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 900, color: i < 3 ? "var(--gold)" : "var(--text-muted)", width: 28 }}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: c.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, fontSize: 11, color: "#000",
              }}>[{c.tag}]</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: c.color }}>{c.name}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{c.member_count} miembros</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--cyan)" }}>Đ {formatNumber(c.total_wealth)}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>patrimonio total</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Browse */}
      {tab === "browse" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ranking.map(c => (
            <div key={c.id} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
              borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-faint)",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: c.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, fontSize: 11, color: "#000", flexShrink: 0,
              }}>[{c.tag}]</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.description ?? "Sin descripción"}</div>
              </div>
              <div style={{ textAlign: "right", marginRight: 12 }}>
                <div style={{ fontSize: 12, color: "var(--cyan)" }}>Đ {formatNumber(c.total_wealth)}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{c.member_count} miembros</div>
              </div>
              <button onClick={() => handleJoin(c.id)} style={{
                padding: "8px 14px", borderRadius: 8, cursor: "pointer",
                background: "rgba(0,212,255,0.1)", border: "1px solid var(--border-cyan)",
                color: "var(--cyan)", fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 11,
              }}>Unirse</button>
            </div>
          ))}
        </div>
      )}

      {/* Create */}
      {tab === "create" && (
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 1.5, fontWeight: 700, display: "block", marginBottom: 6 }}>NOMBRE DEL CLAN (3-50 chars)</label>
              <input value={createName} onChange={e => setCreateName(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-faint)", color: "var(--text-primary)", fontSize: 13, fontFamily: "var(--font-main)", outline: "none", boxSizing: "border-box" }}
                required minLength={3} maxLength={50}
              />
            </div>
            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 1.5, fontWeight: 700, display: "block", marginBottom: 6 }}>TAG (2-6 mayúsculas)</label>
              <input value={createTag} onChange={e => setCreateTag(e.target.value.toUpperCase())}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-faint)", color: "var(--text-primary)", fontSize: 13, fontFamily: "var(--font-main)", outline: "none", boxSizing: "border-box" }}
                required minLength={2} maxLength={6} pattern="[A-Z0-9]{2,6}"
              />
            </div>
            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 1.5, fontWeight: 700, display: "block", marginBottom: 6 }}>DESCRIPCIÓN</label>
              <textarea value={createDesc} onChange={e => setCreateDesc(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-faint)", color: "var(--text-primary)", fontSize: 13, fontFamily: "var(--font-main)", outline: "none", resize: "vertical", minHeight: 80, boxSizing: "border-box" }}
                maxLength={500}
              />
            </div>
            <div>
              <label style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 1.5, fontWeight: 700, display: "block", marginBottom: 6 }}>COLOR</label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input type="color" value={createColor} onChange={e => setCreateColor(e.target.value)}
                  style={{ width: 40, height: 40, borderRadius: 8, border: "1px solid var(--border-faint)", background: "none", cursor: "pointer" }}
                />
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{createColor}</span>
              </div>
            </div>
            {createErr && (
              <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,45,85,0.1)", border: "1px solid rgba(255,45,85,0.25)", color: "var(--red)", fontSize: 12 }}>
                {createErr}
              </div>
            )}
            <button type="submit" style={{
              padding: "12px", borderRadius: 10, cursor: "pointer",
              background: "linear-gradient(135deg, var(--cyan), var(--purple))",
              border: "none", color: "#fff", fontWeight: 800, fontFamily: "var(--font-main)", fontSize: 13,
            }}>
              CREAR CLAN
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
