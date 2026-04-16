import { useEffect, useState, useCallback, Suspense } from "react";
import api from "../lib/api";
import { useGameStore, formatNumber } from "../stores/gameStore";
import { useAuthStore } from "../stores/authStore";
import CityScene from "../components/city/CityScene";

export interface Building {
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
  owner_clan_tag?: string | null;
  display_text: string | null;
  display_image_url: string | null;
  owned_since: string | null;
  for_sale: boolean;
  sale_price: number | null;
}

const TYPE_ICON: Record<string, string> = {
  skyscraper: "🏙️", bank: "🏦", mall: "🏪", office: "🏢", factory: "🏭", landmark: "🏛️",
};
const TYPE_COLOR: Record<string, string> = {
  skyscraper: "#00d4ff", bank: "#f59e0b", mall: "#a78bfa",
  office: "#34d399", factory: "#f97316", landmark: "#f43f5e",
};

function tierOf(price: number): number {
  if (price < 10000)      return 0;
  if (price < 200000)     return 1;
  if (price < 5000000)    return 2;
  if (price < 100000000)  return 3;
  return 4;
}
const TIER_LABEL = ["Barrio", "Negocio", "Empresa", "Corporación", "Nexus"];
const TIER_COLOR = ["#94a3b8", "#34d399", "#00d4ff", "#a78bfa", "#f59e0b"];

function LevelBar({ level }: { level: number }) {
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} style={{
          width: 6, height: i < level ? 10 + i : 6, borderRadius: 2,
          background: i < level ? "#00d4ff" : "rgba(255,255,255,0.08)",
          transition: "all 0.2s",
        }} />
      ))}
    </div>
  );
}

