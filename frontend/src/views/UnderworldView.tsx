// ============================================================
// NEXUS: Underworld View — server-authoritative content module.
// Tabs: Crímenes · Gimnasio · Inventario · Perfil
// All gameplay state comes from the backend.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  useUnderworldStore,
  getLiveNerve,
  getLiveEnergy,
  xpProgress,
  NERVE_MAX,
  ENERGY_MAX,
  type UnderworldSnapshot,
} from "../stores/underworldStore";
import { CRIMES, ITEMS, STAT_LABELS, TIER_LABELS, type Stat } from "../core/underworld/data";

// ── helpers ───────────────────────────────────────────────
function fmtTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${mm}m`;
}

function Bar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = (value / max) * 100;
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 3, color: "var(--text-muted)", letterSpacing: 1 }}>
        <span>{label}</span>
        <span style={{ color }}>{Math.floor(value)} / {max}</span>
      </div>
      <div style={{ height: 7, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}`, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────
function UnderworldHeader({ snap }: { snap: UnderworldSnapshot }) {
  const nerve = getLiveNerve(snap);
  const energy = getLiveEnergy(snap);
  const { level, current, needed, pct } = xpProgress(snap.xp);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1.2fr",
      gap: 14,
      padding: "12px 14px",
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12,
      marginBottom: 14,
    }}>
      <Bar value={nerve}  max={NERVE_MAX}  color="#f43f5e" label="NERVIO" />
      <Bar value={energy} max={ENERGY_MAX} color="#22d3ee" label="ENERGÍA" />
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 3, color: "var(--text-muted)", letterSpacing: 1 }}>
          <span>NIVEL {level}</span>
          <span style={{ color: "#a78bfa" }}>{current.toLocaleString()} / {needed.toLocaleString()} XP</span>
        </div>
        <div style={{ height: 7, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct * 100}%`, background: "#a78bfa", boxShadow: "0 0 8px #a78bfa", transition: "width 0.4s" }} />
        </div>
      </div>
    </div>
  );
}

// ── Jail banner ───────────────────────────────────────────
function JailBanner({ jailUntil }: { jailUntil: number | null }) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!jailUntil) return;
    const id = setInterval(() => tick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [jailUntil]);
  if (!jailUntil || jailUntil <= Date.now()) return null;
  const remaining = Math.ceil((jailUntil - Date.now()) / 1000);
  return (
    <div style={{
      padding: "10px 14px",
      background: "rgba(244,63,94,0.12)",
      border: "1px solid rgba(244,63,94,0.35)",
      borderRadius: 10,
      color: "#f43f5e",
      fontWeight: 700,
      fontSize: 12,
      marginBottom: 12,
      display: "flex",
      gap: 10,
      alignItems: "center",
    }}>
      <span style={{ fontSize: 18 }}>🚔</span>
      <span style={{ flex: 1 }}>Estás en la cárcel. No puedes cometer crímenes ni entrenar.</span>
      <span style={{ fontFamily: "monospace", fontSize: 14 }}>⏱ {fmtTime(remaining)}</span>
    </div>
  );
}

// ── Crimes tab ────────────────────────────────────────────
function CrimesTab({ snap }: { snap: UnderworldSnapshot }) {
  const [filter, setFilter] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const commit = useUnderworldStore((s) => s.commitCrime);
  const inFlight = useUnderworldStore((s) => s.inFlight);

  const level = snap.level;
  const eff = snap.effectiveStats;
  const liveNerve = getLiveNerve(snap);

  const filtered = useMemo(
    () => (filter === 0 ? CRIMES : CRIMES.filter((c) => c.tier === filter)),
    [filter]
  );

  const run = async (crimeId: string) => {
    const res = await commit(crimeId);
    if (!res) return;
    if (res.kind === "blocked") {
      toast.error(res.reason, { duration: 2500 });
    } else if (res.kind === "failure") {
      toast.error(`❌ Capturado. Cárcel: ${fmtTime(res.jailSeconds)}`, { duration: 3500 });
    } else {
      toast.success(
        `✔️ +Đ${res.credits.toLocaleString()} · +${res.xp} XP${res.item ? ` · 🎁 ${ITEMS[res.item].name}` : ""}`,
        { duration: 3000, style: { background: "#0b1020", color: "#22d3ee", border: "1px solid rgba(0,212,255,0.3)" } }
      );
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 5, marginBottom: 12, flexWrap: "wrap" }}>
        {[0, 1, 2, 3, 4, 5].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t as any)}
            style={{
              padding: "6px 12px", borderRadius: 7, cursor: "pointer", fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
              border: `1px solid ${filter === t ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.08)"}`,
              background: filter === t ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.03)",
              color: filter === t ? "#00d4ff" : "var(--text-muted)",
              fontFamily: "var(--font-main)",
            }}
          >
            {t === 0 ? "TODOS" : TIER_LABELS[t].label.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
        {filtered.map((crime) => {
          const locked =
            level < crime.requiredLevel ||
            (crime.requiredStat && eff[crime.requiredStat.stat] < crime.requiredStat.value);
          const nerveInsufficient = liveNerve < crime.nerveCost;
          const tier = TIER_LABELS[crime.tier];
          const successRate = Math.round(crime.baseSuccessRate * 100);
          return (
            <motion.div
              key={crime.id}
              whileHover={{ y: -2 }}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${locked ? "rgba(255,255,255,0.06)" : tier.color + "40"}`,
                borderRadius: 10, padding: 12,
                opacity: locked ? 0.55 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ fontSize: 24 }}>{crime.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)" }}>{crime.name}</div>
                  <div style={{ fontSize: 9, color: tier.color, letterSpacing: 1, fontWeight: 700 }}>
                    {tier.label.toUpperCase()} · {successRate}% éxito
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: 10 }}>
                  <div style={{ color: "#f43f5e", fontWeight: 700 }}>⚡ {crime.nerveCost}</div>
                  <div style={{ color: "var(--text-muted)" }}>+{crime.xpReward} xp</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, lineHeight: 1.4 }}>
                {crime.description}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, marginBottom: 8 }}>
                <span style={{ color: "#22d3ee" }}>
                  Đ {crime.minCredits.toLocaleString()} – {crime.maxCredits.toLocaleString()}
                </span>
                <span style={{ color: "var(--text-muted)" }}>
                  Cárcel: {fmtTime(crime.jailTimeOnFail)}
                </span>
              </div>
              {crime.requiredStat && (
                <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 6 }}>
                  Requiere {STAT_LABELS[crime.requiredStat.stat].icon} {crime.requiredStat.value}+ ·
                  tienes {Math.floor(eff[crime.requiredStat.stat])}
                </div>
              )}
              <button
                disabled={!!locked || nerveInsufficient || inFlight}
                onClick={() => run(crime.id)}
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: 7,
                  cursor: locked || nerveInsufficient || inFlight ? "not-allowed" : "pointer",
                  border: `1px solid ${locked ? "rgba(255,255,255,0.06)" : "rgba(244,63,94,0.3)"}`,
                  background: locked ? "rgba(255,255,255,0.03)" : "rgba(244,63,94,0.1)",
                  color: locked ? "var(--text-muted)" : "#f43f5e",
                  fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                  fontFamily: "var(--font-main)",
                }}
              >
                {locked ? `🔒 Nivel ${crime.requiredLevel}` : nerveInsufficient ? "Sin nervio" : inFlight ? "..." : "▶ EJECUTAR"}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Gym tab ───────────────────────────────────────────────
function GymTab({ snap }: { snap: UnderworldSnapshot }) {
  const train = useUnderworldStore((s) => s.trainStat);
  const inFlight = useUnderworldStore((s) => s.inFlight);
  const [energyAmt, setEnergyAmt] = useState(10);
  const curEnergy = getLiveEnergy(snap);

  const handleTrain = async (stat: Stat) => {
    const res = await train(stat, energyAmt);
    if (!res) return;
    if (res.kind === "blocked") { toast.error(res.reason); return; }
    toast.success(`${STAT_LABELS[stat].icon} +${res.gained.toFixed(2)} ${STAT_LABELS[stat].label}`);
  };

  const options = [5, 10, 25, 50];

  return (
    <div>
      <div style={{
        background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.2)",
        borderRadius: 10, padding: "10px 14px", marginBottom: 12,
        fontSize: 11, color: "#a9b6cc", lineHeight: 1.5,
      }}>
        Entrenar consume <strong style={{ color: "#22d3ee" }}>energía</strong> y sube tus estadísticas permanentemente.
        Las ganancias tienen rendimientos decrecientes: cuanto más alta la estadística, menos ganas por sesión.
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 1 }}>ENERGÍA POR SESIÓN:</span>
        {options.map((v) => (
          <button
            key={v}
            onClick={() => setEnergyAmt(v)}
            style={{
              padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 800,
              border: `1px solid ${energyAmt === v ? "rgba(34,211,238,0.4)" : "rgba(255,255,255,0.08)"}`,
              background: energyAmt === v ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.03)",
              color: energyAmt === v ? "#22d3ee" : "var(--text-muted)",
              fontFamily: "var(--font-main)",
            }}
          >{v}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
        {(Object.keys(STAT_LABELS) as Stat[]).map((stat) => {
          const meta = STAT_LABELS[stat];
          const base = snap.stats[stat];
          const eff = snap.effectiveStats[stat];
          const buffed = eff !== base;
          return (
            <div key={stat} style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10, padding: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 28 }}>{meta.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: 1, fontWeight: 700 }}>
                    {meta.label.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: buffed ? "#a78bfa" : "var(--text-primary)" }}>
                    {eff.toFixed(1)}
                    {buffed && <span style={{ fontSize: 11, marginLeft: 6, color: "#a78bfa" }}>
                      ({base.toFixed(1)} +{(eff - base).toFixed(0)})
                    </span>}
                  </div>
                </div>
              </div>
              <button
                disabled={curEnergy < energyAmt || inFlight}
                onClick={() => handleTrain(stat)}
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: 7,
                  cursor: curEnergy < energyAmt || inFlight ? "not-allowed" : "pointer",
                  border: "1px solid rgba(34,211,238,0.3)",
                  background: curEnergy < energyAmt ? "rgba(255,255,255,0.03)" : "rgba(34,211,238,0.1)",
                  color: curEnergy < energyAmt ? "var(--text-muted)" : "#22d3ee",
                  fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                  fontFamily: "var(--font-main)",
                }}
              >
                🏋 Entrenar ({energyAmt} energía)
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Inventory tab ─────────────────────────────────────────
function InventoryTab({ snap }: { snap: UnderworldSnapshot }) {
  const use = useUnderworldStore((s) => s.useItem);
  const sell = useUnderworldStore((s) => s.sellItem);
  const inFlight = useUnderworldStore((s) => s.inFlight);

  const entries = Object.entries(snap.inventory).filter(([, qty]) => qty > 0);

  const handleUse = async (id: string) => {
    const res = await use(id);
    if (!res) return;
    if (res.kind === "ok") toast.success(res.message, { duration: 3500 });
    else toast.error(res.reason);
  };
  const handleSell = async (id: string) => {
    const res = await sell(id);
    if (!res) return;
    if (res.kind === "ok") toast.success(`Vendido por Đ${res.received.toLocaleString()}`);
    else toast.error(res.reason);
  };

  if (entries.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13, fontStyle: "italic" }}>
        Tu inventario está vacío. Comete crímenes para obtener botín.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
      {entries.map(([id, qty]) => {
        const item = ITEMS[id];
        if (!item) return null;
        return (
          <div key={id} style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10, padding: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ fontSize: 28 }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 800 }}>{item.name} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>×{qty}</span></div>
                <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: 1 }}>
                  {item.type.toUpperCase()} · Đ{item.sellValue.toLocaleString()}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 8, lineHeight: 1.4 }}>{item.description}</div>
            <div style={{ display: "flex", gap: 6 }}>
              {item.type !== "loot" && (
                <button
                  disabled={inFlight}
                  onClick={() => handleUse(id)}
                  style={{
                    flex: 1, padding: "6px", borderRadius: 6, cursor: inFlight ? "not-allowed" : "pointer",
                    border: "1px solid rgba(34,211,238,0.3)", background: "rgba(34,211,238,0.1)",
                    color: "#22d3ee", fontSize: 10, fontWeight: 700, fontFamily: "var(--font-main)",
                  }}
                >USAR</button>
              )}
              <button
                disabled={inFlight}
                onClick={() => handleSell(id)}
                style={{
                  flex: 1, padding: "6px", borderRadius: 6, cursor: inFlight ? "not-allowed" : "pointer",
                  border: "1px solid rgba(255,215,0,0.3)", background: "rgba(255,215,0,0.08)",
                  color: "#ffd700", fontSize: 10, fontWeight: 700, fontFamily: "var(--font-main)",
                }}
              >VENDER</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Stats tab ─────────────────────────────────────────────
function StatsTab({ snap }: { snap: UnderworldSnapshot }) {
  const { level, current, needed } = xpProgress(snap.xp);
  const successRate = snap.crimesCommitted + snap.crimesFailed > 0
    ? (snap.crimesCommitted / (snap.crimesCommitted + snap.crimesFailed)) * 100
    : 0;

  const rows: [string, string][] = [
    ["Nivel",                `${level}`],
    ["XP total",             `${snap.xp.toLocaleString()} (${current}/${needed})`],
    ["Crímenes completados", `${snap.crimesCommitted}`],
    ["Crímenes fallidos",    `${snap.crimesFailed}`],
    ["Tasa de éxito",        `${successRate.toFixed(1)}%`],
    ["Botín total",          `Đ ${snap.totalLoot.toLocaleString()}`],
    ["Buffs activos",        `${snap.tempBuffs.length}`],
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 1.5, fontWeight: 700, marginBottom: 10 }}>ESTADÍSTICAS</div>
        {(Object.keys(STAT_LABELS) as Stat[]).map((stat) => {
          const base = snap.stats[stat];
          const eff = snap.effectiveStats[stat];
          return (
            <div key={stat} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: 12 }}>{STAT_LABELS[stat].icon} {STAT_LABELS[stat].label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: eff !== base ? "#a78bfa" : "var(--text-primary)" }}>
                {eff.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 1.5, fontWeight: 700, marginBottom: 10 }}>CARRERA CRIMINAL</div>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{k}</span>
            <span style={{ fontSize: 11, fontWeight: 700 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────
export default function UnderworldView() {
  const [tab, setTab] = useState<"crimes" | "gym" | "inventory" | "stats">("crimes");
  const { snapshot, loading, error, fetchState } = useUnderworldStore();

  // Fetch on mount, and refresh every 30s while mounted so regen and jail timers stay reasonably fresh
  useEffect(() => {
    fetchState();
    const id = setInterval(fetchState, 30_000);
    return () => clearInterval(id);
  }, [fetchState]);

  // Also force a UI re-render every second so the bars animate smoothly client-side
  const [, setBeat] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setBeat((b) => b + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (error && !snapshot) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#f43f5e", fontSize: 13 }}>
        No se pudo cargar Underworld: {error}
        <div>
          <button
            onClick={fetchState}
            style={{
              marginTop: 12, padding: "8px 16px", borderRadius: 7,
              background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)",
              color: "#f43f5e", cursor: "pointer", fontWeight: 700,
            }}
          >Reintentar</button>
        </div>
      </div>
    );
  }

  if (!snapshot || loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
        Cargando Underworld…
      </div>
    );
  }

  const tabs: { id: typeof tab; label: string; icon: string }[] = [
    { id: "crimes",    label: "Crímenes",   icon: "🦹" },
    { id: "gym",       label: "Gimnasio",   icon: "🏋" },
    { id: "inventory", label: "Inventario", icon: "🎒" },
    { id: "stats",     label: "Perfil",     icon: "📊" },
  ];

  return (
    <div style={{ color: "var(--text-primary)" }}>
      <UnderworldHeader snap={snapshot} />
      <JailBanner jailUntil={snapshot.jailUntil} />

      <div style={{ display: "flex", gap: 4, marginBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "8px 16px", cursor: "pointer", border: "none",
              background: "transparent",
              borderBottom: `2px solid ${tab === t.id ? "#f43f5e" : "transparent"}`,
              color: tab === t.id ? "#f43f5e" : "var(--text-muted)",
              fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
              fontFamily: "var(--font-main)",
              transition: "all 0.15s",
            }}
          >
            {t.icon} {t.label.toUpperCase()}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {tab === "crimes"    && <CrimesTab snap={snapshot} />}
          {tab === "gym"       && <GymTab snap={snapshot} />}
          {tab === "inventory" && <InventoryTab snap={snapshot} />}
          {tab === "stats"     && <StatsTab snap={snapshot} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