function CustomizeModal({ building, onClose, onSave }: {
  building: Building; onClose: () => void; onSave: () => void;
}) {
  const [text, setText] = useState(building.display_text ?? "");
  const [url, setUrl] = useState(building.display_image_url ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/buildings/${building.id}/customize`, { display_text: text, display_image_url: url });
      onSave();
      onClose();
    } catch (e: any) {
      alert(e.response?.data?.error ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 400, background: "#0d1220", border: "1px solid rgba(0,212,255,0.25)",
        borderRadius: 16, padding: 24,
      }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#00d4ff", marginBottom: 16 }}>
          ✏️ Personalizar — {building.name}
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 5, letterSpacing: 1 }}>MENSAJE / BANNER</div>
          <input value={text} onChange={e => setText(e.target.value)} maxLength={200} placeholder="Ej: Propiedad de NexusCorp™"
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 5, letterSpacing: 1 }}>URL DE IMAGEN (opcional)</div>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..."
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px", borderRadius: 8, cursor: "pointer", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", fontFamily: "inherit" }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: "9px", borderRadius: 8, cursor: "pointer", background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.3)", color: "#00d4ff", fontWeight: 700, fontFamily: "inherit" }}>
            {saving ? "Guardando..." : "💾 Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SaleModal({ building, onClose, onList }: {
  building: Building; onClose: () => void; onList: (price: number) => void;
}) {
  const [price, setPrice] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 360, background: "#0d1220", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#f59e0b", marginBottom: 12 }}>💰 Poner en venta — {building.name}</div>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>Precio mínimo sugerido: Đ {formatNumber(building.base_price)}</div>
        <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder={`Đ ${formatNumber(building.base_price)}`}
          style={{ width: "100%", padding: "9px 12px", borderRadius: 8, boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 14 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px", borderRadius: 8, cursor: "pointer", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", fontFamily: "inherit" }}>Cancelar</button>
          <button onClick={() => { const p = parseFloat(price); if (!isNaN(p) && p > 0) onList(p); }} style={{ flex: 2, padding: "9px", borderRadius: 8, cursor: "pointer", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", fontWeight: 700, fontFamily: "inherit" }}>
            💰 Publicar
          </button>
        </div>
      </div>
    </div>
  );
}

function BuildingCard({ building, myId, myCredits, onAction }: {
  building: Building; myId: string; myCredits: number; onAction: () => void;
}) {
  const isOwner   = building.owner_id === myId;
  const isFree    = !building.owner_id;
  const isForSale = !isOwner && building.for_sale && !!building.owner_id;
  const tier      = tierOf(building.base_price);
  const color     = TYPE_COLOR[building.building_type] ?? "#00d4ff";
  const icon      = TYPE_ICON[building.building_type] ?? "🏢";
  const currentCps = building.cps_base * building.level;
  const upgradeCost = isOwner && building.level < 10
    ? Math.ceil(building.base_price * 1.8 * building.level)
    : null;

  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState("");
  const [showCustomize, setShowCustomize] = useState(false);
  const [showSale, setShowSale] = useState(false);
  const { setServerState } = useGameStore();

  const act = useCallback(async (endpoint: string, body?: object) => {
    setBusy(true); setErr("");
    try {
      const res = await api.post(`/buildings/${building.id}/${endpoint}`, body ?? {});
      if (res.data.success) {
        setServerState({ credits: res.data.credits, creditsPerSecond: res.data.creditsPerSecond });
        onAction();
      }
    } catch (e: any) {
      setErr(e.response?.data?.error ?? `Error`);
    } finally {
      setBusy(false);
    }
  }, [building.id, onAction, setServerState]);

  const buyPrice = isForSale ? building.sale_price! : building.base_price;
  const canAfford = myCredits >= buyPrice;

  return (
    <>
      {showCustomize && isOwner && (
        <CustomizeModal building={building} onClose={() => setShowCustomize(false)} onSave={onAction} />
      )}
      {showSale && isOwner && (
        <SaleModal building={building} onClose={() => setShowSale(false)} onList={price => { setShowSale(false); act("list-for-sale", { price }); }} />
      )}
      <div style={{
        background: isOwner ? "rgba(0,212,255,0.05)" : isFree ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.015)",
        border: `1px solid ${isOwner ? "rgba(0,212,255,0.2)" : isForSale ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 12, padding: "14px 16px",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, background: `${color}18`, border: `1px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
            {icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {building.display_text ? `"${building.display_text}"` : building.name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: `${TIER_COLOR[tier]}20`, color: TIER_COLOR[tier], letterSpacing: 0.5 }}>
                {TIER_LABEL[tier].toUpperCase()}
              </span>
              <span style={{ fontSize: 9, color: "#64748b" }}>{building.building_type}</span>
              {building.for_sale && !isOwner && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "rgba(52,211,153,0.15)", color: "#34d399", letterSpacing: 0.5 }}>EN VENTA</span>
              )}
            </div>
          </div>
          {isOwner && (
            <div style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 5, background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.25)", color: "#00d4ff" }}>TUYO</div>
          )}
          {isOwner && building.for_sale && (
            <div style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 5, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>EN VENTA</div>
          )}
        </div>

        {/* Level bar */}
        {(isOwner || building.owner_id) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 9, color: "#64748b", letterSpacing: 0.5 }}>NIV {building.level}/10</span>
            <LevelBar level={building.level} />
          </div>
        )}

        {/* Owner */}
        {building.owner_id && !isOwner && (
          <div style={{ fontSize: 10, color: "#64748b" }}>
            Propietario: <span style={{ color: building.owner_clan_color ?? "#94a3b8", fontWeight: 700 }}>{building.owner_name}</span>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "flex", gap: 16 }}>
          <div>
            <div style={{ fontSize: 8, color: "#64748b", marginBottom: 2, letterSpacing: 1 }}>INGRESO/SEG</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#34d399" }}>+{formatNumber(currentCps)} Đ/s</div>
          </div>
          {(isFree || isForSale) && (
            <div>
              <div style={{ fontSize: 8, color: "#64748b", marginBottom: 2, letterSpacing: 1 }}>
                {isForSale ? "PRECIO VENTA" : "PRECIO"}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: isForSale ? "#34d399" : "#f59e0b" }}>
                Đ {formatNumber(buyPrice)}
              </div>
            </div>
          )}
          {upgradeCost && (
            <div>
              <div style={{ fontSize: 8, color: "#64748b", marginBottom: 2, letterSpacing: 1 }}>MEJORA</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#a78bfa" }}>Đ {formatNumber(upgradeCost)}</div>
            </div>
          )}
        </div>

        {err && (
          <div style={{ fontSize: 10, color: "#f43f5e", padding: "4px 8px", background: "rgba(244,63,94,0.08)", borderRadius: 5 }}>{err}</div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 6 }}>
          {/* Buy free building */}
          {isFree && (
            <button onClick={() => act("buy")} disabled={busy || !canAfford}
              style={{ flex: 1, padding: "8px", borderRadius: 8, cursor: canAfford ? "pointer" : "not-allowed", background: canAfford ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${canAfford ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.08)"}`, color: canAfford ? "#f59e0b" : "#475569", fontWeight: 700, fontSize: 11, fontFamily: "inherit" }}>
              {busy ? "..." : "🏗️ Comprar"}
            </button>
          )}

          {/* Buy from player */}
          {isForSale && (
            <button onClick={() => act("buy-from-player")} disabled={busy || !canAfford}
              style={{ flex: 1, padding: "8px", borderRadius: 8, cursor: canAfford ? "pointer" : "not-allowed", background: canAfford ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${canAfford ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.08)"}`, color: canAfford ? "#34d399" : "#475569", fontWeight: 700, fontSize: 11, fontFamily: "inherit" }}>
              {busy ? "..." : `🤝 Comprar de ${building.owner_name}`}
            </button>
          )}

          {/* Owner: upgrade */}
          {isOwner && upgradeCost && building.level < 10 && (
            <button onClick={() => act("upgrade")} disabled={busy || myCredits < upgradeCost}
              style={{ flex: 1, padding: "8px", borderRadius: 8, cursor: myCredits >= upgradeCost ? "pointer" : "not-allowed", background: myCredits >= upgradeCost ? "rgba(167,139,250,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${myCredits >= upgradeCost ? "rgba(167,139,250,0.3)" : "rgba(255,255,255,0.08)"}`, color: myCredits >= upgradeCost ? "#a78bfa" : "#475569", fontWeight: 700, fontSize: 11, fontFamily: "inherit" }}>
              {busy ? "..." : `⬆️ Niv ${building.level + 1}`}
            </button>
          )}
          {isOwner && building.level === 10 && (
            <div style={{ flex: 1, padding: "8px", borderRadius: 8, textAlign: "center", background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.15)", fontSize: 10, color: "#00d4ff", fontWeight: 700 }}>✨ MÁXIMO</div>
          )}

          {/* Owner: customize + list/delist */}
          {isOwner && (
            <>
              <button onClick={() => setShowCustomize(true)}
                style={{ padding: "8px 10px", borderRadius: 8, cursor: "pointer", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399", fontSize: 13, fontFamily: "inherit" }}
                title="Personalizar">✏️</button>
              {building.for_sale ? (
                <button onClick={() => act("delist")} disabled={busy}
                  style={{ padding: "8px 10px", borderRadius: 8, cursor: "pointer", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", color: "#f97316", fontSize: 11, fontFamily: "inherit", fontWeight: 700 }}
                  title="Retirar de venta">🚫</button>
              ) : (
                <button onClick={() => setShowSale(true)} disabled={busy}
                  style={{ padding: "8px 10px", borderRadius: 8, cursor: "pointer", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b", fontSize: 13, fontFamily: "inherit" }}
                  title="Poner en venta">💰</button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

type Filter = "all" | "mine" | "free" | "market";
type ViewMode = "3d" | "list";

export default function CityView() {
  const { user } = useAuthStore();
  const { credits } = useGameStore();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<Filter>("all");
  const [search, setSearch]       = useState("");
  const [viewMode, setViewMode]   = useState<ViewMode>("3d");

  const fetchBuildings = useCallback(async () => {
    try {
      const res = await api.get("/buildings");
      setBuildings(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBuildings(); }, [fetchBuildings]);

  const myId = user?.id ?? "";

  const visible = buildings.filter(b => {
    if (filter === "mine"   && b.owner_id !== myId) return false;
    if (filter === "free"   && b.owner_id)           return false;
    if (filter === "market" && !b.for_sale)           return false;
    if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const myBuildings    = buildings.filter(b => b.owner_id === myId);
  const myBuildingCps  = myBuildings.reduce((s, b) => s + b.cps_base * b.level, 0);
  const freeCount      = buildings.filter(b => !b.owner_id).length;
  const marketCount    = buildings.filter(b => b.for_sale && b.owner_id !== myId).length;

  const tabBtn = (id: ViewMode): React.CSSProperties => ({
    padding: "7px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 11,
    border: `1px solid ${viewMode === id ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.08)"}`,
    background: viewMode === id ? "rgba(0,212,255,0.1)" : "transparent",
    color: viewMode === id ? "#00d4ff" : "#64748b", fontFamily: "inherit",
  });

  const filterBtn = (id: Filter, label: string): React.CSSProperties => ({
    flex: 1, padding: "7px 6px", borderRadius: 7, cursor: "pointer",
    border: `1px solid ${filter === id ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.06)"}`,
    background: filter === id ? "rgba(0,212,255,0.08)" : "transparent",
    color: filter === id ? "#00d4ff" : "#64748b",
    fontWeight: 700, fontSize: 10, letterSpacing: 0.5, fontFamily: "inherit",
  });

  // CityScene expects Building from BuildingMesh — cast since our interface is a superset
  const scene3dBuildings = buildings as any[];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header stats */}
      <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
        <div style={{ flex: 1, padding: "12px 16px", borderRadius: 10, background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)" }}>
          <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 1, marginBottom: 4 }}>TUS EDIFICIOS</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#00d4ff" }}>{myBuildings.length}</div>
        </div>
        <div style={{ flex: 2, padding: "12px 16px", borderRadius: 10, background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.15)" }}>
          <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 1, marginBottom: 4 }}>INGRESOS CIUDAD</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#34d399" }}>+{formatNumber(myBuildingCps)} Đ/s</div>
        </div>
        <div style={{ flex: 1, padding: "12px 16px", borderRadius: 10, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}>
          <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 1, marginBottom: 4 }}>EN MERCADO</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#f59e0b" }}>{marketCount}</div>
        </div>
      </div>

      {/* View mode toggle */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button style={tabBtn("3d")} onClick={() => setViewMode("3d")}>🏙️ Ciudad 3D</button>
        <button style={tabBtn("list")} onClick={() => setViewMode("list")}>📋 Gestión</button>
      </div>

      {/* ── 3D View ── */}
      {viewMode === "3d" && (
        <div style={{ flex: 1, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", minHeight: 400 }}>
          {loading ? (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
              Cargando ciudad...
            </div>
          ) : (
            <Suspense fallback={<div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>Iniciando render 3D...</div>}>
              <CityScene buildings={scene3dBuildings} onBidPlaced={fetchBuildings} />
            </Suspense>
          )}
        </div>
      )}

      {/* ── List View ── */}
      {viewMode === "list" && (
        <>
          {/* Filters + search */}
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 4, flex: 1 }}>
              <button style={filterBtn("all",    "Todos")}    onClick={() => setFilter("all")}>TODOS</button>
              <button style={filterBtn("free",   "Libres")}   onClick={() => setFilter("free")}>LIBRES</button>
              <button style={filterBtn("market", "Mercado")}  onClick={() => setFilter("market")}>MERCADO</button>
              <button style={filterBtn("mine",   "Míos")}     onClick={() => setFilter("mine")}>MÍOS</button>
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar..."
              style={{ width: 130, padding: "7px 10px", borderRadius: 7, boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 11, fontFamily: "inherit", outline: "none" }} />
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ textAlign: "center", color: "#64748b", paddingTop: 40 }}>Cargando...</div>
          ) : (
            <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10, alignContent: "start" }}>
              {visible.map(b => (
                <BuildingCard key={b.id} building={b} myId={myId} myCredits={credits} onAction={fetchBuildings} />
              ))}
              {visible.length === 0 && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#64748b", paddingTop: 32, fontStyle: "italic" }}>
                  {filter === "mine" ? "Aún no tienes edificios. ¡Compra el primero!" : filter === "market" ? "No hay edificios en venta ahora mismo." : "Sin resultados"}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
